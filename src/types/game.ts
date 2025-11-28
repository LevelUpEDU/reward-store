export interface TilesetConfig {
    name: string
    imagePath: string
    key: string
}

export interface LayerConfig {
    name: string
}

export interface MapConfig {
    name: string
    tilemapPath: string
    tilesets: TilesetConfig[]
    layers: LayerConfig[]
}

export interface GameScene extends Phaser.Scene {
    player: Phaser.Physics.Arcade.Sprite
    cursors: Phaser.Types.Input.Keyboard.CursorKeys
    collisionGroup: Phaser.Physics.Arcade.StaticGroup
}

export interface MovementState {
    left: boolean
    right: boolean
    up: boolean
    down: boolean
}
