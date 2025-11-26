import {Scene} from './Scene'
import type {MapConfig} from '@/types'

export class Classroom extends Scene {
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
            {name: 'Floor'},
            {name: 'Horizontal Walls'},
            {name: 'Vertical Walls'},
            {name: 'Shadows'},
            {name: 'Tables'},
            {name: 'Chairs'},
            {name: 'Chairs Left'},
            {name: 'Chairs Right'},
            {name: 'Decorations'},
        ],
    }

    constructor() {
        super('ClassroomScene', Classroom.CONFIG)
    }

    create(): void {
        super.create()
        this.setCameraResolution()
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
}
