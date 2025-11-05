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

        // tilesets
        this.mapConfig.tilesets.forEach((tileset) => {
            this.load.image(tileset.key, tileset.imagePath)
        })

        // tilemap
        // this.load.tilemapTiledJSON('map', this.mapConfig.tilemapPath)
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
                this.textures
                    .get(tileset.key)
                    .setFilter(Phaser.Textures.FilterMode.NEAREST)
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

        this.createInteractables()

        this.setupInput()
        this.setupRewardPointsUI()
    }

    /* for adding images - images are stored in /public/assets/sprites/{sceneName}/
     * **must** be added to the manifest.json file in that folder - ie for "chalkboard.png":
     *    {
     *      "sprites": [
     *        "chalkboard"
     *      ]
     *    }
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
                // layer?.setScale(0.5)
            }
        })
    }

    protected createPlayer(): void {
        // Check if animations for 'bob' already exist
        if (!this.anims.exists('walk_right')) {
            this.anims.createFromAseprite('bob')
        }
        this.player = this.physics.add.sprite(400, 300, 'bob')
        this.player.setScale(2)
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

    protected createInteractables(): void {
        const interactableLayer = this.map.getObjectLayer(
            'Interactable'
        ) as TiledObjectLayer | null

        if (interactableLayer) {
            interactableLayer.objects.forEach((obj) => {
                const sprite = this.addSpriteToScene(obj)
                if (sprite) {
                    sprite.setInteractive()

                    const pulseColor =
                        obj.properties?.pulseColor ?
                            parseInt(
                                obj.properties.pulseColor.replace('#', '0x')
                            )
                        :   undefined

                    addPulseEffect(this, sprite, pulseColor)
                    this.interactionHandler.createInteractionFromTiled(
                        obj,
                        sprite
                    )
                    const isPassable = obj.properties?.passable ?? true

                    if (!isPassable) {
                        if (!this.collisionGroup) {
                            this.collisionGroup = this.physics.add.staticGroup()
                            this.physics.add.collider(
                                this.player,
                                this.collisionGroup
                            )
                        }

                        // create a rect overtop of the object and use it to create a collision box
                        const bounds = sprite.getBounds()
                        const collisionRect = createCollisionBox(
                            this,
                            bounds.centerX,
                            bounds.centerY,
                            bounds.width,
                            bounds.height
                        )

                        this.collisionGroup.add(collisionRect)
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

    protected setupRewardPointsUI(): void {
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

    protected getUserEmail(): string | undefined {
        // Check if userEmail is set on the scene
        const sceneWithUser = this as unknown as SceneWithUser
        if (sceneWithUser.userEmail) {
            return sceneWithUser.userEmail
        }

        // Default student email for development
        let devStudent = 'zion_li@my.bcit.ca'

        // Try to get from environment or process (for development)
        try {
            if (typeof process !== 'undefined') {
                const proc = process as unknown as
                    | {env?: Record<string, string | undefined>}
                    | undefined
                const envEmail =
                    proc?.env?.DEV_STUDENT_EMAIL ||
                    proc?.env?.NEXT_PUBLIC_DEV_STUDENT_EMAIL
                if (typeof envEmail === 'string' && envEmail.length > 0) {
                    devStudent = envEmail
                }
            }
        } catch {
            // ignore
        }

        return devStudent
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
