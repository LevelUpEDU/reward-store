import type {Scene} from '@/scenes/Scene'
import type {
    SmallQuest,
    StylesLike,
    BoardState,
    ShowBoardContext,
} from './chalkboardBoardTypes'
import {createQuestSubmittedHandler} from './chalkboardBoardRefresh'
import {
    renderDoneLabel,
    renderEmptyMessage,
    mapQuests,
    renderQuestList,
} from './chalkboardBoardRendering'

/**
 * Updates the subtitle text with current board name and quest count.
 * Handles Text object recreation if setText fails.
 */
function updateSubtitle(
    scene: Scene,
    state: BoardState,
    boardName: string,
    questCount: number,
    centerX: number,
    subtitleY: number,
    titleSizeNum: number,
    styles: StylesLike,
    elements: Phaser.GameObjects.GameObject[]
): void {
    const text = `${boardName} (${questCount})`

    try {
        if (state.subtitle) state.subtitle.setText(text)
    } catch {
        // setText failed, recreate the Text object
        try {
            if (state.subtitle) state.subtitle.destroy()
        } catch {}
        try {
            const s = scene.add
                .text(centerX, subtitleY, text, {
                    fontSize: `${Math.round(titleSizeNum * 0.6)}px`,
                    color: styles.colors.titleText,
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5)
                .setDepth((styles.depths.text ?? 0) + 1)
            elements.push(s)
            state.setSubtitle(s)
        } catch {
            // Fail silently if recreation fails
        }
    }
}

/**
 * Binds overlay pointer events to handle click-outside-to-close.
 */
function bindOverlayEvents(
    overlay: unknown,
    border: {getBounds?: () => Phaser.Geom.Rectangle},
    originalCleanup: (nav?: {cleanup?: () => void}) => void,
    extendedCleanup: () => void,
    state: BoardState
): void {
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
            maybeOverlay.scene
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
                            originalCleanup(state.boardNav || undefined)
                        }
                    }) as unknown as (...args: unknown[]) => unknown)
                }
            } catch {}
        }
    } catch {
        // Fail silently if overlay binding fails
    }
}

/**
 * Applies fade-in animation to board elements.
 */
function applyFadeIn(
    scene: Scene,
    boardElements: Phaser.GameObjects.GameObject[]
): void {
    try {
        boardElements.forEach((el) => {
            try {
                const maybe = el as unknown as {setAlpha?: (a: number) => void}
                if (typeof maybe.setAlpha === 'function') maybe.setAlpha(0)
            } catch {}
        })
        scene.tweens.add({
            targets: boardElements,
            alpha: 1,
            duration: 240,
            ease: 'Quad.Out',
        })
    } catch {
        // Fail silently if animation fails
    }
}

/**
 * Creates the showBoard function that handles board switching logic.
 * This is the main entry point for rendering a board.
 *
 * @param context - All dependencies needed for board rendering
 * @returns Function that renders a specific board by index
 */
export function createShowBoard(context: ShowBoardContext) {
    const {
        scene,
        elements,
        listStartX,
        listStartY,
        doneX,
        styles,
        titleSizeNum,
        centerX,
        subtitleY,
        originalCleanup,
        createQuestUI,
        createMenuNavigation,
        state,
        extendedCleanup,
        isCleanedUp,
        overlay,
        border,
        refreshQuests,
    } = context

    return function showBoard(index: number, fadeIn = false) {
        // Get fresh boards reference
        const boards = state.getBoards()

        // Calculate board index with wrap-around
        const idx = ((index % boards.length) + boards.length) % boards.length
        state.activeBoard = idx

        // Clean up previous board
        if (state.cleanupBoard) state.cleanupBoard()
        if (isCleanedUp()) return

        // Get current board data
        const board = boards[state.activeBoard]

        // Update subtitle
        updateSubtitle(
            scene,
            state,
            board.name,
            board.quests.length,
            centerX,
            subtitleY,
            titleSizeNum,
            styles,
            elements
        )

        // Prepare quest data
        const localDoneStates = board.quests.map((q: SmallQuest) =>
            Boolean(q.done)
        )
        const showDone =
            state.activeBoard === 0 && (boards[0]?.quests?.length ?? 0) > 0

        // Handle empty Available board
        if (state.activeBoard === 0 && board.quests.length === 0) {
            renderEmptyMessage(
                scene,
                centerX,
                listStartY,
                styles,
                state,
                elements
            )
        } else {
            // Render Done column label for Available board
            if (showDone) {
                renderDoneLabel(
                    scene,
                    doneX,
                    listStartY,
                    styles,
                    state,
                    elements
                )
            }

            // Map quest data
            const mappedQuests = mapQuests(board.quests)

            // Create refresh handler
            const handleQuestSubmitted = createQuestSubmittedHandler(
                refreshQuests,
                state,
                showBoard,
                isCleanedUp
            )

            // Render quest list and navigation
            renderQuestList(
                scene,
                board,
                mappedQuests,
                localDoneStates,
                listStartX,
                listStartY,
                doneX,
                showDone,
                createQuestUI,
                createMenuNavigation,
                state,
                elements,
                extendedCleanup,
                handleQuestSubmitted
            )
        }

        // Bind overlay click events
        bindOverlayEvents(
            overlay,
            border,
            originalCleanup,
            extendedCleanup,
            state
        )

        // Initialize visual state
        if (state.boardQuestUI) state.boardQuestUI.updateVisuals(0)

        // Apply fade-in animation if requested
        if (fadeIn && state.boardElements.length > 0) {
            applyFadeIn(scene, state.boardElements)
        }
    }
}
