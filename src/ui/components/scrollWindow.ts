/**
 * Scroll window utility for managing windowed list display
 * Handles the logic for scrolling through a large list when only a subset is visible
 *
 * This is a pure data structure - it doesn't render anything, just manages:
 * - Current scroll offset
 * - Which items are visible
 * - Whether scrolling up/down is possible
 *
 * The parent component is responsible for:
 * - Rendering the visible items
 * - Rendering scroll indicators (▲/▼)
 * - Handling keyboard/mouse input
 */

export interface ScrollWindowConfig<T> {
    /** All items in the list */
    items: T[]
    /** Maximum number of items visible at once */
    maxVisible: number
    /** Starting scroll offset (default: 0) */
    initialOffset?: number
    /** Callback when scroll position changes */
    onScrollChange?: (offset: number, visibleItems: T[]) => void
}

export interface ScrollWindowControls<T> {
    /** Get items currently visible in the window */
    getVisibleItems: () => T[]
    /** Get current scroll offset */
    getOffset: () => number
    /** Set scroll offset directly */
    setOffset: (offset: number) => void
    /** Can we scroll up? (offset > 0) */
    canScrollUp: () => boolean
    /** Can we scroll down? (more items below visible window) */
    canScrollDown: () => boolean
    /** Scroll up by one item */
    scrollUp: () => boolean
    /** Scroll down by one item */
    scrollDown: () => boolean
    /** Update the items list (resets to offset 0 if needed) */
    setItems: (items: T[]) => void
    /** Get total number of items */
    getTotalCount: () => number
    /** Get max visible count */
    getMaxVisible: () => number
}

/**
 * Creates a scroll window controller
 * @param config Configuration object
 * @returns Controls for managing the scroll window
 *
 * @example
 * ```typescript
 * const scroll = createScrollWindow({
 *     items: allQuests,
 *     maxVisible: 5,
 *     onScrollChange: (offset, visible) => {
 *         renderQuests(visible)
 *         updateScrollIndicators()
 *     }
 * })
 *
 * // When user presses down arrow at bottom
 * if (selectedIndex === maxVisible - 1) {
 *     scroll.scrollDown()
 * }
 * ```
 */
export function createScrollWindow<T>(
    config: ScrollWindowConfig<T>
): ScrollWindowControls<T> {
    const {
        items: initialItems,
        maxVisible,
        initialOffset = 0,
        onScrollChange,
    } = config

    let items = [...initialItems]
    let offset = Math.max(
        0,
        Math.min(initialOffset, Math.max(0, items.length - maxVisible))
    )

    const getVisibleItems = (): T[] => {
        return items.slice(offset, offset + maxVisible)
    }

    const canScrollUp = (): boolean => {
        return offset > 0
    }

    const canScrollDown = (): boolean => {
        return offset + maxVisible < items.length
    }

    const notifyChange = () => {
        onScrollChange?.(offset, getVisibleItems())
    }

    const scrollUp = (): boolean => {
        if (!canScrollUp()) return false
        offset = Math.max(0, offset - 1)
        notifyChange()
        return true
    }

    const scrollDown = (): boolean => {
        if (!canScrollDown()) return false
        offset = Math.min(items.length - maxVisible, offset + 1)
        notifyChange()
        return true
    }

    const setOffset = (newOffset: number): void => {
        const maxOffset = Math.max(0, items.length - maxVisible)
        offset = Math.max(0, Math.min(newOffset, maxOffset))
        notifyChange()
    }

    const setItems = (newItems: T[]): void => {
        items = [...newItems]
        // Reset to 0 if current offset is out of bounds
        const maxOffset = Math.max(0, items.length - maxVisible)
        if (offset > maxOffset) {
            offset = 0
            notifyChange()
        }
    }

    return {
        getVisibleItems,
        getOffset: () => offset,
        setOffset,
        canScrollUp,
        canScrollDown,
        scrollUp,
        scrollDown,
        setItems,
        getTotalCount: () => items.length,
        getMaxVisible: () => maxVisible,
    }
}
