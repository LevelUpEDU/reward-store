import {chalkboardStyles as styles} from '@/interactions/styles/chalkboardStyles'
import type {Scene} from '@/scenes/Scene'
import {type Quest, persistToggle} from './questData'
import {createConfirmDialog} from './chalkboardDialog'
import type {MenuNavigationControls} from '@/utils/menuNavigation'
import {ellipsizeToFit} from './chalkboardUIHelpers'

export function createQuestUI(
    scene: Scene,
    quests: Quest[],
    doneStates: boolean[],
    startX: number,
    startY: number,
    doneX: number,
    showDoneColumn: boolean = true,
    _navigationSetter?: (controls: MenuNavigationControls) => void,
    onQuestSubmitted?: () => Promise<void>,
    boardName?: string, // pass board name to detect 'Approved'
    userEmail?: string, // pass user email for claim
    claimedSubmissionIds?: number[] // pass claimed submission ids for Approved board
) {
    const questTexts: Phaser.GameObjects.Text[] = []
    const doneMarks: Phaser.GameObjects.Text[] = []
    const elements: Phaser.GameObjects.GameObject[] = []

    let selector: Phaser.GameObjects.Rectangle | undefined = undefined
    // Only render Done column and selector for Available board
    const showDone = showDoneColumn && boardName === 'Available'
    if (showDone) {
        selector = scene.add.rectangle(
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
    }

    const updateVisuals = (selectedIndex: number) => {
        questTexts.forEach((qt, idx) => {
            qt.setColor(
                idx === selectedIndex ?
                    styles.colors.questTextSelected
                :   styles.colors.questText
            )
            try {
                const qtWithScale = qt as unknown as {
                    setScale?: (s: number) => void
                    scaleX?: number
                }
                if (typeof qtWithScale.setScale === 'function') {
                    qtWithScale.setScale(qtWithScale.scaleX ?? 1)
                }
                scene.tweens.killTweensOf(qt)
                const targetScale = idx === selectedIndex ? 1.06 : 1
                scene.tweens.add({
                    targets: qt,
                    scale: targetScale,
                    duration: 120,
                    ease: 'Quad.Out',
                })
            } catch {
                /* ignore */
            }
        })
        if (selector)
            selector.setY(startY + selectedIndex * styles.layout.rowSpacing)
    }

    let navControls: MenuNavigationControls | undefined
    let dialogActive = false

    const setNavigationControls = (c: MenuNavigationControls) => {
        navControls = c
    }

    const toggleDone = (index: number) => {
        if (!showDoneColumn) return
        const newVal = !doneStates[index]
        const mark = doneMarks[index]
        if (newVal) {
            if (dialogActive) return
            dialogActive = true
            try {
                try {
                    console.warn(
                        '[chalkboardQuestList] pausing nav for dialog',
                        {index}
                    )
                } catch {}
                navControls?.pause?.()
            } catch {
                /* ignore */
            }
            const cy = startY + index * styles.layout.rowSpacing
            const dlg = createConfirmDialog(scene, {
                title: 'Quest marked as done?',
                x: startX + (doneX - startX) / 2,
                y: cy,
                onConfirm: async () => {
                    doneStates[index] = true
                    mark.setVisible(true)
                    try {
                        scene.tweens.add({
                            targets: mark,
                            scale: {
                                from: styles.animations.tickScale.from,
                                to: styles.animations.tickScale.to,
                            },
                            ease: styles.animations.tickEase,
                            duration: styles.animations.tickDuration,
                        })
                    } catch {
                        /* ignore */
                    }
                    const q = quests[index]
                    const questId = q?.id
                    try {
                        const ok = await persistToggle(index, true, questId)
                        if (!ok) {
                            doneStates[index] = false
                            mark.setVisible(false)
                        } else {
                            // Quest successfully submitted - trigger refresh if callback provided
                            if (onQuestSubmitted) {
                                try {
                                    await onQuestSubmitted()
                                } catch (refreshErr) {
                                    console.error(
                                        '[chalkboard] onQuestSubmitted error',
                                        refreshErr
                                    )
                                }
                            }
                        }
                    } catch (err) {
                        console.error('[chalkboard] persistToggle error', err)
                        doneStates[index] = false
                        mark.setVisible(false)
                    } finally {
                        dialogActive = false
                        try {
                            console.warn(
                                '[chalkboardQuestList] dialog confirmed; resuming nav',
                                {index}
                            )
                        } catch {}
                        try {
                            navControls?.resume?.()
                        } catch {
                            /* ignore */
                        }
                        try {
                            const idx = navControls?.getSelectedIndex?.()
                            if (typeof idx === 'number') updateVisuals(idx)
                        } catch {
                            /* ignore */
                        }
                    }
                },
                onCancel: () => {
                    doneStates[index] = false
                    mark.setVisible(false)
                    dialogActive = false
                    try {
                        console.warn(
                            '[chalkboardQuestList] dialog canceled; resuming nav',
                            {index}
                        )
                    } catch {}
                    try {
                        navControls?.resume?.()
                    } catch {
                        /* ignore */
                    }
                },
            })
            dlg.open()
            return
        }

        doneStates[index] = false
        mark.setVisible(false)
        const q = quests[index]
        const questId = q?.id
        persistToggle(index, false, questId).then((ok) => {
            if (!ok) {
                doneStates[index] = true
                mark.setVisible(true)
            }
        })
    }

    const claimedStates: boolean[] = quests.map(() => false)

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

        if (showDone) {
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

            const handleToggleClick = (
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
            qt.on('pointerover', () => {
                if (!dialogActive) updateVisuals(i)
            })
            qt.on('pointerdown', handleToggleClick)
            hit.on('pointerover', () => {
                if (!dialogActive) updateVisuals(i)
            })
            hit.on('pointerdown', handleToggleClick)
        } else {
            elements.push(qt, hit)
            qt.setInteractive({cursor: 'pointer'})
            qt.on('pointerover', () => {
                if (!dialogActive) updateVisuals(i)
            })
            const handleSelectClick = (
                _p: Phaser.Input.Pointer,
                _lx: number,
                _ly: number,
                event: Phaser.Types.Input.EventData
            ) => {
                event.stopPropagation()
                updateVisuals(i)
            }
            qt.on('pointerdown', handleSelectClick)
            hit.on('pointerover', () => {
                if (!dialogActive) updateVisuals(i)
            })
            hit.on('pointerdown', handleSelectClick)
        }

        // Add claim button or claimed label for Approved board
        let claimBtn: Phaser.GameObjects.Text | null = null
        let claimedLabel: Phaser.GameObjects.Text | null = null
        if (boardName === 'Approved' && q.submissionId && userEmail) {
            const isClaimed =
                Array.isArray(claimedSubmissionIds) &&
                claimedSubmissionIds.includes(q.submissionId)
            if (isClaimed) {
                claimedLabel = scene.add
                    .text(doneX - 72, y, 'Claimed', {
                        fontSize: styles.typography.questSize,
                        color: '#bdbdbd',
                        fontFamily: styles.typography.fontFamily,
                    })
                    .setOrigin(0, 0.5)
                    .setDepth(styles.depths.text + 2)
                elements.push(claimedLabel)
            } else {
                claimBtn = scene.add
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
                claimBtn.on('pointerdown', async () => {
                    claimBtn?.setText('...')
                    try {
                        const res = await fetch('/api/transactions', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                email: userEmail,
                                points: q.points,
                                submissionId: q.submissionId,
                            }),
                        })
                        if (res.ok) {
                            claimedStates[i] = true
                            claimBtn?.destroy()
                            claimedLabel = scene.add
                                .text(doneX - 72, y, 'Claimed', {
                                    fontSize: styles.typography.questSize,
                                    color: '#bdbdbd',
                                    fontFamily: styles.typography.fontFamily,
                                })
                                .setOrigin(0, 0.5)
                                .setDepth(styles.depths.text + 2)
                            elements.push(claimedLabel)
                            console.log(
                                '[chalkboardQuestList] Claimed label pushed to elements:',
                                claimedLabel
                            )
                            console.log(elements)
                        } else {
                            claimBtn?.setText('Claim')
                        }
                    } catch {
                        claimBtn?.setText('Claim')
                    }
                })
                elements.push(claimBtn)
            }
        }
    })

    // Debug: log destruction of all elements
    function destroyAllElements() {
        elements.forEach((el) => {
            console.log('[chalkboardQuestList] Destroying element:', el)
            try {
                el.destroy()
            } catch {}
        })
        elements.length = 0
    }

    return {
        elements,
        updateVisuals,
        toggleDone,
        navigationSetter: setNavigationControls,
        isDialogActive: () => dialogActive,
        destroyAllElements,
    }
}
