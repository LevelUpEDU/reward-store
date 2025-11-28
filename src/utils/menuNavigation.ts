// utils/menuNavigation.ts

export interface MenuNavigationConfig {
    scene: Phaser.Scene
    itemCount: number
    onSelectionChange?: (index: number) => void
    onSelect?: (index: number) => void
    onClose?: () => void
    initialIndex?: number
    onScrollDown?: () => boolean // Returns true if scrolled
    onScrollUp?: () => boolean // Returns true if scrolled
    visibleCount?: number // Number of items visible at once
}

export interface MenuNavigationControls {
    getSelectedIndex: () => number
    setSelectedIndex: (index: number) => void
    cleanup: () => void
    pause?: () => void
    resume?: () => void
}

/**
 * Sets up keyboard navigation for a menu interface
 * Handles: Arrow keys, WASD, Enter/E for selection, ESC/Q for closing
 */
export function createMenuNavigation(
    config: MenuNavigationConfig
): MenuNavigationControls {
    const {
        scene,
        itemCount,
        onSelectionChange,
        onSelect,
        onClose,
        initialIndex = 0,
        onScrollDown,
        onScrollUp,
        visibleCount,
    } = config

    let selectedIndex = Phaser.Math.Clamp(initialIndex, 0, itemCount - 1)
    let active = true

    // Create keyboard keys
    const keys = {
        up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        w: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        s: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        enter: scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.ENTER
        ),
        e: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    }

    // Repeat timers for holding keys
    const initialRepeatDelay = 300 // ms before repeating
    const repeatInterval = 120 // ms between repeats
    let upRepeatTimer: Phaser.Time.TimerEvent | null = null
    let downRepeatTimer: Phaser.Time.TimerEvent | null = null

    // Navigation handlers
    const moveSelection = (delta: number) => {
        const prev = selectedIndex
        if (itemCount <= 0) return

        // Handle windowed scrolling if callbacks are provided
        if (visibleCount !== undefined) {
            if (
                delta > 0 &&
                selectedIndex === visibleCount - 1 &&
                onScrollDown
            ) {
                // At bottom of visible window, try to scroll down
                const scrolled = onScrollDown()
                if (scrolled) {
                    // Keep selection at same position in window
                    if (onSelectionChange) {
                        onSelectionChange(selectedIndex)
                    }
                    return
                }
            } else if (delta < 0 && selectedIndex === 0 && onScrollUp) {
                // At top of visible window, try to scroll up
                const scrolled = onScrollUp()
                if (scrolled) {
                    // Keep selection at same position in window
                    if (onSelectionChange) {
                        onSelectionChange(selectedIndex)
                    }
                    return
                }
            }
        }

        // Normal navigation within visible items
        const maxIndex =
            visibleCount !== undefined ? visibleCount - 1 : itemCount - 1
        selectedIndex = Phaser.Math.Clamp(selectedIndex + delta, 0, maxIndex)

        if (selectedIndex !== prev && onSelectionChange) {
            onSelectionChange(selectedIndex)
        }
    }

    const handleUp = () => {
        if (!active) return
        moveSelection(-1)
    }
    const handleDown = () => {
        if (!active) return
        moveSelection(1)
    }
    const handleSelect = () => {
        if (!active) return
        if (onSelect) {
            onSelect(selectedIndex)
        }
    }
    const handleClose = () => {
        if (!active) return
        if (onClose) {
            onClose()
        }
    }

    // Key-hold repeat helpers
    const startUpRepeat = () => {
        if (!active) return
        // immediate action
        handleUp()
        if (upRepeatTimer) return
        // initial delay, then switch to continuous repeat
        upRepeatTimer = scene.time.addEvent({
            delay: initialRepeatDelay,
            callback: () => {
                if (upRepeatTimer) upRepeatTimer.remove(false)
                upRepeatTimer = scene.time.addEvent({
                    delay: repeatInterval,
                    loop: true,
                    callback: () => {
                        if (active) handleUp()
                    },
                })
            },
        })
    }
    const stopUpRepeat = () => {
        if (upRepeatTimer) {
            upRepeatTimer.remove(false)
            upRepeatTimer = null
        }
    }

    const startDownRepeat = () => {
        if (!active) return
        handleDown()
        if (downRepeatTimer) return
        downRepeatTimer = scene.time.addEvent({
            delay: initialRepeatDelay,
            callback: () => {
                if (downRepeatTimer) downRepeatTimer.remove(false)
                downRepeatTimer = scene.time.addEvent({
                    delay: repeatInterval,
                    loop: true,
                    callback: () => {
                        if (active) handleDown()
                    },
                })
            },
        })
    }
    const stopDownRepeat = () => {
        if (downRepeatTimer) {
            downRepeatTimer.remove(false)
            downRepeatTimer = null
        }
    }

    // Bind keyboard events (with hold/repeat support)
    keys.up.on('down', startUpRepeat)
    keys.w.on('down', startUpRepeat)
    keys.up.on('up', stopUpRepeat)
    keys.w.on('up', stopUpRepeat)
    keys.down.on('down', startDownRepeat)
    keys.s.on('down', startDownRepeat)
    keys.down.on('up', stopDownRepeat)
    keys.s.on('up', stopDownRepeat)
    keys.enter.on('down', handleSelect)
    keys.e.on('down', handleSelect)

    // bind escape/q using global events
    const globalCloseHandler = (event: KeyboardEvent) => {
        // Stop propagation just to be safe (good practice for modals)
        event.stopImmediatePropagation()
        handleClose()
    }

    scene.input.keyboard!.on('keydown-ESC', globalCloseHandler)
    scene.input.keyboard!.on('keydown-Q', globalCloseHandler)

    // Cleanup function to remove all listeners
    const cleanup = () => {
        // stop any repeat timers
        stopUpRepeat()
        stopDownRepeat()

        keys.up.off('down', startUpRepeat)
        keys.w.off('down', startUpRepeat)
        keys.up.off('up', stopUpRepeat)
        keys.w.off('up', stopUpRepeat)
        keys.down.off('down', startDownRepeat)
        keys.s.off('down', startDownRepeat)
        keys.down.off('up', stopDownRepeat)
        keys.s.off('up', stopDownRepeat)

        keys.enter.off('down', handleSelect)
        keys.e.off('down', handleSelect)

        scene.input.keyboard!.off('keydown-ESC', globalCloseHandler)
        scene.input.keyboard!.off('keydown-Q', globalCloseHandler)

        Object.values(keys).forEach((key) => key.destroy())
    }

    return {
        getSelectedIndex: () => selectedIndex,
        setSelectedIndex: (index: number) => {
            const prev = selectedIndex
            selectedIndex = Phaser.Math.Clamp(index, 0, itemCount - 1)
            if (selectedIndex !== prev && onSelectionChange) {
                onSelectionChange(selectedIndex)
            }
        },
        cleanup,
        pause: () => {
            active = false
        },
        resume: () => {
            active = true
        },
    }
}
