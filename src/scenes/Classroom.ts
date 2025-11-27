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

    init(data?: {courseId?: number; userEmail?: string}): void {
        if (data) {
            this.courseId = data.courseId
            this.userEmail = data.userEmail
            console.error('Classroom initialized with:', data)
        }

        // Resize screen immediately
        const targetWidth = 800
        const targetHeight = 600
        this.scale.resize(targetWidth, targetHeight)
        this.scale.displaySize.setAspectRatio(targetWidth / targetHeight)
        this.scale.refresh()
    }

    create(): void {
        super.create()
        this.setResolution()
        this.setCamera()
    }
    protected createPlayer(): void {
        super.createPlayer(670, 120, 2)
    }

    private setResolution(): void {
        const cam = this.cameras.main
        const worldCenterX = this.map.widthInPixels / 2
        const worldCenterY = this.map.heightInPixels / 2
        cam.centerOn(worldCenterX, worldCenterY)
    }

    protected setCamera(): void {
        const cam = this.cameras.main
        cam.setViewport(0, 0, 1920, 1080)
        cam.setZoom(1.8)
        cam.centerOn(this.map.widthInPixels / 2, this.map.heightInPixels / 2)
        cam.roundPixels = true
    }
}
