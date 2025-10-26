import {Scene} from '@/scenes/Scene'
import type {MapConfig} from '@/types'

export class Lobby extends Scene {
    private rewardsMap?: Phaser.Tilemaps.Tilemap
    private rewardsLayer?: Phaser.Tilemaps.TilemapLayer | null
    private rewardsVisible = false

    private static readonly CONFIG: MapConfig = {
        name: 'lobby',
        tilemapPath: '/api/maps/lobby',
        tilesets: [
            {
                name: 'carpet_spritesheet',
                imagePath: '/assets/tilemaps/carpet spritesheet.png',
                key: 'groundLayer',
            },
            {
                name: 'CGS_Urban_A5',
                imagePath: '/assets/tilemaps/CGS_Urban_A5.png',
                key: 'wallsLayer-2',
            },
            {
                name: 'Classroom Second Spritesheet 5',
                imagePath:
                    '/assets/tilemaps/Classroom Second Spritesheet 5.png',
                key: 'furnitureLayer-2',
            },
            {
                name: 'Room_Builder_free_32x32',
                imagePath: '/assets/tilemaps/Room_Builder_free_32x32.png',
                key: 'wallsLayer',
            },
            {
                name: 'Art Room Spritesheet 3',
                imagePath: '/assets/tilemaps/Art Room Spritesheet 3.png',
                key: 'furnitureLayer',
            },
            {
                name: 'Cafeteria First Spritesheet 1',
                imagePath: '/assets/tilemaps/Cafeteria First Spritesheet 1.png',
                key: 'extraLayer2',
            },
            {
                name: 'Cafeteria First Spritesheet 3',
                imagePath: '/assets/tilemaps/Cafeteria First Spritesheet 3.png',
                key: 'extraLayer4',
            },
            {
                name: 'chckerboard spritesheet',
                imagePath: '/assets/tilemaps/chckerboard spritesheet.png',
                key: 'extraLayer6',
            },
            {
                name: 'Chemistry Lab First Spritesheet 8',
                imagePath:
                    '/assets/tilemaps/Chemistry Lab First Spritesheet 8.png',
                key: 'propsLayer',
            },
            {
                name: 'Chemistry Lab Second Spritesheet 8',
                imagePath:
                    '/assets/tilemaps/Chemistry Lab Second Spritesheet 8.png',
                key: 'extraLayer3',
            },
            {
                name: 'Classroom Props Second Spritesheet 4',
                imagePath:
                    '/assets/tilemaps/Classroom Props Second Spritesheet 4.png',
                key: 'propsLayer-2',
            },
            {
                name: 'Computer Room Spritesheet 5',
                imagePath: '/assets/tilemaps/Computer Room Spritesheet 5.png',
                key: 'furnitureLayer-3',
            },
            {
                name: 'Principal Office Second Spritesheet 5',
                imagePath:
                    '/assets/tilemaps/Principal Office Second Spritesheet 5.png',
                key: 'extraLayer5',
            },
            {
                name: 'strokespritesheet20133',
                imagePath: '/assets/tilemaps/strokespritesheet20133.png',
                key: 'extraLayer1',
            },
        ],
        layers: [
            {name: 'ground', tilesetKey: 'groundLayer'},
            {name: 'walls', tilesetKey: 'wallsLayer'},
            {name: 'furniture', tilesetKey: 'furnitureLayer'},
            {name: 'props', tilesetKey: 'propsLayer'},
        ],
    }

    constructor() {
        super('LobbyScene', Lobby.CONFIG)
    }

    preload(): void {
        super.preload?.()

        // Load the rewards map and its tileset
        this.load.tilemapTiledJSON(
            'rewardsMap',
            '/assets/tilemaps/rewards.json'
        )
        this.load.image(
            'Interface windows',
            '/assets/tilemaps/Interface windows.png'
        )
    }

    create(): void {
        super.create()
        this.setCameraResolution()
        this.welcomeText()
        this.defineSceneTransitions()
        // Add rewards map toggle
        this.setupRewardsOverlay()
    }

    private setupRewardsOverlay(): void {
        const escKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.ESC
        )

        escKey.on('down', () => {
            this.rewardsVisible = !this.rewardsVisible
            if (this.rewardsVisible) {
                this.showRewardsOverlay()
            } else {
                this.hideRewardsOverlay()
            }
        })
    }

    private showRewardsOverlay(): void {
        if (!this.rewardsMap) {
            // Create the rewards map from JSON
            this.rewardsMap = this.make.tilemap({key: 'rewardsMap'})

            // The first argument must match the "name" in rewards.json → "Interface windows"
            // The second argument must match the key you used in this.load.image()
            const tileset = this.rewardsMap.addTilesetImage(
                'Interface windows', // Tiled name
                'Interface windows' // Phaser image key
            )

            if (!tileset) {
                console.error('Failed to load tileset for rewards map')
                return
            }

            this.rewardsLayer = this.rewardsMap.createLayer(
                'base_layer',
                tileset,
                0,
                0
            )

            // UI overlay styling
            this.rewardsLayer!.setScrollFactor(0)
            this.rewardsLayer!.setScale(2.5)
            this.rewardsLayer!.setAlpha(0.9)
            this.rewardsLayer!.setPosition(200, 100)
        } else {
            this.rewardsLayer?.setVisible(true)
        }
    }

    private hideRewardsOverlay(): void {
        this.rewardsLayer?.setVisible(false)
    }

    private setCameraResolution(): void {
        const cam = this.cameras.main
        const lobbyWidth = 1920
        const lobbyHeight = 1080

        this.scale.resize(lobbyWidth, lobbyHeight)
        this.scale.displaySize.setAspectRatio(lobbyWidth / lobbyHeight)
        this.scale.refresh()

        cam.setViewport(0, 0, lobbyWidth, lobbyHeight)

        // Zoom OUT to see more of the map
        cam.setZoom(0.8) // 0.5 = zoomed out, 1 = normal, 2 = zoomed in
        cam.startFollow(this.player, true, 0.1, 0.1) // smooth follow
    }

    private welcomeText(): void {
        // Example: Add custom text or interactions
        const text = this.add.text(1000, 100, 'Welcome to the Lobby!\nKD', {
            fontSize: '60px',
            color: '#fff',
        })
        text.setScrollFactor(1)
    }

    // Define transitions to other scenes
    private defineSceneTransitions(): void {
        const portals = [
            {x: 400, y: 400, width: 64, height: 64, target: 'ClassroomScene'},
        ]

        portals.forEach((portal) => {
            const rect = this.add.rectangle(
                portal.x,
                portal.y,
                portal.width,
                portal.height,
                0x00ff00,
                0.3
            )
            this.physics.add.existing(rect, true)
            this.physics.add.overlap(
                this.player,
                rect,
                () => {
                    this.transitionTo(portal.target)
                },
                undefined,
                this
            )
        })
    }

    private transitionTo(targetSceneKey: string): void {
        this.cameras.main.fadeOut(800, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(targetSceneKey)
        })
    }
}
