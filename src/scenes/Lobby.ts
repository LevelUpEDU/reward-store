import {Scene} from '@/scenes/Scene'
import type {MapConfig} from '@/types'

export class Lobby extends Scene {
    private rewardsMap?: Phaser.Tilemaps.Tilemap
    private rewardsLayer?: Phaser.Tilemaps.TilemapLayer | null
    private rewardsVisible = false
    private badgesText?: Phaser.GameObjects.Text // Add text object for badges
    private rewardsText?: Phaser.GameObjects.Text // Add text object for rewards
    private interactKey?: Phaser.Input.Keyboard.Key // Add variable for 'E' key
    private interactiveObject?: Phaser.GameObjects.Rectangle // Add variable for interactive object
    private escKey?: Phaser.Input.Keyboard.Key // Explicitly declare escKey as a class property

    // Sample data for badges and rewards (replace with actual data source)
    private playerData = {
        badges: ['Math Master', 'Science Star', 'History Hero'], // Example badges
        rewards: [
            'Gold Star',
            'Bonus Points: 500',
            'Certificate of Excellence',
        ], // Example rewards
    }

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
        // Add interactive object
        this.setupInteractiveObject() // New method call
    }

    private setupRewardsOverlay(): void {
        // Initialize escKey if not already set
        if (!this.escKey) {
            this.escKey = this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.ESC
            )
        }

        // Remove any existing listeners to prevent duplicates
        this.escKey.off('down')
        this.escKey.on('down', () => {
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

        // Add Badges and Rewards text
        const badgeList =
            this.playerData.badges.length > 0 ?
                this.playerData.badges.join('\n')
            :   'No badges earned yet'
        const rewardList =
            this.playerData.rewards.length > 0 ?
                this.playerData.rewards.join('\n')
            :   'No rewards earned yet'

        // Create or update badges text
        if (!this.badgesText) {
            this.badgesText = this.add.text(
                300, // Adjust x position
                200, // Adjust y position
                `Badges Earned:\n${badgeList}`,
                {
                    fontSize: '24px',
                    color: '#ffffff',
                    backgroundColor: '#00000080', // Semi-transparent black background
                    padding: {x: 10, y: 10},
                    wordWrap: {width: 300},
                }
            )
            this.badgesText.setScrollFactor(0) // Fixed to camera
        } else {
            this.badgesText.setText(`Badges Earned:\n${badgeList}`)
            this.badgesText.setVisible(true)
        }

        // Create or update rewards text
        if (!this.rewardsText) {
            this.rewardsText = this.add.text(
                600, // Adjust x position
                200, // Adjust y position
                `Rewards Earned:\n${rewardList}`,
                {
                    fontSize: '24px',
                    color: '#ffffff',
                    backgroundColor: '#00000080',
                    padding: {x: 10, y: 10},
                    wordWrap: {width: 300},
                }
            )
            this.rewardsText.setScrollFactor(0)
        } else {
            this.rewardsText.setText(`Rewards Earned:\n${rewardList}`)
            this.rewardsText.setVisible(true)
        }
    }

    private hideRewardsOverlay(): void {
        if (this.rewardsLayer) {
            this.rewardsLayer.setVisible(false)
        }
        if (this.badgesText) {
            this.badgesText.setVisible(false)
        }
        if (this.rewardsText) {
            this.rewardsText.setVisible(false)
        }
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

    private setupInteractiveObject(): void {
        // Create a rectangular object (you can replace with a sprite if desired)
        this.interactiveObject = this.add.rectangle(
            600, // x position (adjust as needed)
            600, // y position (adjust as needed)
            64, // width
            64, // height
            0xff0000, // red color for visibility
            0.5 // semi-transparent
        )

        // Add physics to the object
        this.physics.add.existing(this.interactiveObject, true) // true = static object

        // Ensure the player is defined and has a physics body
        if (this.player && this.player.body) {
            // Add overlap detection between player and interactive object
            this.physics.add.overlap(
                this.player,
                this.interactiveObject,
                this.handleInteraction,
                undefined,
                this
            )
        } else {
            console.error('Player or player.body is not defined')
        }

        // Initialize interactKey if not already set
        if (!this.interactKey) {
            // Set up the 'E' key
            this.interactKey = this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.E
            )
        }

        // Remove any existing listeners to prevent duplicates
        this.interactKey.off('down')
        this.interactKey.on('down', () => {
            // Only trigger if overlapping
            if (
                this.physics.world.overlap(this.player, this.interactiveObject)
            ) {
                this.rewardsVisible = !this.rewardsVisible
                if (this.rewardsVisible) {
                    this.showRewardsOverlay()
                } else {
                    this.hideRewardsOverlay()
                }
            }
        })
    }

    private handleInteraction(): void {
        // add later
    }
}
