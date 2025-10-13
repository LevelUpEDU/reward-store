import {Scene} from '@/scenes/Scene'
import type {MapConfig} from '@/types'

export class Lobby extends Scene {
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

    create(): void {
        super.create()
        // Example: Add custom text or interactions
        const text = this.add.text(600, 100, 'Welcome to the Lobby!', {
            fontSize: '50px',
            color: '#fff',
        })
        text.setScrollFactor(0)

        // Define transitions to other scenes
        this.defineSceneTransitions()
    }

    private defineSceneTransitions(): void {
        // Example of transition triggers
        const portals = [
            {x: 400, y: 200, width: 64, height: 64, target: 'ClassroomScene'},
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
