interface BaseTiledLayer {
    id: number
    name: string
    opacity: number
    visible: boolean
    x: number
    y: number
}

export interface TiledObjectLayer extends BaseTiledLayer {
    type: 'objectgroup'
    draworder: 'topdown'
    objects: TiledObject[]
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
