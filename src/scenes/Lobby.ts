import {Scene} from './Scene'
import type {MapConfig} from '@/types'

export class Lobby extends Scene {
    private static readonly CONFIG: MapConfig = {
        name: 'lobby',
        tilemapPath: '/api/maps/lobby3',
        tilesets: [
            {
                name: 'Carpet',
                imagePath: '/assets/tilemaps/carpet.png',
                key: 'carpet',
            },
            {
                name: 'Room_Builder_free_32x32',
                imagePath: '/assets/tilemaps/room-builder-extruded.png',
                key: 'screen',
            },
            {
                name: 'strokespritesheet20133',
                imagePath: '/assets/tilemaps/strokespritesheet20133.png',
                key: 'borders',
            },
            {
                name: 'Walls',
                imagePath: '/assets/tilemaps/walls-extruded.png',
                key: 'walls',
            },
            // 'Objects' is a Collection of Images in Tiled, handled manually in preload/create
            // We don't load it as a standard tileset here because it has no single image source
        ],
        layers: [{name: 'ground'}, {name: 'props'}, {name: 'walls'}],
    }

    constructor() {
        super('LobbyScene', Lobby.CONFIG)
    }

    create(): void {
        super.create()
        this.setCamera()
        this.interactionHandler.updateScale()
    }
    protected createPlayer(): void {
        super.createPlayer(200, 1150, 7)
    }

    protected setCamera(): void {
        super.setCamera(0.75)
    }

    protected getMovementSpeed(): number {
        return 300
    }
}
