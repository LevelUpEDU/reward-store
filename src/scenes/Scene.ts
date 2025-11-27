import type {
    MapConfig,
    GameScene,
    TiledObject,
    TiledObjectLayer,
    MovementState,
} from '@/types'
import {createCollisionBox} from '@/utils/physics'
import {addPulseEffect} from '@/utils/sprites'
import {InputHandler} from '@/utils/inputHandler'
import {InteractionHandler} from '@/interactions/interactionHandler'
import {RewardPointsUI} from '@/utils/rewardPointsUI'
import {UIManager} from '@/utils/uiManager'
import '@/interactions'

interface SpriteManifest {
    sprites: string[]
}

export class Scene extends Phaser.Scene implements GameScene {
    protected sceneName: string

    // map objects
    protected map: Phaser.Tilemaps.Tilemap
    protected mapConfig: MapConfig
    protected spriteObjects: Set<string> = new Set()
    public collisionGroup!: Phaser.Physics.Arcade.StaticGroup
    // Array to hold custom collision objects (bypassing the buggy Group)
    protected customColliders: Phaser.GameObjects.GameObject[] = []

    protected inputHandler!: InputHandler
    public interactionHandler!: InteractionHandler
    public player!: Phaser.Physics.Arcade.Sprite

    // UI components
    public rewardPointsUI?: RewardPointsUI
    public uiManager!: UIManager

    // input objects
    public cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    protected movementState!: MovementState

    // key is the name of the map, ie "classroom"
    constructor(key: string, mapConfig: MapConfig) {
        super({key})
        this.mapConfig = mapConfig
        this.sceneName = mapConfig.name
    }

    preload(): void {
        this.cache.tilemap.remove(this.sceneName)
        this.cache.json.remove(this.sceneName)

        // get the list of sprite objects for this scene
        const manifestKey = `${this.sceneName}-sprites`

        // TODO: replace with build-time version numbers in production
        // invalidates cache and forces reload of assets
        const cacheBuster =
            process.env.NODE_ENV === 'development' ? `?v=${Date.now()}` : ''
        this.load.json(
            manifestKey,
            `/assets/sprites/${this.sceneName}/manifest.json${cacheBuster}`
        )

        this.load.on(`filecomplete-json-${manifestKey}`, () => {
            const manifest: SpriteManifest = this.cache.json.get(manifestKey)

            // load the objects
            if (manifest && manifest.sprites) {
                manifest.sprites.forEach((spriteName) => {
                    const key = `${this.sceneName}-${spriteName}`
                    this.load.image(
                        key,
                        `/assets/sprites/${this.sceneName}/${spriteName}.png`
                    )
                    this.spriteObjects.add(spriteName)
                })

                this.load.start()
            }
        })

        // UPDATED TILESET LOADING LOOP
        this.mapConfig.tilesets.forEach((tileset) => {
            // Check if frame dimensions are provided in the config
            // We cast to 'any' here to avoid TypeScript errors if MapConfig interface isn't updated yet
            const ts = tileset as any

            if (ts.frameWidth && ts.frameHeight) {
                this.load.spritesheet(tileset.key, tileset.imagePath, {
                    frameWidth: ts.frameWidth,
                    frameHeight: ts.frameHeight,
                })
            } else {
                this.load.image(tileset.key, tileset.imagePath)
            }
        })

        // tilemap
        this.load.tilemapTiledJSON(this.sceneName, this.mapConfig.tilemapPath)

        // player
        this.load.aseprite(
            'bob',
            '/assets/sprites/Bob_run_16x16-sheet.png',
            '/assets/sprites/Bob_run_16x16.json'
        )

        // UI assets
        this.load.image('coin-icon', '/assets/sprites/coin.png')

        this.load.on('complete', () => {
            this.mapConfig.tilesets.forEach((tileset) => {
                const tex = this.textures.get(tileset.key)
                if (tex) {
                    tex.setFilter(Phaser.Textures.FilterMode.NEAREST)
                }
            })
        })

        // menu assets
        this.load.font(
            'CyberPunkFont',
            '/assets/fonts/CyberpunkCraftpixPixel.otf'
        )

        // Menu tilemap backgrounds
        this.load.tilemapTiledJSON('rewardsMap', '/assets/rewards/rewards.json')
        this.load.image(
            'Interface windows',
            '/assets/tilemaps/Interface windows.png'
        )
        this.load.tilemapTiledJSON(
            'subScreenMap',
            '/assets/rewards/rewards_subscreen.json'
        )
        this.load.tilemapTiledJSON('shopMap', '/assets/rewards/shop.json')

        // Shop tilesets
        this.load.image('FrameMap', '/assets/tilemaps/FrameMap.png')
        this.load.spritesheet(
            'button_yellow_left',
            '/assets/tilemaps/button_yellow_left.png',
            {frameWidth: 32, frameHeight: 32}
        )
        this.load.image(
            'button_yellow_right',
            '/assets/tilemaps/button_yellow_right.png'
        )
    }

    create(): void {
        this.createMap()
        this.createPlayer()
        this.setCamera()
        this.interactionHandler = new InteractionHandler(this)
        this.inputHandler = new InputHandler(this, this.getMovementSpeed())

        this.createTiledObjects('object')

        this.createInteractables()
        if (this.customColliders.length > 0) {
            this.physics.add.collider(this.player, this.customColliders)
        }

        this.setupInput()

        this.setupRewardPointsUI().catch((err) => {
            console.error('Error setting up reward points UI:', err)
        })

        this.createCollisions()
        this.uiManager = new UIManager(this)
        this.uiManager.initialize()
        this.setupUICamera()
        this.setupMobileMenuButton()
    }

    /* for adding images - images are stored in /public/assets/sprites/{sceneName}/
     * **must** be added to the manifest.json file in that folder - ie for "chalkboard.png":
     * {
     * "sprites": [
     * "chalkboard"
     * ]
     * }
     */
    protected addSpriteToScene(
        obj: TiledObject
    ): Phaser.GameObjects.Image | null {
        if (!obj.name) return null

        if (this.spriteObjects.has(obj.name)) {
            const key = `${this.sceneName}-${obj.name}`
            const sprite = this.add.image(obj.x, obj.y, key)

            if (obj.rotation) {
                // convert Tiled degrees to radians for Phaser
                const rotationRadians = Phaser.Math.DegToRad(obj.rotation)

                // rotate around bottom left corner
                sprite.setOrigin(0, 1)
                sprite.setRotation(rotationRadians)

                sprite.setPosition(obj.x, obj.y + sprite.height)
            } else {
                sprite.setOrigin(0, 0)
            }

            return sprite
        }
        return null
    }

    protected createMap(): void {
        // this.map = this.add.tilemap('map')
        this.map = this.add.tilemap(this.sceneName)

        // Populate all tilesets into an array
        const allTilesets: Phaser.Tilemaps.Tileset[] = []
        this.mapConfig.tilesets.forEach((tilesetConfig) => {
            const tileset = this.map.addTilesetImage(
                tilesetConfig.name,
                tilesetConfig.key
            )
            if (tileset) {
                allTilesets.push(tileset)
            }
        })

        // Add each layer, passing ALL tilesets (Phaser will use only the relevant ones)
        this.mapConfig.layers.forEach((layerConfig) => {
            if (allTilesets.length > 0) {
                this.map.createLayer(layerConfig.name, allTilesets)
            }
        })

        // 2. SET PHYSICS WORLD BOUNDS TO MATCH MAP
        // This stops the player from walking "outside the frame"
        this.physics.world.setBounds(
            0,
            0,
            this.map.widthInPixels,
            this.map.heightInPixels
        )
    }

    protected createPlayer(
        x: number = 400,
        y: number = 300,
        scale: number = 2
    ): void {
        // Check if animations for 'bob' already exist
        if (!this.anims.exists('walk_right')) {
            this.anims.createFromAseprite('bob')
        }
        this.player = this.physics.add.sprite(x, y, 'bob')
        this.player.setScale(scale)
    }

    protected createCollisions(): void {
        const collisionLayer = this.map.getObjectLayer(
            'Collisions'
        ) as TiledObjectLayer | null

        if (collisionLayer) {
            this.collisionGroup = this.physics.add.staticGroup()

            collisionLayer.objects.forEach((obj) => {
                if (obj.width > 0 && obj.height > 0 && obj.visible) {
                    const collisionRect = createCollisionBox(
                        this,
                        obj.x + obj.width / 2,
                        obj.y + obj.height / 2,
                        obj.width,
                        obj.height
                    )
                    this.collisionGroup.add(collisionRect)
                }
            })

            this.physics.add.collider(this.player, this.collisionGroup)
        }
    }

    /**
     * Handles visual objects defined in Tiled Object Layers (e.g. furniture with GIDs)
     */
    // Updated createTiledObjects using customColliders (Safe Mode)
    protected createTiledObjects(layerName: string): void {
        const objectLayer = this.map.getObjectLayer(
            layerName
        ) as TiledObjectLayer | null
        if (!objectLayer) return

        objectLayer.objects.forEach((obj) => {
            if (obj.gid === undefined) return
            if (obj.gid >= 2216) return // Skip furniture (handled in Lobby)

            const tileset = this.map.tilesets.find(
                (t) => obj.gid! >= t.firstgid && obj.gid! < t.firstgid + t.total
            )

            if (!tileset) return

            if (tileset.image && this.textures.exists(tileset.name)) {
                try {
                    const relativeId = obj.gid - tileset.firstgid
                    const sprite = this.add.sprite(
                        obj.x!,
                        obj.y!,
                        tileset.name,
                        relativeId
                    )

                    if (sprite) {
                        sprite.setOrigin(0, 1)
                        if (obj.width && obj.height)
                            sprite.setDisplaySize(obj.width, obj.height)
                        sprite.setDepth(sprite.y)

                        // Collision Box
                        const width = obj.width || sprite.width
                        const height = obj.height || sprite.height
                        const collisionHeight = height * 0.3
                        const collisionY = obj.y! - collisionHeight / 2
                        const collisionX = obj.x! + width / 2

                        const collider = this.add.rectangle(
                            collisionX,
                            collisionY,
                            width,
                            collisionHeight,
                            0x000000,
                            0
                        )

                        this.physics.add.existing(collider, true)
                        this.customColliders.push(collider)
                    }
                } catch (err) {
                    console.warn(`Failed object GID ${obj.gid}`, err)
                }
            }
        })
    }

    // Updated createInteractables using customColliders (Safe Mode)
    protected createInteractables(): void {
        const interactableLayer = this.map.getObjectLayer(
            'Interactable'
        ) as TiledObjectLayer | null

        if (interactableLayer) {
            interactableLayer.objects.forEach((obj) => {
                const sprite = this.addSpriteToScene(obj)
                if (sprite) {
                    sprite.setInteractive()

                    const shouldPulse = obj.properties?.pulseColor ?? true

                    if (shouldPulse) {
                        const pulseColor =
                            obj.properties?.pulseColor ?
                                parseInt(
                                    obj.properties.pulseColor.replace('#', '0x')
                                )
                            :   undefined

                        addPulseEffect(this, sprite, pulseColor)
                    }

                    this.interactionHandler.createInteractionFromTiled(
                        obj,
                        sprite
                    )

                    const isPassable = obj.properties?.passable ?? true

                    if (!isPassable) {
                        const bounds = sprite.getBounds()
                        const collisionRect = createCollisionBox(
                            this,
                            bounds.centerX,
                            bounds.centerY,
                            bounds.width,
                            bounds.height
                        )
                        if (!collisionRect.body) {
                            this.physics.add.existing(collisionRect, true)
                        }
                        this.customColliders.push(collisionRect)
                    }
                }
            })
        }
    }

    public getInputHandler(): InputHandler {
        return this.inputHandler
    }

    protected setupInput(): void {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const shouldMove =
                this.interactionHandler.handlePointerPress(pointer)
            if (shouldMove) {
                this.inputHandler.setTargetPosition(
                    pointer.worldX,
                    pointer.worldY
                )
            }
        })

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            this.inputHandler.updateTargetPosition(
                pointer.worldX,
                pointer.worldY
            )
        })

        this.input.on('pointerup', () => {
            this.inputHandler.releaseTarget()
        })

        // stop movement if the mouse leaves the window
        this.input.on('pointerout', () => {
            this.inputHandler.releaseTarget()
        })

        this.input.on('pointerupoutside', () => {
            this.inputHandler.releaseTarget()
        })
    }

    protected setCamera(scale: number = 1): void {
        const camera = this.cameras.main
        camera.startFollow(this.player, true, 0.1, 0.1) // smooth follow
        camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
        camera.setZoom(scale) // adjust zoom for how close/far you want it
        camera.roundPixels = true // keeps pixel art crisp
    }

    protected async setupRewardPointsUI(): Promise<void> {
        this.rewardPointsUI = new RewardPointsUI(this)

        // Try to get user email and fetch points
        const userEmail = this.getUserEmail()
        if (userEmail) {
            this.rewardPointsUI.fetchAndUpdatePoints(userEmail)
        } else {
            // If no user email, show 0 points
            this.rewardPointsUI.setPoints(0)
        }
    }
    // add a hamburger menu on mobile to open the menu
    protected setupMobileMenuButton(): void {
        // check touch capability before adding this menu
        if (!this.sys.game.device.input.touch) return

        const menuButton = this.add.text(20, 20, '☰', {
            fontSize: '48px',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: {x: 12, y: 8},
        })
        menuButton.setScrollFactor(0)
        menuButton.setDepth(1000)
        menuButton.setInteractive({useHandCursor: true})
        menuButton.on('pointerdown', () => {
            this.uiManager?.toggleMenu()
        })

        // main camera should ignore this button
        this.cameras.main.ignore(menuButton)
    }
    protected setupUICamera(): void {
        const uiCam = this.cameras.add(0, 0, 1920, 1080)
        uiCam.setScroll(0, 0)
        uiCam.setZoom(1)
        uiCam.setName('uiCamera')

        // ui camera
        uiCam.ignore(this.player)

        // ignore tilemap layers, sprites, interactables, collision groups
        // and any prompts from interactable objects
        this.map.layers.forEach((layer) => {
            if (layer.tilemapLayer) {
                uiCam.ignore(layer.tilemapLayer)
            }
        })
        if (this.interactionHandler) {
            uiCam.ignore(this.interactionHandler.getUIElements())
        }
        if (this.collisionGroup) {
            uiCam.ignore(this.collisionGroup.getChildren())
        }
        if (this.interactionHandler?.interactionGroup) {
            uiCam.ignore(this.interactionHandler.interactionGroup.getChildren())
        }
        this.children.list.forEach((child) => {
            if (child instanceof Phaser.GameObjects.Image) {
                uiCam.ignore(child)
            }
        })
    }

    public getUserEmail(): string {
        const email = this.game.registry.get('userEmail')
        if (email) {
            return email
        }

        return 'dev@example.com'
    }

    /**
     * Update the reward points UI with new points value
     * Call this after the player earns or spends points
     */
    public updateRewardPoints(newPoints: number): void {
        if (this.rewardPointsUI) {
            this.rewardPointsUI.animatePointsChange(newPoints)
        }
    }

    /**
     * Refresh the reward points from the API
     */
    public async refreshRewardPoints(): Promise<void> {
        const userEmail = this.getUserEmail()
        if (userEmail && this.rewardPointsUI) {
            await this.rewardPointsUI.fetchAndUpdatePoints(userEmail)
        }
    }

    shutdown(): void {
        // Remove animations for 'bob'
        this.anims.remove('walk_right')
        this.anims.remove('walk_up')
        this.anims.remove('walk_left')
        this.anims.remove('walk_down')
        this.uiManager?.destroy()
    }

    update(): void {
        if (!this.player) return
        if (this.interactionHandler.isMovementBlocked()) {
            const body = this.player.body as Phaser.Physics.Arcade.Body
            body.setVelocity(0, 0)
            this.player.stop()
            return
        }

        this.inputHandler.update(this.player)
        this.interactionHandler.update()
    }

    protected getMovementSpeed(): number {
        return 100
    }
}
