import type {Scene} from '@/scenes/Scene'
import type {MenuNavigationControls} from '@/utils/menuNavigation'

export interface SmallQuest {
    id?: number
    title?: string
    points?: number
    done?: boolean
    submissionId?: number | null
    submissionStatus?: string | null
}

export interface StylesLike {
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

export interface QuestUI {
    elements: Phaser.GameObjects.GameObject[]
    updateVisuals: (i: number) => void
    toggleDone: (i: number) => void
    navigationSetter?: (nav: MenuNavigationControls) => void
    destroyAllElements?: () => void
    scrollWindowDown?: () => boolean
    scrollWindowUp?: () => boolean
    getWindowStart?: () => number
    getVisibleCount?: () => number
}

export type MenuNav = MenuNavigationControls

export type MappedQuest = {
    id?: number
    title: string
    points: number
    done: boolean
    submissionId: number | null
    submissionStatus: string | null
}

export type CreateQuestUIFn = (
    scene: Scene,
    quests: MappedQuest[],
    localDoneStates: boolean[],
    listStartX: number,
    listStartY: number,
    doneX: number,
    showDone: boolean,
    navigationSetter?: (controls: MenuNavigationControls) => void,
    onQuestSubmitted?: () => Promise<void>,
    boardName?: string,
    userEmail?: string,
    claimedSubmissionIds?: number[]
) => QuestUI

export type CreateMenuNavArgs = {
    scene: Scene
    itemCount: number
    onSelectionChange?: (i: number) => void
    onSelect?: (i: number) => void
    onClose?: () => void
    visibleCount?: number
    onScrollDown?: () => boolean
    onScrollUp?: () => boolean
}

export type CreateMenuNavFn = (args: CreateMenuNavArgs) => MenuNav

export interface BoardState {
    activeBoard: number
    boardElements: Phaser.GameObjects.GameObject[]
    boardNav: MenuNav | null
    boardQuestUI: QuestUI | null
    cleanupBoard: (() => void) | null
    subtitle: Phaser.GameObjects.Text | null
    setSubtitle: (t: Phaser.GameObjects.Text) => void
    setBoardElements: (els: Phaser.GameObjects.GameObject[]) => void
    getBoards: () => Array<{name: string; quests: Array<SmallQuest>}>
    setBoards: (b: Array<{name: string; quests: Array<SmallQuest>}>) => void
}

export interface ShowBoardContext {
    scene: Scene
    elements: Phaser.GameObjects.GameObject[]
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
    state: BoardState
    extendedCleanup: () => void
    isCleanedUp: () => boolean
    overlay: unknown
    border: {getBounds?: () => Phaser.Geom.Rectangle}
    refreshQuests?: () => Promise<Array<{
        name: string
        quests: Array<SmallQuest>
    }> | null>
}
