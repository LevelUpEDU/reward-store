// Add interface for scene with userEmail and claimedSubmissionIds
interface SceneWithUser extends Phaser.Scene {
    userEmail?: string
    claimedSubmissionIds?: string[]
}
import type {Scene} from '@/scenes/Scene'
import type {
    SmallQuest,
    StylesLike,
    BoardState,
    MappedQuest,
    CreateQuestUIFn,
    CreateMenuNavFn,
} from './chalkboardBoardTypes'

/**
 * Renders the "Done" column label for the Available board.
 */
export function renderDoneLabel(
    scene: Scene,
    doneX: number,
    listStartY: number,
    styles: StylesLike,
    state: BoardState,
    elements: Phaser.GameObjects.GameObject[]
): void {
    try {
        const doneLabel = scene.add
            .text(
                doneX,
                listStartY -
                    ((styles.layout && styles.layout.doneLabelOffsetY) || 0),
                'Done',
                {
                    fontSize: styles.typography.doneLabelSize,
                    color: styles.colors.doneLabel,
                    fontFamily: styles.typography.fontFamily,
                }
            )
            .setOrigin(0.5)
            .setDepth((styles.depths.text ?? 0) + 1)
        // Add to both arrays:
        // - boardElements: destroyed when switching boards
        // - elements: destroyed when closing chalkboard
        state.boardElements.push(doneLabel)
        elements.push(doneLabel)
    } catch {
        // Fail silently if label creation fails
    }
}

/**
 * Renders the "No quests available" message for empty boards.
 */
export function renderEmptyMessage(
    scene: Scene,
    centerX: number,
    listStartY: number,
    styles: StylesLike,
    state: BoardState,
    elements: Phaser.GameObjects.GameObject[]
): void {
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
}

/**
 * Maps raw quest data to the format expected by createQuestUI.
 */
export function mapQuests(quests: SmallQuest[]): MappedQuest[] {
    return (quests || []).map((q: SmallQuest, idx: number) => ({
        id: q?.id,
        title: q?.title ?? `Quest ${idx + 1}`,
        points: typeof q?.points === 'number' ? q.points : 0,
        done: Boolean(q?.done),
        submissionId: q?.submissionId ?? null,
        submissionStatus: q?.submissionStatus ?? null,
    }))
}

/**
 * Renders quest list UI and menu navigation.
 */
export function renderQuestList(
    scene: Scene,
    board: {name: string; quests: SmallQuest[]},
    mappedQuests: MappedQuest[],
    localDoneStates: boolean[],
    listStartX: number,
    listStartY: number,
    doneX: number,
    showDone: boolean,
    createQuestUI: CreateQuestUIFn,
    createMenuNavigation: CreateMenuNavFn,
    state: BoardState,
    elements: Phaser.GameObjects.GameObject[],
    extendedCleanup: () => void,
    handleQuestSubmitted: () => Promise<void>
): void {
    // Create quest UI
    try {
        // Destroy all previous quest UI elements before switching
        if (
            state.boardQuestUI &&
            typeof state.boardQuestUI.destroyAllElements === 'function'
        ) {
            state.boardQuestUI.destroyAllElements()
        }
        // Don't clear state.boardElements here - it may already contain the Done label
        // Only pass showDone as true if board.name is 'Available'
        const showDoneAvailable = board.name === 'Available' ? showDone : false
        state.boardQuestUI = createQuestUI(
            scene,
            mappedQuests,
            localDoneStates,
            listStartX,
            listStartY,
            doneX,
            showDoneAvailable,
            undefined, // navigationSetter will be set later
            handleQuestSubmitted,
            board.name, // pass board name
            (scene as SceneWithUser).userEmail || '', // pass user email if available
            ((scene as SceneWithUser).claimedSubmissionIds || [])
                .map((id) => Number(id))
                .filter((id) => !isNaN(id))
        )
        state.boardElements.push(...state.boardQuestUI.elements)
        // Do NOT push quest UI elements to the global elements array here, only to boardElements
    } catch {
        // Fail silently if quest UI creation fails
    }

    // Create menu navigation
    try {
        state.boardNav = createMenuNavigation({
            scene,
            itemCount: board.quests.length,
            visibleCount:
                state.boardQuestUI?.getVisibleCount?.() || board.quests.length,
            onSelectionChange: (i: number) =>
                state.boardQuestUI && state.boardQuestUI.updateVisuals(i),
            onSelect: (i: number) =>
                state.boardQuestUI && state.boardQuestUI.toggleDone(i),
            onClose: () => extendedCleanup(),
            onScrollDown: () =>
                state.boardQuestUI?.scrollWindowDown?.() || false,
            onScrollUp: () => state.boardQuestUI?.scrollWindowUp?.() || false,
        })

        // Wire navigation to quest UI
        if (
            state.boardQuestUI &&
            typeof state.boardQuestUI.navigationSetter === 'function'
        ) {
            state.boardQuestUI.navigationSetter(state.boardNav)
        }
    } catch {
        // Fail silently if navigation creation fails
    }
}
