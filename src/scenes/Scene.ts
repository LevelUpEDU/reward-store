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
import '@/interactions'

interface SpriteManifest {
    sprites: string[]
}

// Define a type for scene with user data
interface SceneWithUser extends Phaser.Scene {
    userEmail?: string
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
    protected rewardPointsUI?: RewardPointsUI

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
    }

    create(): void {
        this.createMap()
        this.createPlayer()
        this.setCamera()
        this.createCollisions()
        this.inputHandler = new InputHandler(this, 100)
        this.interactionHandler = new InteractionHandler(this)

        // Handle specific object layers from Tiled (like 'object' in lobby3.json)
        this.createTiledObjects('object')

        // Handle logical interactables (like legacy setup)
        this.createInteractables()

        this.setupInput()
        // Call setupRewardPointsUI asynchronously
        this.setupRewardPointsUI().catch((err) => {
            console.error('Error setting up reward points UI:', err)
        })
        this.setupRewardPointsUI()

        // 1. REGISTER CUSTOM COLLIDERS (Walls, Furniture, etc)
        if (this.customColliders.length > 0) {
            this.physics.add.collider(this.player, this.customColliders)
        }
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
                // Check if it's a tile layer (not an object layer) before creating
                const layerData = this.map.getLayer(layerConfig.name)
                if (layerData) {
                    this.map.createLayer(layerConfig.name, allTilesets)
                }
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

    protected createPlayer(): void {
        // Check if animations for 'bob' already exist
        if (!this.anims.exists('walk_right')) {
            this.anims.createFromAseprite('bob')
        }
        this.player = this.physics.add.sprite(400, 300, 'bob')
        this.player.setScale(2)
        this.player.setDepth(10) // Ensure player renders above floor

        // 3. ENABLE PLAYER WORLD BOUNDS COLLISION
        this.player.setCollideWorldBounds(true)
    }

    protected createCollisions(): void {
        const collisionLayer = this.map.getObjectLayer(
            'Collisions'
        ) as TiledObjectLayer | null

        if (collisionLayer) {
            // We use the customColliders array instead of collisionGroup
            // to avoid the StaticGroup.add() crash with Rectangles

            collisionLayer.objects.forEach((obj) => {
                if (obj.width > 0 && obj.height > 0 && obj.visible) {
                    const collisionRect = createCollisionBox(
                        this,
                        obj.x + obj.width / 2,
                        obj.y + obj.height / 2,
                        obj.width,
                        obj.height
                    )

                    // Ensure physics is enabled
                    if (!collisionRect.body) {
                        this.physics.add.existing(collisionRect, true)
                    }

                    // Add to safe array instead of Group
                    this.customColliders.push(collisionRect)
                }
            })

            // Note: We don't need to call physics.add.collider here because
            // the Scene.create() method already does this:
            // this.physics.add.collider(this.player, this.customColliders)
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
                    let pulseColor = undefined
                    if (obj.properties?.pulseColor) {
                        pulseColor = parseInt(
                            obj.properties.pulseColor.replace('#', '0x')
                        )
                    }
                    addPulseEffect(this, sprite, pulseColor)
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

    protected setCamera(): void {
        const camera = this.cameras.main
        camera.startFollow(this.player, true, 0.1, 0.1) // smooth follow
        camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)
        // camera.setZoom(1) // adjust zoom for how close/far you want it
        camera.roundPixels = true // keeps pixel art crisp
    }

    protected async setupRewardPointsUI(): Promise<void> {
        this.rewardPointsUI = new RewardPointsUI(this)

        // Try to get user email and fetch points
        const userEmail = await this.getUserEmail()
        if (userEmail) {
            this.rewardPointsUI.fetchAndUpdatePoints(userEmail)
        } else {
            // If no user email, show 0 points
            this.rewardPointsUI.setPoints(0)
        }
    }

    protected async getUserEmail(): Promise<string | undefined> {
        // Check if userEmail is set on the scene
        const sceneWithUser = this as unknown as SceneWithUser
        if (sceneWithUser.userEmail) {
            return sceneWithUser.userEmail
        }

        // Default student email for development
        let devStudent = 'kamal@my.bcit.ca'

        // Try to get from environment or process (for development)
        try {
            // Fetch user email from Auth0 /api/auth/me endpoint
            const res = await fetch('/api/auth/me')
            if (res.ok) {
                const data = await res.json()
                if (data?.email) {
                    return data.email
                }
            }
        } catch (err) {
            console.warn('Failed to fetch user email from Auth0:', err)
        }

        // Fallback: Check if userEmail is set on the scene
        const sceneWithUser = this as unknown as SceneWithUser
        if (sceneWithUser.userEmail) {
            return sceneWithUser.userEmail
        }

        return undefined
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
        const userEmail = await this.getUserEmail()
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
}
