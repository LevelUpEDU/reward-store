import {chalkboardStyles as styles} from '../styles/chalkboardStyles'
import {createMenuNavigation} from '@/utils/menuNavigation'
import {createQuestUI} from './chalkboardQuestList'
import type {Scene as ProjectScene} from '@/scenes/Scene'

// minimal raw quest shape used when mapping server data to the internal Quest type
type RawQuest = {
    id?: number
    title?: string
    points?: number
    done?: boolean
    submissionId?: number | null
    submissionStatus?: string | null
}

type SceneLike = Phaser.Scene
type GameObjectWithBounds = Phaser.GameObjects.GameObject & {
    getBounds?: () => Phaser.Geom.Rectangle
}
type MountBoardsOptions = {
    scene: SceneLike
    elements: Phaser.GameObjects.GameObject[]
    overlay: Phaser.GameObjects.GameObject
    border: GameObjectWithBounds
    title: Phaser.GameObjects.Text
    boards: {name: string; quests: Array<{id?: number; done?: boolean}>}[]
    listStartX: number
    listStartY: number
    doneX: number
    originalCleanup: (nav?: {cleanup?: () => void}) => void
}

export function mountBoards(options: MountBoardsOptions) {
    const {
        scene,
        elements,
        overlay,
        border,
        title,
        boards,
        listStartX,
        listStartY,
        doneX,
        originalCleanup,
    } = options

    let activeBoard = 0
    let boardElements: Phaser.GameObjects.GameObject[] = []
    let boardNav: ReturnType<typeof createMenuNavigation> | null = null
    let boardQuestUI: ReturnType<typeof createQuestUI> | null = null
    let _cleanedUp = false

    const centerX = scene.scale.width / 2
    const centerY = scene.scale.height / 2

    const titleSizeNum = parseFloat(String(styles.typography.titleSize)) || 24
    let subtitleY =
        centerY - (scene.scale.height * styles.interfaceHeightRatio) / 2 + 24
    try {
        const tb = title.getBounds()
        subtitleY = tb.y + tb.height + 12
    } catch {
        /* ignore */
    }

    // Predeclare variables that extendedCleanup references to avoid use-before-define lint errors.
    let leftKey: Phaser.Input.Keyboard.Key | null = null
    let rightKey: Phaser.Input.Keyboard.Key | null = null
    let aKey: Phaser.Input.Keyboard.Key | null = null
    let dKey: Phaser.Input.Keyboard.Key | null = null
    let leftArrow: Phaser.GameObjects.Text | null = null
    let rightArrow: Phaser.GameObjects.Text | null = null
    let cleanupBoard: (() => void) | null = null

    // create subtitle early so extendedCleanup can safely reference it
    let subtitle = scene.add
        .text(centerX, subtitleY, '', {
            fontSize: `${Math.round(titleSizeNum * 0.6)}px`,
            color: styles.colors.titleText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.text + 1)
    elements.push(subtitle)

    // hoist extendedCleanup as a function declaration so it can be referenced before its textual location
    // predeclare navigation handler placeholders so extendedCleanup can refer to them safely
    let nextBoard: () => void = () => {
        /* assigned later */
    }
    let prevBoard: () => void = () => {
        /* assigned later */
    }
    function extendedCleanup(): void {
        if (_cleanedUp) return
        try {
            console.warn('[chalkboardBoards] extendedCleanup start')
        } catch {}
        _cleanedUp = true
        // remove keyboard bindings for board navigation and destroy Key objects
        try {
            if (leftKey) leftKey.off('down', prevBoard)
        } catch {}
        try {
            if (rightKey) rightKey.off('down', nextBoard)
        } catch {}
        try {
            if (aKey) aKey.off('down', prevBoard)
        } catch {}
        try {
            if (dKey) dKey.off('down', nextBoard)
        } catch {}
        // Do NOT destroy shared Key objects - only remove handlers. Destroying shared keys breaks global input.
        // destroy arrow UI
        try {
            if (leftArrow) leftArrow.destroy()
        } catch {}
        try {
            if (rightArrow) rightArrow.destroy()
        } catch {}
        // destroy subtitle and any board elements
        try {
            if (cleanupBoard) cleanupBoard()
        } catch {}
        try {
            if (subtitle) subtitle.destroy()
        } catch {}
        // remove overlay pointer handler if present
        try {
            const anyOverlay = overlay as unknown as {
                removeAllListeners?: (event?: string) => void
            }
            if (typeof anyOverlay.removeAllListeners === 'function')
                anyOverlay.removeAllListeners('pointerdown')
        } catch {}
        // call the original cleanup which will destroy remaining UI and unblock interaction handler
        try {
            originalCleanup(undefined)
        } catch {}
        // ensure movement is unblocked in case originalCleanup path did not complete
        try {
            ;(
                scene as unknown as {
                    interactionHandler?: {unblockMovement?: () => void}
                }
            ).interactionHandler?.unblockMovement?.()
        } catch {
            /* ignore */
        }
        try {
            const ih = (
                scene as unknown as {
                    inputHandler?: {unblockMovement?: () => void}
                }
            ).inputHandler
            if (ih && typeof ih.unblockMovement === 'function')
                ih.unblockMovement()
        } catch {
            /* ignore */
        }
    }

    cleanupBoard = () => {
        if (boardNav) {
            try {
                boardNav.cleanup()
            } catch {
                /* ignore */
            }
            boardNav = null
        }
        boardQuestUI = null
        boardElements.forEach((el) => el.destroy())
        boardElements = []
    }

    const showBoard = (index: number, fadeIn = false) => {
        const idx = ((index % boards.length) + boards.length) % boards.length
        activeBoard = idx
        cleanupBoard()
        // if extended cleanup has already run, don't attempt to show a board
        if (_cleanedUp) return
        const b = boards[activeBoard]
        try {
            subtitle.setText(`${b.name} (${b.quests.length})`)
        } catch {
            // Defensive: in rare cases Phaser may throw when updating text (internal texture/context issue).
            // Recreate the text object to avoid crashing the game.
            try {
                subtitle.destroy()
            } catch {
                /* ignore */
            }
            try {
                subtitle = scene.add
                    .text(
                        centerX,
                        subtitleY,
                        `${b.name} (${b.quests.length})`,
                        {
                            fontSize: `${Math.round(titleSizeNum * 0.6)}px`,
                            color: styles.colors.titleText,
                            fontFamily: styles.typography.fontFamily,
                        }
                    )
                    .setOrigin(0.5)
                    .setDepth(styles.depths.text + 1)
                elements.push(subtitle)
            } catch {
                /* fallback: can't create subtitle; ignore to avoid crash */
            }
        }
        const localDoneStates = b.quests.map((q) => Boolean(q.done))
        const showDone =
            activeBoard === 0 && (boards[0]?.quests?.length ?? 0) > 0
        if (activeBoard === 0 && b.quests.length === 0) {
            const emptyText = scene.add
                .text(centerX, listStartY + 60, 'No quests available', {
                    fontSize: styles.typography.emptyMessageSize,
                    color: styles.colors.titleText,
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5)
                .setDepth(styles.depths.text + 1)
            boardElements.push(emptyText)
            elements.push(emptyText)
        } else {
            // If showing Done column for Available board, add a header label above the column
            if (showDone) {
                try {
                    const doneLabel = scene.add
                        .text(
                            doneX,
                            listStartY - styles.layout.doneLabelOffsetY,
                            'Done',
                            {
                                fontSize: styles.typography.doneLabelSize,
                                color: styles.colors.doneLabel,
                                fontFamily: styles.typography.fontFamily,
                            }
                        )
                        .setOrigin(0.5)
                        .setDepth(styles.depths.text + 1)
                    boardElements.push(doneLabel)
                    elements.push(doneLabel)
                } catch {
                    /* ignore header creation failure */
                }
            }
            // createQuestUI expects Quest[] with title/points; map minimally to avoid TS errors while keeping runtime data
            const mappedQuests = (b.quests || []).map(
                (q: RawQuest, idx: number) => ({
                    id: q?.id,
                    title: q?.title ?? `Quest ${idx + 1}`,
                    points: typeof q?.points === 'number' ? q.points : 0,
                    done: Boolean(q?.done),
                    submissionId: q?.submissionId ?? null,
                    submissionStatus: q?.submissionStatus ?? null,
                })
            )
            // createQuestUI expects the project's Scene type; cast defensively to avoid type mismatch here
            boardQuestUI = createQuestUI(
                scene as unknown as ProjectScene,
                mappedQuests,
                localDoneStates,
                listStartX,
                listStartY,
                doneX,
                showDone
            )
            boardElements.push(...boardQuestUI.elements)
            elements.push(...boardQuestUI.elements)
            boardNav = createMenuNavigation({
                scene,
                itemCount: b.quests.length,
                onSelectionChange: (i) => {
                    if (boardQuestUI) boardQuestUI.updateVisuals(i)
                },
                onSelect: (i) => {
                    if (boardQuestUI) boardQuestUI.toggleDone(i)
                },
                // ensure full cleanup (destroy keys, UI) when menu requests close
                onClose: () => extendedCleanup(),
            })
            if (typeof boardQuestUI.navigationSetter === 'function') {
                boardQuestUI.navigationSetter(boardNav!)
            }
        }

        // overlay may have been destroyed; guard calls that rely on its internal `sys`.
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
                        maybeOverlay.on('pointerdown', ((
                            ...args: unknown[]
                        ) => {
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
        if (boardQuestUI) boardQuestUI.updateVisuals(0)
        if (fadeIn && boardElements.length > 0) {
            try {
                boardElements.forEach((el) => {
                    try {
                        const maybe = el as unknown as {
                            setAlpha?: (a: number) => void
                        }
                        if (typeof maybe.setAlpha === 'function')
                            maybe.setAlpha(0)
                    } catch {
                        /* ignore */
                    }
                })
                scene.tweens.add({
                    targets: boardElements,
                    alpha: 1,
                    duration: 240,
                    ease: 'Quad.Out',
                })
            } catch {
                /* ignore */
            }
        }
    }

    // arrows
    const arrowSize = Math.max(32, Math.round(titleSizeNum * 0.8))
    const arrowLeftX =
        centerX -
        (scene.scale.width * styles.interfaceWidthRatio) / 2 +
        styles.layout.padding / 2
    const arrowRightX =
        centerX +
        (scene.scale.width * styles.interfaceWidthRatio) / 2 -
        styles.layout.padding / 2
    const arrowY = centerY
    leftArrow = scene.add
        .text(arrowLeftX, arrowY, '◀', {
            fontSize: `${arrowSize}px`,
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.selector + 2)
        .setInteractive({cursor: 'pointer'})
    rightArrow = scene.add
        .text(arrowRightX, arrowY, '▶', {
            fontSize: `${arrowSize}px`,
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.selector + 2)
        .setInteractive({cursor: 'pointer'})
    if (leftArrow) {
        leftArrow.on('pointerover', () => leftArrow!.setScale(1.08))
        leftArrow.on('pointerout', () => leftArrow!.setScale(1))
    }
    if (rightArrow) {
        rightArrow.on('pointerover', () => rightArrow!.setScale(1.08))
        rightArrow.on('pointerout', () => rightArrow!.setScale(1))
    }
    const isDialogOpen = () => {
        try {
            if (boardQuestUI?.isDialogActive?.()) return true
            const flag = (
                scene as unknown as {data?: Phaser.Data.DataManager}
            ).data?.get?.('__dialogActive__')
            return Boolean(flag)
        } catch {
            return false
        }
    }
    // now that isDialogOpen is declared, wire the navigation handlers
    nextBoard = () => {
        if (isDialogOpen()) return
        showBoard(activeBoard + 1)
    }
    prevBoard = () => {
        if (isDialogOpen()) return
        showBoard(activeBoard - 1)
    }

    if (leftArrow)
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
                showBoard(activeBoard - 1)
            }
        )
    if (rightArrow)
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
                showBoard(activeBoard + 1)
            }
        )
    if (leftArrow) elements.push(leftArrow)
    if (rightArrow) elements.push(rightArrow)
    // keys
    leftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
    rightKey = scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.RIGHT
    )
    aKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    dKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    // navigation functions are hoisted above; use them here
    leftKey.on('down', prevBoard)
    rightKey.on('down', nextBoard)
    aKey.on('down', prevBoard)
    dKey.on('down', nextBoard)
    // show initial
    showBoard(0, true)
}
