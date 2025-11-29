import {chalkboardStyles as styles} from '@/interactions/styles/chalkboardStyles'
import type {Scene} from '@/scenes/Scene'
import {type Quest, persistToggle} from './questData'
import {createConfirmDialog} from './chalkboardDialog'
import type {MenuNavigationControls} from '@/ui/menuNavigation'
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

    const toggleDoneInternal = (index: number) => {
        if (!showDoneColumn) return

        // 1. STRICT GET: Retrieve Course ID from registry
        const currentCourseId = scene.registry.get('courseId')
        const userEmail = scene.registry.get('userEmail')

        // 2. GUARD CLAUSE: Stop immediately if no valid Course ID exists
        // This ensures we never save data to a default/random course
        if (typeof currentCourseId !== 'number') {
            console.error(
                '[chalkboardQuestList] Critical: Cannot toggle quest. No Course ID found in registry.'
            )
            return
        }

        const newVal = !doneStates[index]
        // Get the relative index in the visible window
        const relativeIndex = index - windowStart
        const mark = doneMarks[relativeIndex]

        // If mark doesn't exist (quest not currently visible), we can't show UI feedback
        if (!mark) {
            console.warn(
                '[chalkboardQuestList] Cannot toggle quest not in visible window',
                {index, windowStart}
            )
            return
        }

        // Case A: Marking as Done (True) -> Requires Confirmation Dialog
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
            const cy = startY + relativeIndex * styles.layout.rowSpacing
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
                        // PASS STRICT COURSE ID
                        const ok = await persistToggle(
                            index,
                            true,
                            questId,
                            currentCourseId,
                            userEmail
                        )
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

        // Case B: Unmarking (False) -> Immediate Action
        doneStates[index] = false
        mark.setVisible(false)
        const q = quests[index]
        const questId = q?.id

        // PASS STRICT COURSE ID
        persistToggle(index, false, questId, currentCourseId, userEmail).then(
            (ok) => {
                if (!ok) {
                    // Revert UI if server save failed
                    doneStates[index] = true
                    mark.setVisible(true)
                }
            }
        )
    }

    const claimedStates: boolean[] = quests.map(() => false)

    // Windowed quest list - only show 5 quests at a time
    let windowStart = 0
    const VISIBLE_QUESTS = 5
    const questHits: Phaser.GameObjects.Rectangle[] = []
    let downArrow: Phaser.GameObjects.Text | null = null
    let upArrow: Phaser.GameObjects.Text | null = null

    function renderQuestWindow() {
        // Clear existing quest elements
        questTexts.forEach((qt) => qt.destroy())
        doneMarks.forEach((dm) => dm.destroy())
        questHits.forEach((hit) => hit.destroy())
        if (downArrow) {
            downArrow.destroy()
            downArrow = null
        }
        if (upArrow) {
            upArrow.destroy()
            upArrow = null
        }
        questTexts.length = 0
        doneMarks.length = 0
        questHits.length = 0

        // Render visible quests
        const endIndex = Math.min(windowStart + VISIBLE_QUESTS, quests.length)
        for (let idx = 0; idx < endIndex - windowStart; idx++) {
            const i = windowStart + idx
            const q = quests[i]
            const y = startY + idx * styles.layout.rowSpacing
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
            questHits.push(hit)

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
                    updateVisuals(idx)
                    toggleDoneInternal(i)
                }
                qt.setInteractive({cursor: 'pointer'})
                qt.on('pointerover', () => {
                    if (!dialogActive) updateVisuals(idx)
                })
                qt.on('pointerdown', handleToggleClick)
                hit.on('pointerover', () => {
                    if (!dialogActive) updateVisuals(idx)
                })
                hit.on('pointerdown', handleToggleClick)
            } else {
                elements.push(qt, hit)
                qt.setInteractive({cursor: 'pointer'})
                qt.on('pointerover', () => {
                    if (!dialogActive) updateVisuals(idx)
                })
                const handleSelectClick = (
                    _p: Phaser.Input.Pointer,
                    _lx: number,
                    _ly: number,
                    event: Phaser.Types.Input.EventData
                ) => {
                    event.stopPropagation()
                    updateVisuals(idx)
                }
                qt.on('pointerdown', handleSelectClick)
                hit.on('pointerover', () => {
                    if (!dialogActive) updateVisuals(idx)
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
                                        fontFamily:
                                            styles.typography.fontFamily,
                                    })
                                    .setOrigin(0, 0.5)
                                    .setDepth(styles.depths.text + 2)
                                elements.push(claimedLabel)
                                console.warn(
                                    '[chalkboardQuestList] Claimed label pushed to elements:',
                                    claimedLabel
                                )
                                console.warn(elements)
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
        }

        // Show up arrow if there are more quests above
        if (windowStart > 0) {
            const arrowY = startY - 12 // Position above the first quest
            const centerX = startX + (doneX - startX) / 2
            upArrow = scene.add
                .text(centerX, arrowY, '▲', {
                    fontSize: '32px',
                    color: '#fff',
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5, 1) // Anchor at bottom center
                .setDepth(styles.depths.text + 3)
            elements.push(upArrow)
        }

        // Show down arrow if there are more quests below
        if (windowStart + VISIBLE_QUESTS < quests.length) {
            const arrowY =
                startY + (VISIBLE_QUESTS - 0.6) * styles.layout.rowSpacing
            const centerX = startX + (doneX - startX) / 2
            downArrow = scene.add
                .text(centerX, arrowY, '▼', {
                    fontSize: '32px',
                    color: '#fff',
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5, 0)
                .setDepth(styles.depths.text + 3)
            elements.push(downArrow)
        }
    }

    // Initial render
    renderQuestWindow()

    // Debug: log destruction of all elements
    function destroyAllElements() {
        elements.forEach((el) => {
            console.warn('[chalkboardQuestList] Destroying element:', el)
            try {
                el.destroy()
            } catch {}
        })
        elements.length = 0
    }

    // Scroll window functions for navigation
    function scrollWindowDown() {
        if (windowStart + VISIBLE_QUESTS < quests.length) {
            windowStart++
            renderQuestWindow()
            return true
        }
        return false
    }

    function scrollWindowUp() {
        if (windowStart > 0) {
            windowStart--
            renderQuestWindow()
            return true
        }
        return false
    }

    function getWindowStart() {
        return windowStart
    }

    function getVisibleCount() {
        return Math.min(VISIBLE_QUESTS, quests.length - windowStart)
    }

    function getAbsoluteIndex(relativeIndex: number): number {
        return windowStart + relativeIndex
    }

    return {
        elements,
        updateVisuals,
        toggleDone: (relativeIndex: number) => {
            const absoluteIndex = getAbsoluteIndex(relativeIndex)
            toggleDoneInternal(absoluteIndex)
        },
        navigationSetter: setNavigationControls,
        isDialogActive: () => dialogActive,
        destroyAllElements,
        scrollWindowDown,
        scrollWindowUp,
        getWindowStart,
        getVisibleCount,
    }
}
