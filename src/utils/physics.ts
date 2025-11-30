export function createCollisionBox(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    originX: number = 0.5,
    originY: number = 0.5,
    rotationDegrees?: number
): Phaser.GameObjects.Rectangle {
    const collisionRect = scene.add.rectangle(
        x,
        y,
        width,
        height,
        0xff0000, // bright red (for debug)
        0 // invisible
    )

    collisionRect.setOrigin(originX, originY)

    if (rotationDegrees !== undefined) {
        collisionRect.setRotation(Phaser.Math.DegToRad(rotationDegrees))
    }

    scene.physics.add.existing(collisionRect, true)

    return collisionRect
}
