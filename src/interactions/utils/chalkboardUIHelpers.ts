import {chalkboardStyles as styles} from '@/interactions/styles/chalkboardStyles'
import type {Scene} from '@/scenes/Scene'
import {type Quest, persistToggle} from './questData'

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
    border.setInteractive()
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
            'Quests for <course name>',
            {
                fontSize: styles.typography.titleSize,
                color: styles.colors.titleText,
                fontFamily: styles.typography.fontFamily,
            }
        )
        .setOrigin(0, 0.5)
        .setDepth(styles.depths.text)
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

export function createQuestUI(
    scene: Scene,
    quests: Quest[],
    doneStates: boolean[],
    startX: number,
    startY: number,
    doneX: number
) {
    const questTexts: Phaser.GameObjects.Text[] = []
    const doneMarks: Phaser.GameObjects.Text[] = []
    const elements: Phaser.GameObjects.GameObject[] = []

    // Create done label
    const doneLabel = scene.add
        .text(doneX, startY - styles.layout.doneLabelOffsetY, 'Done?', {
            fontSize: styles.typography.doneLabelSize,
            color: styles.colors.doneLabel,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.text)
    elements.push(doneLabel)

    // Create selector
    const selector = scene.add.rectangle(
        doneX,
        startY,
        styles.selector.size,
        styles.selector.size,
        styles.colors.selector
    )
    selector.setFillStyle(styles.colors.selector, styles.selector.fillAlpha)
    selector.setStrokeStyle(
        styles.selector.strokeWidth,
        styles.colors.selectorStroke
    )
    selector.setDepth(styles.depths.selector)
    elements.push(selector)

    const updateVisuals = (selectedIndex: number) => {
        questTexts.forEach((qt, idx) => {
            qt.setColor(
                idx === selectedIndex ?
                    styles.colors.questTextSelected
                :   styles.colors.questText
            )
        })
        selector.setY(startY + selectedIndex * styles.layout.rowSpacing)
    }

    const toggleDone = (index: number) => {
        const newVal = !doneStates[index]
        doneStates[index] = newVal
        const mark = doneMarks[index]

        mark.setVisible(newVal)
        if (newVal) {
            scene.tweens.add({
                targets: mark,
                scale: {
                    from: styles.animations.tickScale.from,
                    to: styles.animations.tickScale.to,
                },
                ease: styles.animations.tickEase,
                duration: styles.animations.tickDuration,
            })
        }

        persistToggle(index, newVal).then((ok) => {
            if (!ok) {
                doneStates[index] = !newVal
                mark.setVisible(!newVal)
            }
        })
    }

    quests.forEach((q, i) => {
        const y = startY + i * styles.layout.rowSpacing
        const combined = `${i + 1}. ${q.title}   (${q.points}pts)`

        const qt = scene.add
            .text(startX, y, combined, {
                fontSize: styles.typography.questSize,
                color: styles.colors.questText,
                fontFamily: styles.typography.fontFamily,
            })
            .setOrigin(0, 0.5)
            .setDepth(styles.depths.text)

        ellipsizeToFit(
            qt,
            combined,
            doneX - styles.layout.maxTextMargin - startX
        )
        questTexts.push(qt)

        const hitWidth = Math.max(doneX + 24 - startX, 120)
        const hit = scene.add.rectangle(
            startX + hitWidth / 2,
            y,
            hitWidth,
            styles.layout.rowSpacing * 0.9,
            0,
            0
        )
        hit.setInteractive({cursor: 'pointer'}).setDepth(
            styles.depths.background
        )

        const tick = scene.add
            .text(doneX, y, '✓', {
                fontSize: `${Math.round(styles.selector.size * 1.6)}px`,
                color: styles.colors.tickMark,
                fontFamily: styles.typography.fontFamily,
            })
            .setOrigin(0.5)
            .setDepth(styles.depths.tickMark)
            .setVisible(doneStates[i])

        doneMarks.push(tick)
        elements.push(qt, hit, tick)

        // Mouse interactions
        const handleClick = (
            _pointer: Phaser.Input.Pointer,
            _localX: number,
            _localY: number,
            event: Phaser.Types.Input.EventData
        ) => {
            event.stopPropagation()
            updateVisuals(i)
            toggleDone(i)
        }
        qt.setInteractive({cursor: 'pointer'})
        qt.on('pointerover', () => updateVisuals(i))
        qt.on('pointerdown', handleClick)
        hit.on('pointerover', () => updateVisuals(i))
        hit.on('pointerdown', handleClick)
    })

    return {elements, updateVisuals, toggleDone}
}
