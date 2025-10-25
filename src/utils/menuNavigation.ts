// utils/menuNavigation.ts

export interface MenuNavigationConfig {
    scene: Phaser.Scene
    itemCount: number
    onSelectionChange?: (index: number) => void
    onSelect?: (index: number) => void
    onClose?: () => void
    initialIndex?: number
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
    } = config

    let selectedIndex = Phaser.Math.Clamp(initialIndex, 0, itemCount - 1)
    let active = true

    // Create keyboard keys
    const keys = {
        esc: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
        q: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
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
        // wrap around
        const raw = selectedIndex + delta
        // mod that handles negative numbers
        selectedIndex = ((raw % itemCount) + itemCount) % itemCount
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
    keys.esc.on('down', handleClose)
    keys.q.on('down', handleClose)

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
        keys.esc.off('down', handleClose)
        keys.q.off('down', handleClose)
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
