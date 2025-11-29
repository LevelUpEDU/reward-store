import type {TiledMapData} from '@/types'

export class MapLoader {
    static async fetchMapData(mapName: string): Promise<TiledMapData> {
        try {
            const response = await fetch(`/api/maps/${mapName}`)
            if (!response.ok) throw new Error(`Failed to load map: ${mapName}`)
            return await response.json()
        } catch (error) {
            throw error
        }
    }
}
