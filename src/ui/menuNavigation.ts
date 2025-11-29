export interface MenuNavigationConfig {
    scene: Phaser.Scene
    itemCount: number
    onSelectionChange?: (index: number) => void
    onSelect?: (index: number) => void
    onClose?: () => void
    initialIndex?: number
    onScrollDown?: () => boolean
    onScrollUp?: () => boolean
    visibleCount?: number
    onLeft?: () => void
    onRight?: () => void
}

export interface MenuNavigationControls {
    getSelectedIndex: () => number
    setSelectedIndex: (index: number) => void
    setItemCount: (count: number) => void
    cleanup: () => void
    pause: () => void
    resume: () => void
}

export function createMenuNavigation(
    config: MenuNavigationConfig
): MenuNavigationControls {
    const {
        scene,
        onSelectionChange,
        onSelect,
        onClose,
        initialIndex = 0,
        onScrollDown,
        onScrollUp,
        visibleCount,
        onLeft,
        onRight,
    } = config

    let itemCount = config.itemCount
    let selectedIndex = Phaser.Math.Clamp(
        initialIndex,
        0,
        Math.max(0, itemCount - 1)
    )
    let active = true

    const keys = {
        up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.RIGHT
        ),
        w: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        s: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        a: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        enter: scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.ENTER
        ),
        e: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    }

    const initialRepeatDelay = 300
    const repeatInterval = 120
    let upRepeatTimer: Phaser.Time.TimerEvent | null = null
    let downRepeatTimer: Phaser.Time.TimerEvent | null = null
    let leftRepeatTimer: Phaser.Time.TimerEvent | null = null
    let rightRepeatTimer: Phaser.Time.TimerEvent | null = null

    const moveSelection = (delta: number) => {
        const prev = selectedIndex
        if (itemCount <= 0) return

        if (visibleCount !== undefined) {
            if (
                delta > 0 &&
                selectedIndex === visibleCount - 1 &&
                onScrollDown
            ) {
                const scrolled = onScrollDown()
                if (scrolled) {
                    if (onSelectionChange) {
                        onSelectionChange(selectedIndex)
                    }
                    return
                }
            } else if (delta < 0 && selectedIndex === 0 && onScrollUp) {
                const scrolled = onScrollUp()
                if (scrolled) {
                    if (onSelectionChange) {
                        onSelectionChange(selectedIndex)
                    }
                    return
                }
            }
        }

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
    const handleLeft = () => {
        if (!active || !onLeft) return
        onLeft()
    }
    const handleRight = () => {
        if (!active || !onRight) return
        onRight()
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

    // Repeat timer helpers
    const createRepeatHandlers = (
        handler: () => void,
        getTimer: () => Phaser.Time.TimerEvent | null,
        setTimer: (t: Phaser.Time.TimerEvent | null) => void
    ) => {
        const start = () => {
            if (!active) return
            handler()
            if (getTimer()) return
            setTimer(
                scene.time.addEvent({
                    delay: initialRepeatDelay,
                    callback: () => {
                        const current = getTimer()
                        if (current) current.remove(false)
                        setTimer(
                            scene.time.addEvent({
                                delay: repeatInterval,
                                loop: true,
                                callback: () => {
                                    if (active) handler()
                                },
                            })
                        )
                    },
                })
            )
        }
        const stop = () => {
            const timer = getTimer()
            if (timer) {
                timer.remove(false)
                setTimer(null)
            }
        }
        return {start, stop}
    }

    const upRepeat = createRepeatHandlers(
        handleUp,
        () => upRepeatTimer,
        (t) => (upRepeatTimer = t)
    )
    const downRepeat = createRepeatHandlers(
        handleDown,
        () => downRepeatTimer,
        (t) => (downRepeatTimer = t)
    )
    const leftRepeat = createRepeatHandlers(
        handleLeft,
        () => leftRepeatTimer,
        (t) => (leftRepeatTimer = t)
    )
    const rightRepeat = createRepeatHandlers(
        handleRight,
        () => rightRepeatTimer,
        (t) => (rightRepeatTimer = t)
    )

    // vertical navigation
    keys.up.on('down', upRepeat.start)
    keys.w.on('down', upRepeat.start)
    keys.up.on('up', upRepeat.stop)
    keys.w.on('up', upRepeat.stop)
    keys.down.on('down', downRepeat.start)
    keys.s.on('down', downRepeat.start)
    keys.down.on('up', downRepeat.stop)
    keys.s.on('up', downRepeat.stop)

    // horizontal navigation
    keys.left.on('down', leftRepeat.start)
    keys.a.on('down', leftRepeat.start)
    keys.left.on('up', leftRepeat.stop)
    keys.a.on('up', leftRepeat.stop)
    keys.right.on('down', rightRepeat.start)
    keys.d.on('down', rightRepeat.start)
    keys.right.on('up', rightRepeat.stop)
    keys.d.on('up', rightRepeat.stop)

    keys.enter.on('down', handleSelect)
    keys.e.on('down', handleSelect)

    const globalCloseHandler = (event: KeyboardEvent) => {
        event.stopImmediatePropagation()
        handleClose()
    }

    if (onClose) {
        scene.input.keyboard!.on('keydown-ESC', globalCloseHandler)
        scene.input.keyboard!.on('keydown-Q', globalCloseHandler)
    }

    const cleanup = () => {
        upRepeat.stop()
        downRepeat.stop()
        leftRepeat.stop()
        rightRepeat.stop()

        keys.up.off('down', upRepeat.start)
        keys.w.off('down', upRepeat.start)
        keys.up.off('up', upRepeat.stop)
        keys.w.off('up', upRepeat.stop)
        keys.down.off('down', downRepeat.start)
        keys.s.off('down', downRepeat.start)
        keys.down.off('up', downRepeat.stop)
        keys.s.off('up', downRepeat.stop)

        keys.left.off('down', leftRepeat.start)
        keys.a.off('down', leftRepeat.start)
        keys.left.off('up', leftRepeat.stop)
        keys.a.off('up', leftRepeat.stop)
        keys.right.off('down', rightRepeat.start)
        keys.d.off('down', rightRepeat.start)
        keys.right.off('up', rightRepeat.stop)
        keys.d.off('up', rightRepeat.stop)

        keys.enter.off('down', handleSelect)
        keys.e.off('down', handleSelect)

        if (onClose) {
            scene.input.keyboard!.off('keydown-ESC', globalCloseHandler)
            scene.input.keyboard!.off('keydown-Q', globalCloseHandler)
        }
    }

    return {
        getSelectedIndex: () => selectedIndex,
        setSelectedIndex: (index: number) => {
            const prev = selectedIndex
            selectedIndex = Phaser.Math.Clamp(
                index,
                0,
                Math.max(0, itemCount - 1)
            )
            if (selectedIndex !== prev && onSelectionChange) {
                onSelectionChange(selectedIndex)
            }
        },
        setItemCount: (count: number) => {
            itemCount = count
            if (selectedIndex >= count) {
                selectedIndex = Math.max(0, count - 1)
                if (onSelectionChange) {
                    onSelectionChange(selectedIndex)
                }
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
