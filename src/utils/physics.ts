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

/**
 * Create collision borders around an object (top, left, right - no bottom)
 * This prevents player from stepping on top or walking through sides,
 * but allows approach from the bottom
 */
export function createCollisionBorders(
    scene: Phaser.Scene,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    borderWidth: number = 10
): Phaser.GameObjects.Rectangle[] {
    const borders: Phaser.GameObjects.Rectangle[] = []

    // Calculate object bounds (assuming center origin)
    const left = centerX - width / 2
    const right = centerX + width / 2
    const top = centerY - height / 2
    // const bottom = centerY + height / 2 // Not used - no bottom border

    // Top border - full width, prevents walking over from above
    const topBorder = createCollisionBox(
        scene,
        centerX, // center X
        top - borderWidth / 2, // above the object
        width,
        borderWidth
    )
    borders.push(topBorder)

    // Left border - full height, prevents walking through from left
    const leftBorder = createCollisionBox(
        scene,
        left - borderWidth / 2, // left of the object
        centerY, // center Y
        borderWidth,
        height
    )
    borders.push(leftBorder)

    // Right border - full height, prevents walking through from right
    const rightBorder = createCollisionBox(
        scene,
        right + borderWidth / 2, // right of the object
        centerY, // center Y
        borderWidth,
        height
    )
    borders.push(rightBorder)

    // No bottom border - allows approach from below

    return borders
}
