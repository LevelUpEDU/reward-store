import {chalkboardStyles as styles} from '../styles/chalkboardStyles'
import type {Scene} from '@/scenes/Scene'
import {createMenuNavigation} from '@/utils/menuNavigation'
import {createQuestUI} from './chalkboardQuestList'
import {createArrows} from './chalkboardBoardsHelpers'
import {createShowBoard} from './chalkboardBoardsShow'

type SceneLike = Scene
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
    refreshQuests?: () => Promise<
        {name: string; quests: Array<{id?: number; done?: boolean}>}[] | null
    >
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
        refreshQuests,
    } = options

    const activeBoard = 0
    let boardElements: Phaser.GameObjects.GameObject[] = []
    const boardNav: ReturnType<typeof createMenuNavigation> | null = null
    const boardQuestUI: ReturnType<typeof createQuestUI> | null = null
    let _cleanedUp = false
    let currentBoards = boards // Mutable reference to boards array

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

    // Use external showBoard implementation to shrink this file size
    // Explicitly type state object to allow mutation of boardNav and boardQuestUI
    // Declare state early so cleanupBoard can reference it
    const state: {
        activeBoard: number
        boardElements: Phaser.GameObjects.GameObject[]
        boardNav: ReturnType<typeof createMenuNavigation> | null
        boardQuestUI: ReturnType<typeof createQuestUI> | null
        cleanupBoard: (() => void) | null
        subtitle: Phaser.GameObjects.Text | null
        setSubtitle: (t: Phaser.GameObjects.Text) => void
        setBoardElements: (els: Phaser.GameObjects.GameObject[]) => void
        getBoards: () => typeof boards
        setBoards: (b: typeof boards) => void
    } = {
        activeBoard,
        boardElements,
        boardNav,
        boardQuestUI,
        // Will be assigned after cleanupBoard is defined
        cleanupBoard: null,
        subtitle,
        setSubtitle: (t: Phaser.GameObjects.Text) => (subtitle = t),
        setBoardElements: (els: Phaser.GameObjects.GameObject[]) =>
            (boardElements = els),
        // Use getter to always return the live reference
        getBoards: () => currentBoards,
        setBoards: (b: typeof boards) => (currentBoards = b),
    }

    cleanupBoard = () => {
        // Use state.boardNav instead of local boardNav to get the live reference
        if (state.boardNav) {
            try {
                state.boardNav.cleanup()
            } catch {
                /* ignore */
            }
            state.boardNav = null
        }
        // Destroy all quest UI elements, including late-added ones like 'Claimed' label
        if (
            state.boardQuestUI &&
            typeof state.boardQuestUI.destroyAllElements === 'function'
        ) {
            state.boardQuestUI.destroyAllElements()
        }
        state.boardQuestUI = null
        boardElements.forEach((el) => {
            try {
                // Check if element still exists before destroying
                if (el && el.scene) {
                    el.destroy()
                }
            } catch {
                /* ignore */
            }
        })
        boardElements.length = 0
    }

    // Now assign the cleanupBoard function to state
    state.cleanupBoard = cleanupBoard

    let showBoard: (idx: number, fadeIn?: boolean) => void = createShowBoard({
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
        isCleanedUp: () => _cleanedUp,
        overlay,
        border,
        refreshQuests,
    })

    // createArrows will be called after isDialogOpen and nav handlers are set
    const isDialogOpen = () => {
        try {
            // Use state.boardQuestUI to check the live reference
            if (state.boardQuestUI?.isDialogActive?.()) return true
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
        showBoard((state.activeBoard ?? 0) + 1)
    }
    prevBoard = () => {
        if (isDialogOpen()) return
        showBoard((state.activeBoard ?? 0) - 1)
    }

    let arrows: ReturnType<typeof createArrows> | null = null
    // create arrows now that nav handlers and isDialogOpen exist
    arrows = createArrows({
        scene,
        centerX,
        titleSizeNum,
        styles,
        elements,
        onLeft: () => prevBoard(),
        onRight: () => nextBoard(),
        isDialogOpen,
        boardNames: currentBoards.map((b) => b.name),
        activeBoard: state.activeBoard ?? 0,
    })
    leftArrow = arrows.leftArrow
    rightArrow = arrows.rightArrow
    // keys
    leftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
    rightKey = scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.RIGHT
    )
    aKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    dKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    // navigation functions are hoisted above; use them here
    leftKey.on('down', () => {
        if (arrows && arrows.highlightArrow) arrows.highlightArrow('left')
        prevBoard()
    })
    rightKey.on('down', () => {
        if (arrows && arrows.highlightArrow) arrows.highlightArrow('right')
        nextBoard()
    })
    aKey.on('down', () => {
        if (arrows && arrows.highlightArrow) arrows.highlightArrow('left')
        prevBoard()
    })
    dKey.on('down', () => {
        if (arrows && arrows.highlightArrow) arrows.highlightArrow('right')
        nextBoard()
    })
    // Patch showBoard to update labels on board switch
    const originalShowBoard = showBoard
    function showBoardWithLabelUpdate(idx: number, fadeIn?: boolean) {
        if (arrows && arrows.updateLabels) {
            arrows.updateLabels(idx % currentBoards.length)
        }
        return originalShowBoard(idx, fadeIn)
    }
    // Replace showBoard with patched version
    showBoard = showBoardWithLabelUpdate
    // show initial
    showBoard(0, true)

    // return a small cleanup interface so callers (eg. chalkboard.ts) can call boardsMount.cleanup()
    return {
        cleanup: () => {
            try {
                extendedCleanup()
            } catch {}
        },
    }
}
