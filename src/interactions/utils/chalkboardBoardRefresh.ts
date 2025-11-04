import type {BoardState, SmallQuest} from './chalkboardBoardTypes'

/**
 * Creates a handler for refreshing boards after quest submission.
 * This is called when a player marks a quest as done, triggering:
 * 1. API fetch for fresh quest data
 * 2. Board regrouping (quest moves from Available → Submitted)
 * 3. Re-render of current board to remove submitted quest
 *
 * @param refreshQuests - Callback to fetch fresh quest data from API
 * @param state - Shared board state object
 * @param showBoard - Function to re-render a board by index
 * @param isCleanedUp - Function to check if UI has been cleaned up
 * @returns Async handler function for quest submission events
 */
export function createQuestSubmittedHandler(
    refreshQuests:
        | (() => Promise<Array<{
              name: string
              quests: Array<SmallQuest>
          }> | null>)
        | undefined,
    state: BoardState,
    showBoard: (index: number, fadeIn?: boolean) => void,
    isCleanedUp: () => boolean
): () => Promise<void> {
    return async () => {
        if (!refreshQuests) return

        try {
            const freshBoards = await refreshQuests()

            if (freshBoards && freshBoards.length > 0) {
                // Update the boards reference
                state.setBoards(freshBoards)

                // Stay on the current board (Available) and just refresh it
                // This will remove the submitted quest from the Available board
                const currentBoardIndex = state.activeBoard

                // Small delay to let the checkmark animation complete
                setTimeout(() => {
                    if (!isCleanedUp()) {
                        showBoard(currentBoardIndex, true) // Re-render current board with fade-in
                    }
                }, 400)
            }
        } catch (err) {
            console.error('[chalkboardRefresh] handleQuestSubmitted error', err)
        }
    }
}
