interface SmallQuest {
    id?: number
    title?: string
    points?: number
    done?: boolean
    submissionId?: number | null
    submissionStatus?: string | null
}

import type {Scene} from '@/scenes/Scene'
import type {MenuNavigationControls} from '@/utils/menuNavigation'

interface StylesLike {
    colors: {
        titleText?: string
        doneLabel?: string
        [k: string]: string | number | undefined
    }
    typography: {
        fontFamily?: string
        emptyMessageSize?: string | number
        doneLabelSize?: string | number
        [k: string]: string | number | undefined
    }
    depths: {
        text?: number
        [k: string]: number | undefined
    }
    layout?: {
        doneLabelOffsetY?: number
        [k: string]: number | undefined
    }
}

interface QuestUI {
    elements: Phaser.GameObjects.GameObject[]
    updateVisuals: (i: number) => void
    toggleDone: (i: number) => void
    navigationSetter?: (nav: MenuNavigationControls) => void
}

type MenuNav = MenuNavigationControls

type MappedQuest = {
    id?: number
    title: string
    points: number
    done: boolean
    submissionId: number | null
    submissionStatus: string | null
}

type CreateQuestUIFn = (
    scene: Scene,
    quests: MappedQuest[],
    localDoneStates: boolean[],
    listStartX: number,
    listStartY: number,
    doneX: number,
    showDone: boolean
) => QuestUI

type CreateMenuNavArgs = {
    scene: Scene
    itemCount: number
    onSelectionChange?: (i: number) => void
    onSelect?: (i: number) => void
    onClose?: () => void
}

type CreateMenuNavFn = (args: CreateMenuNavArgs) => MenuNav

export function createShowBoard(context: {
    scene: Scene
    elements: Phaser.GameObjects.GameObject[]
    boards: Array<{name: string; quests: Array<SmallQuest>}>
    listStartX: number
    listStartY: number
    doneX: number
    styles: StylesLike
    titleSizeNum: number
    centerX: number
    subtitleY: number
    originalCleanup: (nav?: {cleanup?: () => void}) => void
    createQuestUI: CreateQuestUIFn
    createMenuNavigation: CreateMenuNavFn
    state: {
        activeBoard: number
        boardElements: Phaser.GameObjects.GameObject[]
        boardNav: MenuNav | null
        boardQuestUI: QuestUI | null
        cleanupBoard: (() => void) | null
        subtitle: Phaser.GameObjects.Text | null
        setSubtitle: (t: Phaser.GameObjects.Text) => void
        setBoardElements: (els: Phaser.GameObjects.GameObject[]) => void
    }
    extendedCleanup: () => void
    isCleanedUp: () => boolean
    overlay: unknown
    border: {getBounds?: () => Phaser.Geom.Rectangle}
}) {
    const {
        scene,
        elements,
        boards,
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
    } = context

    return function showBoard(index: number, fadeIn = false) {
        const idx = ((index % boards.length) + boards.length) % boards.length
        state.activeBoard = idx
        if (state.cleanupBoard) state.cleanupBoard()
        if (isCleanedUp()) return
        const b = boards[state.activeBoard]
        try {
            if (state.subtitle)
                state.subtitle.setText(`${b.name} (${b.quests.length})`)
        } catch {
            try {
                if (state.subtitle) state.subtitle.destroy()
            } catch {}
            try {
                const s = scene.add
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
                    .setDepth((styles.depths.text ?? 0) + 1)
                elements.push(s)
                state.setSubtitle(s)
            } catch {}
        }
        const localDoneStates = b.quests.map((q: SmallQuest) => Boolean(q.done))
        const showDone =
            state.activeBoard === 0 && (boards[0]?.quests?.length ?? 0) > 0
        if (state.activeBoard === 0 && b.quests.length === 0) {
            const emptyText = scene.add
                .text(centerX, listStartY + 60, 'No quests available', {
                    fontSize: styles.typography.emptyMessageSize,
                    color: styles.colors.titleText,
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5)
                .setDepth((styles.depths.text ?? 0) + 1)
            state.boardElements.push(emptyText)
            elements.push(emptyText)
        } else {
            if (showDone) {
                try {
                    const doneLabel = scene.add
                        .text(
                            doneX,
                            listStartY -
                                ((styles.layout &&
                                    styles.layout.doneLabelOffsetY) ||
                                    0),
                            'Done',
                            {
                                fontSize: styles.typography.doneLabelSize,
                                color: styles.colors.doneLabel,
                                fontFamily: styles.typography.fontFamily,
                            }
                        )
                        .setOrigin(0.5)
                        .setDepth((styles.depths.text ?? 0) + 1)
                    state.boardElements.push(doneLabel)
                    elements.push(doneLabel)
                } catch {}
            }
            const mappedQuests = (b.quests || []).map(
                (q: SmallQuest, idx: number) => ({
                    id: q?.id,
                    title: q?.title ?? `Quest ${idx + 1}`,
                    points: typeof q?.points === 'number' ? q.points : 0,
                    done: Boolean(q?.done),
                    submissionId: q?.submissionId ?? null,
                    submissionStatus: q?.submissionStatus ?? null,
                })
            )
            try {
                state.boardQuestUI = createQuestUI(
                    scene,
                    mappedQuests,
                    localDoneStates,
                    listStartX,
                    listStartY,
                    doneX,
                    showDone
                ) as QuestUI
                state.boardElements.push(...state.boardQuestUI.elements)
                elements.push(...state.boardQuestUI.elements)
            } catch {}
            try {
                state.boardNav = createMenuNavigation({
                    scene,
                    itemCount: b.quests.length,
                    onSelectionChange: (i: number) =>
                        state.boardQuestUI &&
                        state.boardQuestUI.updateVisuals(i),
                    onSelect: (i: number) =>
                        state.boardQuestUI && state.boardQuestUI.toggleDone(i),
                    onClose: () => extendedCleanup(),
                })
                if (
                    state.boardQuestUI &&
                    typeof state.boardQuestUI.navigationSetter === 'function'
                ) {
                    state.boardQuestUI.navigationSetter(
                        state.boardNav as MenuNav
                    )
                }
            } catch {}
        }
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
                                originalCleanup(state.boardNav || undefined)
                            }
                        }) as unknown as (...args: unknown[]) => unknown)
                    }
                } catch {}
            }
        } catch {}
        if (state.boardQuestUI) state.boardQuestUI.updateVisuals(0)
        if (fadeIn && state.boardElements.length > 0) {
            try {
                state.boardElements.forEach((el) => {
                    try {
                        const maybe = el as unknown as {
                            setAlpha?: (a: number) => void
                        }
                        if (typeof maybe.setAlpha === 'function')
                            maybe.setAlpha(0)
                    } catch {}
                })
                scene.tweens.add({
                    targets: state.boardElements,
                    alpha: 1,
                    duration: 240,
                    ease: 'Quad.Out',
                })
            } catch {}
        }
    }
}
