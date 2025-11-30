/**
 * Quest list renderer for chalkboard
 * Handles rendering quests, done checkmarks, claim buttons, and scroll indicators
 */

import {chalkboardStyles as styles} from '@/ui/styles/chalkboardStyles'
import type {ScrollWindowControls} from '@/ui/components/scrollWindow'
import type {Quest} from './types'
import {createConfirmDialog} from './confirmDialog'
import {persistToggle} from './api'

const VISIBLE_QUEST_COUNT = 5

export interface QuestListOptions {
    scene: Phaser.Scene
    quests: Quest[]
    startX: number
    startY: number
    doneX: number
    boardName: string
    userEmail: string
    claimedIds: number[]
    scrollWindow: ScrollWindowControls<Quest>
    onQuestSubmitted?: () => Promise<void>
}

export interface QuestListControls {
    elements: Phaser.GameObjects.GameObject[]
    updateVisuals: (index: number) => void
    toggleDone: (relativeIndex: number) => void
    getVisibleCount: () => number
    isDialogActive: () => boolean
    renderWindow: () => void
    destroy: () => void
}

/**
 * Creates a quest list with interactive elements
 * @param opts - Configuration options
 * @returns Controls for managing the quest list
 */
export function createQuestList(opts: QuestListOptions): QuestListControls {
    const {
        scene,
        quests,
        startX,
        startY,
        doneX,
        boardName,
        userEmail,
        claimedIds,
        scrollWindow,
        onQuestSubmitted,
    } = opts

    const elements: Phaser.GameObjects.GameObject[] = []
    const doneStates = quests.map((q) => Boolean(q.done))
    const isAvailable = boardName === 'Available'
    const isApproved = boardName === 'Approved'

    let _selectedIndex = 0
    let dialogActive = false

    const questTexts: Phaser.GameObjects.Text[] = []
    const doneMarks: Phaser.GameObjects.Text[] = []

    // Selector for Available board
    let selector: Phaser.GameObjects.Rectangle | null = null
    if (isAvailable) {
        selector = scene.add
            .rectangle(
                doneX,
                startY,
                styles.selector.size,
                styles.selector.size,
                styles.colors.selector
            )
            .setFillStyle(styles.colors.selector, styles.selector.fillAlpha)
            .setStrokeStyle(
                styles.selector.strokeWidth,
                styles.colors.selectorStroke
            )
            .setDepth(styles.depths.selector)
        elements.push(selector)
    }

    /**
     * Update visual highlighting for selected quest
     */
    const updateVisuals = (index: number) => {
        _selectedIndex = index
        questTexts.forEach((qt, i) => {
            const isSelected = i === index
            qt.setColor(
                isSelected ?
                    styles.colors.questTextSelected
                :   styles.colors.questText
            )
            scene.tweens.killTweensOf(qt)
            scene.tweens.add({
                targets: qt,
                scale: isSelected ? 1.06 : 1,
                duration: 120,
                ease: 'Quad.Out',
            })
        })
        if (selector) {
            selector.setY(startY + index * styles.layout.rowSpacing)
        }
    }

    /**
     * Toggle quest done status with confirmation dialog
     */
    const toggleDone = (relativeIndex: number) => {
        if (!isAvailable || dialogActive) return

        const absoluteIndex = scrollWindow.getOffset() + relativeIndex
        const quest = quests[absoluteIndex]
        const mark = doneMarks[relativeIndex]
        if (!mark) return

        const courseId = scene.registry.get('courseId')
        const email = scene.registry.get('userEmail')
        if (typeof courseId !== 'number') return

        dialogActive = true
        const cy = startY + relativeIndex * styles.layout.rowSpacing

        createConfirmDialog({
            scene,
            title: 'Mark quest as done?',
            x: startX + (doneX - startX) / 2,
            y: cy,
            onConfirm: async () => {
                doneStates[absoluteIndex] = true
                mark.setVisible(true)
                scene.tweens.add({
                    targets: mark,
                    scale: {from: 0.5, to: 1},
                    duration: 200,
                    ease: 'Back.Out',
                })

                const ok = await persistToggle(
                    absoluteIndex,
                    true,
                    quest.id,
                    courseId,
                    email
                )
                if (!ok) {
                    doneStates[absoluteIndex] = false
                    mark.setVisible(false)
                } else {
                    await onQuestSubmitted?.()
                }
                dialogActive = false
            },
            onCancel: () => {
                dialogActive = false
            },
        })
    }

    /**
     * Claim reward for approved quest
     */
    const claimReward = async (
        quest: Quest,
        index: number,
        btn: Phaser.GameObjects.Text
    ) => {
        btn.setText('...')
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: userEmail,
                    points: quest.points,
                    submissionId: quest.submissionId,
                }),
            })
            if (res.ok) {
                btn.destroy()
                const label = scene.add
                    .text(
                        doneX - 72,
                        startY + index * styles.layout.rowSpacing,
                        'Claimed',
                        {
                            fontSize: styles.typography.questSize,
                            color: '#bdbdbd',
                            fontFamily: styles.typography.fontFamily,
                        }
                    )
                    .setOrigin(0, 0.5)
                    .setDepth(styles.depths.text + 2)
                elements.push(label)
            } else {
                btn.setText('Claim')
            }
        } catch {
            btn.setText('Claim')
        }
    }

    /**
     * Render the visible window of quests
     */
    const renderWindow = () => {
        // Clear existing
        questTexts.forEach((t) => t.destroy())
        doneMarks.forEach((m) => m.destroy())
        questTexts.length = 0
        doneMarks.length = 0

        const visibleQuests = scrollWindow.getVisibleItems()

        for (let i = 0; i < visibleQuests.length; i++) {
            const questIndex = scrollWindow.getOffset() + i
            const quest = visibleQuests[i]
            const y = startY + i * styles.layout.rowSpacing

            // Quest text
            const text = `${questIndex + 1}. ${quest.title}   (${quest.points}pts)`
            const qt = scene.add
                .text(startX, y, text, {
                    fontSize: styles.typography.questSize,
                    color: styles.colors.questText,
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0, 0.5)
                .setDepth(styles.depths.text)
                .setInteractive({cursor: 'pointer'})

            qt.on('pointerover', () => !dialogActive && updateVisuals(i))
            qt.on('pointerdown', () => toggleDone(i))

            questTexts.push(qt)
            elements.push(qt)

            // Done mark for Available board
            if (isAvailable) {
                const tick = scene.add
                    .text(doneX, y, '✓', {
                        fontSize: `${Math.round(styles.selector.size * 1.6)}px`,
                        color: styles.colors.tickMark,
                        fontFamily: styles.typography.fontFamily,
                    })
                    .setOrigin(0.5)
                    .setDepth(styles.depths.tickMark)
                    .setVisible(doneStates[questIndex])

                doneMarks.push(tick)
                elements.push(tick)
            }

            // Claim button for Approved board
            if (isApproved && quest.submissionId && userEmail) {
                const isClaimed = claimedIds.includes(quest.submissionId)
                if (isClaimed) {
                    const label = scene.add
                        .text(doneX - 72, y, 'Claimed', {
                            fontSize: styles.typography.questSize,
                            color: '#bdbdbd',
                            fontFamily: styles.typography.fontFamily,
                        })
                        .setOrigin(0, 0.5)
                        .setDepth(styles.depths.text + 2)
                    elements.push(label)
                } else {
                    const btn = scene.add
                        .text(doneX - 72, y, 'Claim', {
                            fontSize: styles.typography.questSize,
                            color: '#fff',
                            backgroundColor: '#2e7d32',
                            fontFamily: styles.typography.fontFamily,
                            padding: {left: 12, right: 12, top: 2, bottom: 2},
                        })
                        .setOrigin(0, 0.5)
                        .setDepth(styles.depths.text + 2)
                        .setInteractive({cursor: 'pointer'})

                    btn.on('pointerdown', () => claimReward(quest, i, btn))
                    elements.push(btn)
                }
            }
        }

        // Scroll arrows
        if (scrollWindow.canScrollUp()) {
            const arrow = scene.add
                .text(startX + (doneX - startX) / 2, startY - 12, '▲', {
                    fontSize: '32px',
                    color: '#fff',
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5, 1)
                .setDepth(styles.depths.text + 3)
                .setInteractive({cursor: 'pointer'})

            arrow.on('pointerdown', () => {
                if (scrollWindow.canScrollUp()) {
                    scrollWindow.scrollUp()
                }
            })

            elements.push(arrow)
        }

        if (scrollWindow.canScrollDown()) {
            const arrow = scene.add
                .text(
                    startX + (doneX - startX) / 2,
                    startY +
                        (VISIBLE_QUEST_COUNT - 0.6) * styles.layout.rowSpacing,
                    '▼',
                    {
                        fontSize: '32px',
                        color: '#fff',
                        fontFamily: styles.typography.fontFamily,
                    }
                )
                .setOrigin(0.5, 0)
                .setDepth(styles.depths.text + 3)
                .setInteractive({cursor: 'pointer'})

            arrow.on('pointerdown', () => {
                if (scrollWindow.canScrollDown()) {
                    scrollWindow.scrollDown()
                }
            })

            elements.push(arrow)
        }
    }

    renderWindow()

    return {
        elements,
        updateVisuals,
        toggleDone,
        getVisibleCount: () => scrollWindow.getVisibleItems().length,
        isDialogActive: () => dialogActive,
        renderWindow,
        destroy: () => elements.forEach((el) => el.destroy()),
    }
}
