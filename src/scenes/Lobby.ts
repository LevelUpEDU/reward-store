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
        ],
        layers: [{name: 'ground'}, {name: 'walls'}],
    }

    constructor() {
        super('LobbyScene', Lobby.CONFIG)
    }

    create(): void {
        super.create()
        this.welcomeText()
        this.setCamera()
        this.interactionHandler.updateScale()
    }
    protected createPlayer(): void {
        super.createPlayer(200, 1150, 7)
    }

    protected setCamera(): void {
        super.setCamera(0.75)
    }

    private welcomeText(): void {
        const userName = this.game.registry.get('userName') || 'Student'
        const text = this.add.text(
            1500,
            743,
            `Welcome to LevelUpEDU, ${userName}!`,
            {
                fontFamily: 'CyberPunkFont',
                fontSize: '48px',
                color: '#ffffff',
            }
        )
        text.setOrigin(0.5, 0)
        text.setDepth(1000)
    }

    protected getMovementSpeed(): number {
        return 300
    }
}
