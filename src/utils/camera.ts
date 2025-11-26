export function worldToScreen(
    camera: Phaser.Cameras.Scene2D.Camera,
    x: number,
    y: number
): {x: number; y: number} {
    return {
        x: (x - camera.scrollX) * camera.zoom,
        y: (y - camera.scrollY) * camera.zoom,
    }
}
