/**
 * Re-export of board switching logic for backward compatibility.
 * The implementation has been split into focused modules:
 * - chalkboardBoardTypes.ts: Type definitions
 * - chalkboardBoardRefresh.ts: Refresh/network logic
 * - chalkboardBoardRendering.ts: Quest rendering
 * - chalkboardBoardSwitching.ts: Board switching orchestration
 */
export {createShowBoard} from './chalkboardBoardSwitching'
export type {
    SmallQuest,
    StylesLike,
    QuestUI,
    MenuNav,
    MappedQuest,
    CreateQuestUIFn,
    CreateMenuNavArgs,
    CreateMenuNavFn,
    BoardState,
    ShowBoardContext,
} from './chalkboardBoardTypes'
