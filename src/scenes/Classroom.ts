import {Scene} from './Scene'
import {CLASSROOM_SPAWN} from './constants'
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
        }
    }

    protected createPlayer(): void {
        super.createPlayer(
            CLASSROOM_SPAWN.x,
            CLASSROOM_SPAWN.y,
            CLASSROOM_SPAWN.scale
        )
    }

    protected setCamera(): void {
        const cam = this.cameras.main
        cam.setZoom(CLASSROOM_SPAWN.cameraZoom)
        cam.centerOn(this.map.widthInPixels / 2, this.map.heightInPixels / 2)
        cam.roundPixels = true
    }
}
