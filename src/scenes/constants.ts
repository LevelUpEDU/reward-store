/**
 * Default constants for scene configuration
 * These can be overridden in individual scene classes
 */

export const SCENE_DEFAULTS = {
    player: {
        x: 400,
        y: 300,
        scale: 2,
        speed: 100,
    },
    camera: {
        smoothing: 0.1,
        zoom: 1,
    },
} as const

/**
 * Lobby-specific spawn points and configuration
 */
export const LOBBY_SPAWN = {
    x: 200,
    y: 1150,
    scale: 7,
    speed: 300,
    cameraZoom: 0.75,
} as const

/**
 * Classroom-specific spawn points and configuration
 */
export const CLASSROOM_SPAWN = {
    x: 670,
    y: 120,
    scale: 2,
    cameraZoom: 1.8,
    viewportX: 1920,
    viewportY: 1080,
} as const
