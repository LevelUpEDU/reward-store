interface BaseTiledLayer {
    id: number
    name: string
    opacity: number
    visible: boolean
    x: number
    y: number
}

export interface TiledTileLayer extends BaseTiledLayer {
    type: 'tilelayer'
    data: string
    encoding: 'base64'
    compression?: string
    width: number
    height: number
    offsetx?: number
    offsety?: number
}

export interface TiledObjectLayer extends BaseTiledLayer {
    type: 'objectgroup'
    draworder: 'topdown'
    objects: TiledObject[]
}

// represents both types of layers combined
export type TiledLayer = TiledTileLayer | TiledObjectLayer

export interface TiledMapData {
    compressionlevel: number
    height: number
    width: number
    infinite: boolean
    layers: TiledLayer[]
    nextlayerid: number
    nextobjectid: number
    orientation: string
    renderorder: string
    tiledversion: string
    tileheight: number
    tilewidth: number
    type: 'map'
    version: string
    tilesets: TiledTileset[]
}

export interface TiledTileset {
    columns: number
    firstgid: number
    image: string
    imageheight: number
    imagewidth: number
    margin: number
    name: string
    spacing: number
    tilecount: number
    tileheight: number
    tilewidth: number
}

export interface TiledObject {
    id: number
    name: string
    x: number
    y: number
    width: number
    height: number
    visible: boolean
    rotation: number
    type: string
    gid?: number
    properties?: {
        passable?: boolean
        eventType?: string
        active?: boolean
        displayName?: string
        pulseColor?: string
        tooltip?: string
        target?: string
    }
}
