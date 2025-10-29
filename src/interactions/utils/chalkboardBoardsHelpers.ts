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
    boardNames: string[]
    activeBoard: number
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
        boardNames,
        activeBoard,
    } = opts
    const arrowSize = Math.max(48, Math.round(titleSizeNum * 1.4))
    // Move arrows further from center by increasing offset
    const arrowOffset =
        (scene.scale.width * styles.interfaceWidthRatio) / 2 -
        styles.layout.padding / 2 +
        24 // increase 16px further from center
    const arrowLeftX = centerX - arrowOffset
    const arrowRightX = centerX + arrowOffset
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

    // Board name labels under arrows (store references for dynamic update)
    const labelFontSize = Math.round(arrowSize * 0.28) // smaller font size
    const labelYOffset = arrowSize * 0.7 // slightly closer to arrow
    const leftLabel = scene.add
        .text(arrowLeftX, arrowY + labelYOffset, '', {
            fontSize: `${labelFontSize}px`,
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5, 0)
        .setDepth(styles.depths.selector + 2)
    const rightLabel = scene.add
        .text(arrowRightX, arrowY + labelYOffset, '', {
            fontSize: `${labelFontSize}px`,
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5, 0)
        .setDepth(styles.depths.selector + 2)
    elements.push(leftLabel, rightLabel)

    function updateLabels(activeIdx: number) {
        const leftBoardIdx =
            (activeIdx - 1 + boardNames.length) % boardNames.length
        const rightBoardIdx = (activeIdx + 1) % boardNames.length
        leftLabel.setText(boardNames[leftBoardIdx])
        rightLabel.setText(boardNames[rightBoardIdx])
    }
    updateLabels(activeBoard)

    function highlightArrow(which: 'left' | 'right') {
        const arrow = which === 'left' ? leftArrow : rightArrow
        scene.tweens.add({
            targets: arrow,
            scale: 1.18,
            duration: 80,
            yoyo: true,
            ease: 'Quad.Out',
        })
    }

    return {
        leftArrow,
        rightArrow,
        leftLabel,
        rightLabel,
        updateLabels,
        highlightArrow,
    }
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
