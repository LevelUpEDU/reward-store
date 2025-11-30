/**
 * Horizontal selector component with left/right arrows
 * Used for navigating between courses, boards, or any list of items
 *
 * Features:
 * - Visual left/right arrow buttons with labels
 * - Mouse hover effects
 * - Automatic label updates based on current selection
 * - Configurable positioning and styling
 *
 * Note: Keyboard input is handled by the parent (menuNavigation or interactionInputHandler)
 * This component only provides the visual UI and click handlers
 */

import type Phaser from 'phaser'

export interface HorizontalSelectorConfig {
    /** Phaser scene to add elements to */
    scene: Phaser.Scene
    /** Center X position for the label */
    centerX: number
    /** Center Y position for all elements */
    centerY: number
    /** Horizontal offset for arrows from center */
    arrowOffset: number
    /** List of item names to display */
    items: string[]
    /** Starting index (default: 0) */
    initialIndex?: number
    /** Callback when user clicks arrows or index changes */
    onIndexChange: (newIndex: number, item: string) => void
    /** Text style for arrows */
    arrowStyle?: Phaser.Types.GameObjects.Text.TextStyle
    /** Text style for the center label */
    labelStyle?: Phaser.Types.GameObjects.Text.TextStyle
    /** Optional text style for small labels under arrows (showing adjacent items) */
    adjacentLabelStyle?: Phaser.Types.GameObjects.Text.TextStyle
    /** Depth for rendering */
    depth?: number
}

export interface HorizontalSelectorControls {
    /** Container holding all elements */
    container: Phaser.GameObjects.Container
    /** Update the list of items */
    setItems: (items: string[]) => void
    /** Set the current index (triggers onIndexChange) */
    setIndex: (index: number) => void
    /** Get current index */
    getIndex: () => number
    /** Navigate left (wraps around) */
    navigateLeft: () => void
    /** Navigate right (wraps around) */
    navigateRight: () => void
    /** Visual highlight effect for arrow */
    highlightArrow: (direction: 'left' | 'right') => void
    /** Destroy all elements */
    destroy: () => void
}

const DEFAULT_ARROW_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
    fontSize: '48px',
    color: '#aaaaaa',
    fontFamily: 'Arial, sans-serif',
}

const DEFAULT_LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
    fontSize: '32px',
    color: '#00ffff',
    fontFamily: 'Arial, sans-serif',
}

/**
 * Creates a horizontal selector with left/right arrows
 * @param config Configuration object
 * @returns Controls for manipulating the selector
 */
export function createHorizontalSelector(
    config: HorizontalSelectorConfig
): HorizontalSelectorControls {
    const {
        scene,
        centerX,
        centerY,
        arrowOffset,
        items,
        initialIndex = 0,
        onIndexChange,
        arrowStyle = DEFAULT_ARROW_STYLE,
        labelStyle = DEFAULT_LABEL_STYLE,
        adjacentLabelStyle,
        depth = 0,
    } = config

    let currentIndex = Math.max(0, Math.min(initialIndex, items.length - 1))
    let itemList = [...items]

    const container = scene.add.container(0, 0)
    container.setDepth(depth)

    // Left arrow
    const leftArrow = scene.add
        .text(centerX - arrowOffset, centerY, '◀', arrowStyle)
        .setOrigin(0.5)
        .setInteractive({cursor: 'pointer'})

    // Right arrow
    const rightArrow = scene.add
        .text(centerX + arrowOffset, centerY, '▶', arrowStyle)
        .setOrigin(0.5)
        .setInteractive({cursor: 'pointer'})

    const centerLabel = scene.add
        .text(centerX, centerY, items[currentIndex] || '', labelStyle)
        .setOrigin(0.5)

    // only create if adjacentLabelStyle is provided
    let leftLabel: Phaser.GameObjects.Text | null = null
    let rightLabel: Phaser.GameObjects.Text | null = null

    if (adjacentLabelStyle) {
        leftLabel = scene.add
            .text(centerX - arrowOffset, centerY + 34, '', adjacentLabelStyle)
            .setOrigin(0.5, 0)

        rightLabel = scene.add
            .text(centerX + arrowOffset, centerY + 34, '', adjacentLabelStyle)
            .setOrigin(0.5, 0)

        container.add([
            leftArrow,
            rightArrow,
            centerLabel,
            leftLabel,
            rightLabel,
        ])
    } else {
        container.add([leftArrow, rightArrow, centerLabel])
    }

    const updateLabels = () => {
        if (itemList.length === 0) {
            centerLabel.setText('')
            leftLabel?.setText('')
            rightLabel?.setText('')
            return
        }

        centerLabel.setText(itemList[currentIndex])

        // Show adjacent items in small labels (if they exist)
        if (leftLabel && rightLabel) {
            const leftIndex =
                (currentIndex - 1 + itemList.length) % itemList.length
            const rightIndex = (currentIndex + 1) % itemList.length

            leftLabel.setText(itemList[leftIndex])
            rightLabel.setText(itemList[rightIndex])
        }
    }

    // Hover effects
    leftArrow.on('pointerover', () => leftArrow.setColor('#ffffff'))
    leftArrow.on('pointerout', () =>
        leftArrow.setColor(arrowStyle.color as string)
    )

    rightArrow.on('pointerover', () => rightArrow.setColor('#ffffff'))
    rightArrow.on('pointerout', () =>
        rightArrow.setColor(arrowStyle.color as string)
    )

    // click handlers
    const navigateLeft = () => {
        if (itemList.length === 0) return
        currentIndex = (currentIndex - 1 + itemList.length) % itemList.length
        updateLabels()
        onIndexChange(currentIndex, itemList[currentIndex])
    }

    const navigateRight = () => {
        if (itemList.length === 0) return
        currentIndex = (currentIndex + 1) % itemList.length
        updateLabels()
        onIndexChange(currentIndex, itemList[currentIndex])
    }

    leftArrow.on('pointerdown', navigateLeft)
    rightArrow.on('pointerdown', navigateRight)

    // highlight effect
    const highlightArrow = (direction: 'left' | 'right') => {
        const arrow = direction === 'left' ? leftArrow : rightArrow
        scene.tweens.add({
            targets: arrow,
            scale: 1.18,
            duration: 80,
            yoyo: true,
            ease: 'Quad.Out',
        })
    }

    updateLabels()

    return {
        container,
        setItems: (newItems: string[]) => {
            itemList = [...newItems]
            currentIndex = Math.max(
                0,
                Math.min(currentIndex, itemList.length - 1)
            )
            updateLabels()
        },
        setIndex: (index: number) => {
            if (index < 0 || index >= itemList.length) return
            if (index === currentIndex) return // Prevent recursion
            currentIndex = index
            updateLabels()
            onIndexChange(currentIndex, itemList[currentIndex])
        },
        getIndex: () => currentIndex,
        navigateLeft,
        navigateRight,
        highlightArrow,
        destroy: () => {
            container.destroy()
        },
    }
}
