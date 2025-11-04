import {chalkboardStyles as styles} from '@/interactions/styles/chalkboardStyles'
import type {Scene} from '@/scenes/Scene'

export function createOverlay(
    scene: Scene,
    x: number,
    y: number,
    w: number,
    h: number
) {
    const overlay = scene.add.rectangle(
        x,
        y,
        w,
        h,
        styles.colors.overlay,
        styles.colors.overlayAlpha
    )
    overlay.setDepth(styles.depths.overlay)
    return overlay
}

export function createBorder(
    scene: Scene,
    x: number,
    y: number,
    w: number,
    h: number
) {
    const border = scene.add.rectangle(
        x,
        y,
        w + styles.layout.borderWidth,
        h + styles.layout.borderWidth,
        styles.colors.border
    )
    border.setDepth(styles.depths.border)
    border.on(
        'pointerdown',
        (
            _pointer: Phaser.Input.Pointer,
            _localX: number,
            _localY: number,
            event: Phaser.Types.Input.EventData
        ) => {
            event.stopPropagation()
        }
    )
    return border
}

export function createBackground(
    scene: Scene,
    x: number,
    y: number,
    w: number,
    h: number
) {
    const bg = scene.add.rectangle(x, y, w, h, styles.colors.background)
    bg.setDepth(styles.depths.background)
    bg.setInteractive()
    bg.on(
        'pointerdown',
        (
            _pointer: Phaser.Input.Pointer,
            _localX: number,
            _localY: number,
            event: Phaser.Types.Input.EventData
        ) => {
            event.stopPropagation()
        }
    )
    return bg
}

export function createTitle(
    scene: Scene,
    cx: number,
    cy: number,
    iw: number,
    ih: number
) {
    return scene.add
        .text(
            cx - iw / 2 + styles.layout.titleOffsetX,
            cy - ih / 2 + styles.layout.titleOffsetY,
            'Loading',
            {
                fontSize: styles.typography.titleSize,
                color: styles.colors.titleText,
                fontFamily: styles.typography.fontFamily,
            }
        )
        .setOrigin(0, 0.5)
        .setDepth(styles.depths.text)
}

export function createLoadingAnimation(
    scene: Scene,
    titleText: Phaser.GameObjects.Text
) {
    let dotCount = 0
    const maxDots = 3
    const baseText = 'Loading'

    // Create a timer that updates every 400ms
    const timer = scene.time.addEvent({
        delay: 400,
        callback: () => {
            dotCount = (dotCount + 1) % (maxDots + 1)
            const dots = '.'.repeat(dotCount)
            try {
                titleText.setText(baseText + dots)
            } catch {
                // If text object is destroyed, stop the timer
                timer.destroy()
            }
        },
        loop: true,
    })

    // Return cleanup function
    return () => {
        try {
            timer.destroy()
        } catch {
            // Ignore if already destroyed
        }
    }
}

export function createEmptyMessage(scene: Scene, x: number, y: number) {
    return scene.add
        .text(x, y, 'No quests available', {
            fontSize: styles.typography.emptyMessageSize,
            color: styles.colors.titleText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.text)
}

export function ellipsizeToFit(
    textObj: Phaser.GameObjects.Text,
    full: string,
    maxWidth: number
) {
    textObj.setText(full)
    if (textObj.width <= maxWidth) return
    let trimmed = full
    while (trimmed.length > 0 && textObj.width > maxWidth) {
        trimmed = trimmed.slice(0, -1)
        textObj.setText(trimmed + '...')
    }
}

// createQuestUI moved to chalkboardQuestList.ts
