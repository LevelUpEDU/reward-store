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

    // Navigation handlers
    const moveSelection = (delta: number) => {
        const prev = selectedIndex
        selectedIndex = Phaser.Math.Clamp(
            selectedIndex + delta,
            0,
            itemCount - 1
        )
        if (selectedIndex !== prev && onSelectionChange) {
            onSelectionChange(selectedIndex)
        }
    }

    const handleUp = () => moveSelection(-1)
    const handleDown = () => moveSelection(1)
    const handleSelect = () => {
        if (onSelect) {
            onSelect(selectedIndex)
        }
    }
    const handleClose = () => {
        if (onClose) {
            onClose()
        }
    }

    // Bind keyboard events
    keys.up.on('down', handleUp)
    keys.w.on('down', handleUp)
    keys.down.on('down', handleDown)
    keys.s.on('down', handleDown)
    keys.enter.on('down', handleSelect)
    keys.e.on('down', handleSelect)
    keys.esc.on('down', handleClose)
    keys.q.on('down', handleClose)

    // Cleanup function to remove all listeners
    const cleanup = () => {
        keys.up.off('down', handleUp)
        keys.w.off('down', handleUp)
        keys.down.off('down', handleDown)
        keys.s.off('down', handleDown)
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
    }
}
