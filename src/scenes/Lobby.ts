import {Scene} from './Scene'
import type {MapConfig} from '@/types'

export class Lobby extends Scene {
    private static readonly CONFIG: MapConfig = {
        name: 'lobby',
        tilemapPath: '/api/maps/lobby',
        tilesets: [
            {
                name: 'Carpet',
                imagePath: '/assets/tilemaps/carpet.png',
                key: 'carpet',
            },
            {
                name: 'Classroom Props Second Spritesheet 4',
                imagePath: '/assets/tilemaps/classroom_props1.png',
                key: 'classroomProps1',
            },
            {
                name: 'Classroom Second Spritesheet 5',
                imagePath: '/assets/tilemaps/classroom_props2.png',
                key: 'classroomProps2',
            },
            {
                name: 'Office_Furniture1',
                imagePath: '/assets/tilemaps/office_furniture1.png',
                key: 'officeFurniture1',
            },
            {
                name: 'Office_Furniture2',
                imagePath: '/assets/tilemaps/office_furniture2.png',
                key: 'officeFurniture2',
            },
            {
                name: 'Office_Furniture3',
                imagePath: '/assets/tilemaps/office_furniture3.png',
                key: 'officeFurniture3',
            },
            {
                name: 'Office_Furniture4',
                imagePath: '/assets/tilemaps/office_furniture4.png',
                key: 'officeFurniture4',
            },
            {
                name: 'Office_Furniture5',
                imagePath: '/assets/tilemaps/office_furniture5.png',
                key: 'officeFurniture5',
            },
            {
                name: 'Props_1',
                imagePath: '/assets/tilemaps/props_1.png',
                key: 'props1',
            },
            {
                name: 'Props_2',
                imagePath: '/assets/tilemaps/props_2.png',
                key: 'props2',
            },
            {
                name: 'Room_Builder_free_32x32',
                imagePath: '/assets/tilemaps/Room_Builder_free_32x32.png',
                key: 'screen',
            },
            {
                name: 'strokespritesheet20133',
                imagePath: '/assets/tilemaps/strokespritesheet20133.png',
                key: 'borders',
            },
            {
                name: 'Walls',
                imagePath: '/assets/tilemaps/walls.png',
                key: 'walls',
            },
        ],
        layers: [
            {name: 'ground'},
            {name: 'props'},
            {name: 'furniture'},
            {name: 'walls'},
        ],
    }

    constructor() {
        super('LobbyScene', Lobby.CONFIG)
    }

    create(): void {
        super.create()
        //this.setCameraResolution()
        //this.defineSceneTransitions()
    }
    protected createPlayer(): void {
        super.createPlayer(1500, 800, 6)
    }

    protected setCamera(): void {
        super.setCamera(0.75)
    }
}
