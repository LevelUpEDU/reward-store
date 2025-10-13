interface SmallStyles {
    interfaceWidthRatio: number
    layout: {padding: number}
    typography: {fontFamily: string}
    colors: {questText: string}
    depths: {selector: number}
}

export function createArrows(opts: {
    scene: Phaser.Scene
    centerX: number
    titleSizeNum: number
    styles: SmallStyles
    elements: Phaser.GameObjects.GameObject[]
    onLeft: () => void
    onRight: () => void
    isDialogOpen: () => boolean
}) {
    const {
        scene,
        centerX,
        titleSizeNum,
        styles,
        elements,
        onLeft,
        onRight,
        isDialogOpen,
    } = opts
    const arrowSize = Math.max(32, Math.round(titleSizeNum * 0.8))
    const arrowLeftX =
        centerX -
        (scene.scale.width * styles.interfaceWidthRatio) / 2 +
        styles.layout.padding / 2
    const arrowRightX =
        centerX +
        (scene.scale.width * styles.interfaceWidthRatio) / 2 -
        styles.layout.padding / 2
    const arrowY = scene.scale.height / 2

    const leftArrow = scene.add
        .text(arrowLeftX, arrowY, '◀', {
            fontSize: `${arrowSize}px`,
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.selector + 2)
        .setInteractive({cursor: 'pointer'})

    const rightArrow = scene.add
        .text(arrowRightX, arrowY, '▶', {
            fontSize: `${arrowSize}px`,
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.selector + 2)
        .setInteractive({cursor: 'pointer'})

    leftArrow.on('pointerover', () => leftArrow.setScale(1.08))
    leftArrow.on('pointerout', () => leftArrow.setScale(1))
    rightArrow.on('pointerover', () => rightArrow.setScale(1.08))
    rightArrow.on('pointerout', () => rightArrow.setScale(1))

    leftArrow.on(
        'pointerdown',
        (
            _p: Phaser.Input.Pointer,
            _x: number,
            _y: number,
            e: Phaser.Types.Input.EventData
        ) => {
            try {
                e.stopPropagation()
            } catch {}
            if (isDialogOpen()) return
            onLeft()
        }
    )
    rightArrow.on(
        'pointerdown',
        (
            _p: Phaser.Input.Pointer,
            _x: number,
            _y: number,
            e: Phaser.Types.Input.EventData
        ) => {
            try {
                e.stopPropagation()
            } catch {}
            if (isDialogOpen()) return
            onRight()
        }
    )

    elements.push(leftArrow, rightArrow)

    return {leftArrow, rightArrow}
}

export function bindOverlayPointer(opts: {
    overlay: unknown
    border: {getBounds?: () => Phaser.Geom.Rectangle}
    extendedCleanup: () => void
    originalCleanup: (nav?: {cleanup?: () => void}) => void
    boardNav?: {cleanup?: () => void} | null
    scene: Phaser.Scene
}) {
    const {overlay, border, extendedCleanup, originalCleanup, boardNav} = opts
    try {
        type MaybeOverlay = {
            scene?: unknown
            setInteractive?: (...args: unknown[]) => unknown
            removeAllListeners?: (event?: string) => void
            on?: (
                event: string,
                handler: (...args: unknown[]) => unknown
            ) => unknown
        }
        const maybeOverlay = overlay as unknown as MaybeOverlay
        if (
            maybeOverlay &&
            typeof maybeOverlay.setInteractive === 'function' &&
            (maybeOverlay as MaybeOverlay).scene
        ) {
            maybeOverlay.setInteractive()
            try {
                if (typeof maybeOverlay.removeAllListeners === 'function')
                    maybeOverlay.removeAllListeners('pointerdown')
            } catch {}
            try {
                if (typeof maybeOverlay.on === 'function') {
                    maybeOverlay.on('pointerdown', ((...args: unknown[]) => {
                        const pointer = args[0] as Phaser.Input.Pointer
                        try {
                            const bounds =
                                border.getBounds && border.getBounds()
                            if (
                                !bounds ||
                                !bounds.contains(pointer.x, pointer.y)
                            ) {
                                extendedCleanup()
                            }
                        } catch {
                            originalCleanup(boardNav || undefined)
                        }
                    }) as unknown as (...args: unknown[]) => unknown)
                }
            } catch {}
        }
    } catch {}
}
