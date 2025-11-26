import {Scene} from './Scene'
import type {MapConfig} from '@/types'

export class Classroom extends Scene {
    public courseId?: number
    public userEmail?: string

    private static readonly CONFIG: MapConfig = {
        name: 'classroom',
        tilemapPath: '/api/maps/classroom',
        tilesets: [
            {
                name: 'Room_Builder_free_32x32',
                imagePath: '/assets/tilemaps/Room_Builder_free_32x32.png',
                key: 'roomBuilder',
            },
            {
                name: 'Interiors_free_32x32',
                imagePath: '/assets/tilemaps/Interiors_free_32x32.png',
                key: 'interiors',
            },
        ],
        layers: [
            {name: 'Floor', tilesetKey: 'roomBuilder'},
            {name: 'Horizontal Walls', tilesetKey: 'roomBuilder'},
            {name: 'Vertical Walls', tilesetKey: 'roomBuilder'},
            {name: 'Shadows', tilesetKey: 'roomBuilder'},
            {name: 'Tables', tilesetKey: 'interiors'},
            {name: 'Chairs', tilesetKey: 'interiors'},
            {name: 'Chairs Left', tilesetKey: 'interiors'},
            {name: 'Chairs Right', tilesetKey: 'interiors'},
            {name: 'Decorations', tilesetKey: 'interiors'},
            {name: 'Doors', tilesetKey: 'interiors'},
        ],
    }

    constructor() {
        super('ClassroomScene', Classroom.CONFIG)
    }

    init(data?: {courseId?: number; userEmail?: string}): void {
        if (data) {
            this.courseId = data.courseId
            this.userEmail = data.userEmail
            console.error('Classroom initialized with:', data)
        }
    }

    create(): void {
        super.create()
        this.setCameraResolution()
        this.defineSceneTransitions()
    }

    private setCameraResolution(): void {
        const targetWidth = 800
        const targetHeight = 600

        // Resize Phaser canvas
        this.scale.resize(targetWidth, targetHeight)

        // Center the canvas in the browser window
        this.scale.displaySize.setAspectRatio(targetWidth / targetHeight)
        this.scale.refresh()

        // Adjust camera to match new size
        const cam = this.cameras.main
        cam.setViewport(0, 0, targetWidth, targetHeight)

        // Optional: center camera on classroom map
        const worldCenterX = this.map.widthInPixels / 2
        const worldCenterY = this.map.heightInPixels / 2
        cam.centerOn(worldCenterX, worldCenterY)
    }

    private defineSceneTransitions(): void {
        // Example of transition triggers
        const portals = [
            {x: 705, y: 100, width: 64, height: 64, target: 'LobbyScene'},
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
