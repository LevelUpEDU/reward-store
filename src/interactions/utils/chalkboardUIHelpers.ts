import {chalkboardStyles as styles} from '@/interactions/styles/chalkboardStyles'
import type {Scene} from '@/scenes/Scene'
import {type Quest, persistToggle} from './questData'
import type {MenuNavigationControls} from '@/utils/menuNavigation'

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
    doneX: number,
    // whether to show the Done column (only for Pending board)
    showDoneColumn: boolean = true,
    // optional setter so the caller can receive navigation controls
    navigationSetter?: (
        controls: import('@/utils/menuNavigation').MenuNavigationControls
    ) => void
) {
    const questTexts: Phaser.GameObjects.Text[] = []
    const doneMarks: Phaser.GameObjects.Text[] = []
    const elements: Phaser.GameObjects.GameObject[] = []

    // Create done label and selector only when requested
    let doneLabel: Phaser.GameObjects.Text | undefined = undefined
    let selector: Phaser.GameObjects.Rectangle | undefined = undefined
    if (showDoneColumn) {
        doneLabel = scene.add
            .text(doneX, startY - styles.layout.doneLabelOffsetY, 'Done?', {
                fontSize: styles.typography.doneLabelSize,
                color: styles.colors.doneLabel,
                fontFamily: styles.typography.fontFamily,
            })
            .setOrigin(0.5)
            .setDepth(styles.depths.text)
        elements.push(doneLabel)

        // Create selector
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
                // ensure there's a defined base scale
                ;(qt as any).setScale &&
                    (qt as any).setScale((qt as any).scaleX ?? 1)
                // remove any existing tweens and animate to highlighted scale or back to 1
                scene.tweens.killTweensOf(qt)
                const targetScale = idx === selectedIndex ? 1.06 : 1
                scene.tweens.add({
                    targets: qt,
                    scale: targetScale,
                    duration: 120,
                    ease: 'Quad.Out',
                })
            } catch (e) {
                /* ignore tween errors */
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
        if (!showDoneColumn) return // only allow toggling when done column is visible (pending board)
        const newVal = !doneStates[index]
        const mark = doneMarks[index]

        // If marking as done, show a confirmation dialog first
        if (newVal) {
            if (dialogActive) return
            // create a modal confirm dialog centered near the row
            const dialogWidth = Math.min(400, styles.layout.maxTextMargin + 40)
            const dialogHeight = 120
            const cx = doneX - dialogWidth / 2
            const cy = startY + index * styles.layout.rowSpacing

            const dialogBg = scene.add
                .rectangle(
                    startX + (doneX - startX) / 2,
                    cy,
                    dialogWidth,
                    dialogHeight,
                    0x222222
                )
                .setDepth(styles.depths.selector + 10)
                .setStrokeStyle(2, 0xffffff)
            // block input from reaching underlying UI while dialog is open
            dialogBg.setInteractive()
            dialogBg.on(
                'pointerdown',
                (
                    _p: Phaser.Input.Pointer,
                    _lx: number,
                    _ly: number,
                    e: Phaser.Types.Input.EventData
                ) => {
                    e.stopPropagation()
                }
            )

            const dialogText = scene.add
                .text(dialogBg.x, cy - 20, 'Quest marked as done?', {
                    fontSize: styles.typography.questSize,
                    color: '#ffffff',
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5, 0.5)
                .setDepth(styles.depths.selector + 11)

            // ensure the dialog background is wide enough to contain the text + padding
            try {
                const padding = 48
                const neededWidth = Math.max(
                    dialogWidth,
                    Math.ceil(dialogText.width + padding)
                )
                // update rectangle size while keeping center
                dialogBg.setSize(neededWidth, dialogHeight)
            } catch (e) {
                /* ignore if measurement fails */
            }

            const btnYes = scene.add
                .text(dialogBg.x - 60, cy + 25, 'Yes', {
                    fontSize: styles.typography.questSize,
                    color: styles.colors.tickMark,
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5)
                .setDepth(styles.depths.selector + 11)
                .setInteractive({cursor: 'pointer'})

            const btnNo = scene.add
                .text(dialogBg.x + 60, cy + 25, 'No', {
                    fontSize: styles.typography.questSize,
                    color: styles.colors.questText,
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5)
                .setDepth(styles.depths.selector + 11)
                .setInteractive({cursor: 'pointer'})

            // ensure dialog elements are destroyed on cleanup
            elements.push(dialogBg, dialogText, btnYes, btnNo)

            // keyboard handlers for dialog
            let enterKey: Phaser.Input.Keyboard.Key | null = null
            let escKey: Phaser.Input.Keyboard.Key | null = null
            let qKey: Phaser.Input.Keyboard.Key | null = null
            let leftKey: Phaser.Input.Keyboard.Key | null = null
            let rightKey: Phaser.Input.Keyboard.Key | null = null
            let aKey: Phaser.Input.Keyboard.Key | null = null
            let dKey: Phaser.Input.Keyboard.Key | null = null
            let wKey: Phaser.Input.Keyboard.Key | null = null
            let sKey: Phaser.Input.Keyboard.Key | null = null
            let eKey: Phaser.Input.Keyboard.Key | null = null

            let yesSelected = true

            // mark dialog active so underlying UI ignores pointer events
            dialogActive = true

            const refreshDialogSelection = () => {
                try {
                    btnYes.setColor(
                        yesSelected ?
                            styles.colors.tickMark
                        :   styles.colors.questText
                    )
                    btnNo.setColor(
                        !yesSelected ?
                            styles.colors.tickMark
                        :   styles.colors.questText
                    )

                    // visual scale feedback: enlarge selected option slightly
                    try {
                        const targetYesScale = yesSelected ? 1.12 : 1
                        const targetNoScale = !yesSelected ? 1.12 : 1
                        // kill any existing tweens on these objects (defensive)
                        scene.tweens.killTweensOf(btnYes)
                        scene.tweens.killTweensOf(btnNo)
                        scene.tweens.add({
                            targets: btnYes,
                            scale: targetYesScale,
                            duration: 120,
                            ease: 'Quad.Out',
                        })
                        scene.tweens.add({
                            targets: btnNo,
                            scale: targetNoScale,
                            duration: 120,
                            ease: 'Quad.Out',
                        })
                    } catch (e) {
                        /* ignore tween errors */
                    }
                } catch (e) {
                    /* ignore */
                }
            }

            // Handlers declared in outer scope so cleanup can remove them correctly
            let enterHandler: (() => void) | null = null
            let escHandler: (() => void) | null = null
            let qHandler: (() => void) | null = null
            let leftHandler: (() => void) | null = null
            let rightHandler: (() => void) | null = null

            let cleanedUp = false
            let confirmInFlight = false

            const cleanupDialog = () => {
                if (cleanedUp) return
                cleanedUp = true

                // remove pointer handlers first to avoid re-entrancy
                try {
                    btnYes.off('pointerdown')
                } catch (e) {
                    /* ignore */
                }
                try {
                    btnYes.off('pointerover')
                } catch (e) {
                    /* ignore */
                }
                try {
                    btnNo.off('pointerdown')
                } catch (e) {
                    /* ignore */
                }
                try {
                    btnNo.off('pointerover')
                } catch (e) {
                    /* ignore */
                }

                try {
                    dialogBg.destroy()
                } catch (e) {
                    /* ignore */
                }
                try {
                    dialogText.destroy()
                } catch (e) {
                    /* ignore */
                }
                try {
                    btnYes.destroy()
                } catch (e) {
                    /* ignore */
                }
                try {
                    btnNo.destroy()
                } catch (e) {
                    /* ignore */
                }

                // remove keyboard handlers that we added
                try {
                    if (enterKey && enterHandler) {
                        enterKey.off('down', enterHandler)
                        enterKey = null
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    if (escKey && escHandler) {
                        escKey.off('down', escHandler)
                        escKey = null
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    if (qKey && qHandler) {
                        qKey.off('down', qHandler)
                        qKey = null
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    if (leftKey && leftHandler) {
                        leftKey.off('down', leftHandler)
                        leftKey = null
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    if (rightKey && rightHandler) {
                        rightKey.off('down', rightHandler)
                        rightKey = null
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    if (aKey && leftHandler) {
                        aKey.off('down', leftHandler)
                        aKey = null
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    if (dKey && rightHandler) {
                        dKey.off('down', rightHandler)
                        dKey = null
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    if (wKey && leftHandler) {
                        wKey.off('down', leftHandler)
                        wKey = null
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    if (sKey && rightHandler) {
                        sKey.off('down', rightHandler)
                        sKey = null
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    if (eKey && enterHandler) {
                        eKey.off('down', enterHandler)
                        eKey = null
                    }
                } catch (e) {
                    /* ignore */
                }

                // resume navigation if it was paused
                try {
                    // clear dialog active flag so underlying UI can react again
                    dialogActive = false

                    navControls?.resume?.()
                    // refresh visuals to reflect current selection after resume
                    try {
                        const idx = navControls?.getSelectedIndex?.()
                        if (typeof idx === 'number') updateVisuals(idx)
                    } catch (e) {
                        /* ignore */
                    }
                } catch (e) {
                    /* ignore */
                }
            }

            // Confirm handler: proceed with marking done and persist
            const confirmAction = async () => {
                if (confirmInFlight) return
                confirmInFlight = true
                console.debug('[chalkboard] confirmAction start', {index})

                // immediately disable pointer interaction for dialog buttons to avoid double-clicks
                try {
                    btnYes.disableInteractive()
                } catch (e) {
                    /* ignore */
                }
                try {
                    btnNo.disableInteractive()
                } catch (e) {
                    /* ignore */
                }

                // update state and show tick
                doneStates[index] = true
                mark.setVisible(true)
                scene.tweens.add({
                    targets: mark,
                    scale: {
                        from: styles.animations.tickScale.from,
                        to: styles.animations.tickScale.to,
                    },
                    ease: styles.animations.tickEase,
                    duration: styles.animations.tickDuration,
                })

                // prefer to send questId when available
                const q = (quests as any)[index]
                const questId = q?.id
                try {
                    const ok = await persistToggle(index, true, questId)
                    if (!ok) {
                        doneStates[index] = false
                        mark.setVisible(false)
                    }
                } catch (err) {
                    console.error('[chalkboard] persistToggle error', err)
                    doneStates[index] = false
                    mark.setVisible(false)
                } finally {
                    console.debug('[chalkboard] confirmAction end', {index})
                    cleanupDialog()
                }
            }

            btnYes.on('pointerdown', confirmAction)
            // pointerover should switch selection to Yes
            const btnYesOver = () => {
                yesSelected = true
                refreshDialogSelection()
            }
            btnYes.on('pointerover', btnYesOver)
            // start with Yes selected visually
            refreshDialogSelection()

            // Cancel handler: do nothing / keep unchecked
            const cancelAction = () => {
                if (confirmInFlight) return // if confirm already in flight, ignore cancel
                doneStates[index] = false
                mark.setVisible(false)
                cleanupDialog()
            }

            btnNo.on('pointerdown', cancelAction)
            // pointerover should switch selection to No
            const btnNoOver = () => {
                yesSelected = false
                refreshDialogSelection()
            }
            btnNo.on('pointerover', btnNoOver)

            // pause main navigation while dialog is shown and bind keys
            try {
                navControls?.pause?.()
            } catch (e) {
                /* ignore */
            }
            try {
                enterKey = scene.input.keyboard!.addKey(
                    Phaser.Input.Keyboard.KeyCodes.ENTER
                )
                escKey = scene.input.keyboard!.addKey(
                    Phaser.Input.Keyboard.KeyCodes.ESC
                )
                leftKey = scene.input.keyboard!.addKey(
                    Phaser.Input.Keyboard.KeyCodes.LEFT
                )
                rightKey = scene.input.keyboard!.addKey(
                    Phaser.Input.Keyboard.KeyCodes.RIGHT
                )
                aKey = scene.input.keyboard!.addKey(
                    Phaser.Input.Keyboard.KeyCodes.A
                )
                dKey = scene.input.keyboard!.addKey(
                    Phaser.Input.Keyboard.KeyCodes.D
                )
                wKey = scene.input.keyboard!.addKey(
                    Phaser.Input.Keyboard.KeyCodes.W
                )
                sKey = scene.input.keyboard!.addKey(
                    Phaser.Input.Keyboard.KeyCodes.S
                )
                eKey = scene.input.keyboard!.addKey(
                    Phaser.Input.Keyboard.KeyCodes.E
                )

                // Toggle selection on left/right or A/D so repeated presses wrap between Yes/No
                const toggleSelection = () => {
                    yesSelected = !yesSelected
                    refreshDialogSelection()
                }

                leftHandler = toggleSelection
                rightHandler = toggleSelection
                enterHandler = () => {
                    yesSelected ? void confirmAction() : cancelAction()
                }
                escHandler = cancelAction
                qHandler = cancelAction

                leftKey.on('down', leftHandler)
                aKey.on('down', leftHandler)
                rightKey.on('down', rightHandler)
                dKey.on('down', rightHandler)
                wKey.on('down', leftHandler)
                sKey.on('down', rightHandler)

                // E key confirms current selection; Enter still works
                eKey.on('down', enterHandler)
                enterKey.on('down', enterHandler)
                escKey.on('down', escHandler)
                // Q should cancel the dialog (same as No)
                qKey = scene.input.keyboard!.addKey(
                    Phaser.Input.Keyboard.KeyCodes.Q
                )
                qKey.on('down', qHandler)
            } catch (e) {
                /* ignore */
            }

            return
        }

        // Unchecking: proceed immediately
        doneStates[index] = false
        mark.setVisible(false)
        // prefer to send questId when available
        const q = (quests as any)[index]
        const questId = q?.id
        persistToggle(index, false, questId).then((ok) => {
            if (!ok) {
                doneStates[index] = true
                mark.setVisible(true)
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

        if (showDoneColumn) {
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

            // Mouse interactions that toggle
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
            // No done column: still allow selection via pointer but don't toggle done
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
    })

    return {
        elements,
        updateVisuals,
        toggleDone,
        navigationSetter: setNavigationControls,
        // allow callers to check whether a modal dialog is currently active
        isDialogActive: () => dialogActive,
    }
}
