import type {Scene} from '@/scenes/Scene'
import {chalkboardStyles as styles} from '@/interactions/styles/chalkboardStyles'

export type ConfirmOptions = {
    title?: string
    yesText?: string
    noText?: string
    x?: number
    y?: number
    // optional callbacks invoked when user confirms or cancels
    onConfirm?: () => void | Promise<void>
    onCancel?: () => void
}

export function createConfirmDialog(scene: Scene, opts: ConfirmOptions = {}) {
    const title = opts.title ?? 'Confirm?'
    const yesText = opts.yesText ?? 'Yes'
    const noText = opts.noText ?? 'No'
    const cx = opts.x ?? scene.cameras.main.centerX
    const cy = opts.y ?? scene.cameras.main.centerY

    let bg: Phaser.GameObjects.Rectangle | null = null
    let txt: Phaser.GameObjects.Text | null = null
    let btnYes: Phaser.GameObjects.Text | null = null
    let btnNo: Phaser.GameObjects.Text | null = null

    let enterKey: Phaser.Input.Keyboard.Key | null = null
    let escKey: Phaser.Input.Keyboard.Key | null = null
    let eKey: Phaser.Input.Keyboard.Key | null = null

    let leftKey: Phaser.Input.Keyboard.Key | null = null
    let rightKey: Phaser.Input.Keyboard.Key | null = null
    let aKey: Phaser.Input.Keyboard.Key | null = null
    let dKey: Phaser.Input.Keyboard.Key | null = null
    let qKey: Phaser.Input.Keyboard.Key | null = null

    let selectionIndex = 0 // 0 = Yes, 1 = No

    const updateSelectionVisual = () => {
        try {
            if (btnYes && btnNo) {
                if (selectionIndex === 0) {
                    btnYes.setColor(styles.colors.tickMark)
                    btnYes.setScale(1.06)
                    btnNo.setColor(styles.colors.questText)
                    btnNo.setScale(1)
                } else {
                    btnNo.setColor(styles.colors.tickMark)
                    btnNo.setScale(1.06)
                    btnYes.setColor(styles.colors.questText)
                    btnYes.setScale(1)
                }
            }
        } catch {
            /* ignore visual update failures */
        }
    }

    // handler refs so we can remove only our listeners (don't clobber others)
    let enterHandler: (() => void) | null = null
    let eHandler: (() => void) | null = null
    let escHandler: (() => void) | null = null
    let leftHandler: (() => void) | null = null
    let rightHandler: (() => void) | null = null
    let aHandler: (() => void) | null = null
    let dHandler: (() => void) | null = null
    let qHandler: (() => void) | null = null

    const close = () => {
        // clear dialog active flag
        try {
            scene.data.set('__dialogActive__', false)
        } catch {
            /* ignore */
        }

        // remove only the listeners we registered — do not destroy shared Key objects
        try {
            if (enterKey && enterHandler) enterKey.off('down', enterHandler)
        } catch {}
        try {
            if (eKey && eHandler) eKey.off('down', eHandler)
        } catch {}
        try {
            if (escKey && escHandler) escKey.off('down', escHandler)
        } catch {}
        try {
            if (leftKey && leftHandler) leftKey.off('down', leftHandler)
        } catch {}
        try {
            if (rightKey && rightHandler) rightKey.off('down', rightHandler)
        } catch {}
        try {
            if (aKey && aHandler) aKey.off('down', aHandler)
        } catch {}
        try {
            if (dKey && dHandler) dKey.off('down', dHandler)
        } catch {}
        try {
            if (qKey && qHandler) qKey.off('down', qHandler)
        } catch {}

        // Destroy dialog visuals
        try {
            btnYes?.destroy()
        } catch {}
        try {
            btnNo?.destroy()
        } catch {}
        try {
            txt?.destroy()
        } catch {}
        try {
            bg?.destroy()
        } catch {}

        // clear handler refs so GC can collect closures
        enterHandler = null
        eHandler = null
        escHandler = null
        leftHandler = null
        rightHandler = null
        aHandler = null
        dHandler = null
        qHandler = null
    }

    const open = () => {
        try {
            scene.data.set('__dialogActive__', true)
        } catch {
            /* ignore */
        }

        bg = scene.add
            .rectangle(cx, cy, 360, 120, 0x222222)
            .setDepth(styles.depths.selector + 10)
            .setStrokeStyle(2, 0xffffff)
        try {
            bg.setInteractive()
        } catch {
            /* ignore */
        }

        txt = scene.add
            .text(cx, cy - 20, title, {
                fontSize: styles.typography.questSize,
                color: '#ffffff',
                fontFamily: styles.typography.fontFamily,
            })
            .setOrigin(0.5)
            .setDepth(styles.depths.selector + 11)

        btnYes = scene.add
            .text(cx - 60, cy + 24, yesText, {
                fontSize: styles.typography.questSize,
                color: styles.colors.tickMark,
                fontFamily: styles.typography.fontFamily,
            })
            .setOrigin(0.5)
            .setDepth(styles.depths.selector + 11)
            .setInteractive({cursor: 'pointer'})

        btnNo = scene.add
            .text(cx + 60, cy + 24, noText, {
                fontSize: styles.typography.questSize,
                color: styles.colors.questText,
                fontFamily: styles.typography.fontFamily,
            })
            .setOrigin(0.5)
            .setDepth(styles.depths.selector + 11)
            .setInteractive({cursor: 'pointer'})

        // pointer handlers
        btnYes.on('pointerdown', () => {
            try {
                if (opts.onConfirm) opts.onConfirm()
            } finally {
                close()
            }
        })
        btnNo.on('pointerdown', () => {
            try {
                if (opts.onCancel) opts.onCancel()
            } finally {
                close()
            }
        })

        // keyboard handlers
        try {
            enterKey = scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.ENTER
            )
            eKey = scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.E
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
            qKey = scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.Q
            )

            enterHandler = () => {
                try {
                    if (selectionIndex === 0) {
                        if (opts.onConfirm) opts.onConfirm()
                    } else {
                        if (opts.onCancel) opts.onCancel()
                    }
                } finally {
                    close()
                }
            }
            enterKey!.on('down', enterHandler)

            eHandler = enterHandler
            eKey!.on('down', eHandler)

            escHandler = () => {
                try {
                    if (opts.onCancel) opts.onCancel()
                } finally {
                    close()
                }
            }
            escKey!.on('down', escHandler)

            leftHandler = () => {
                selectionIndex = (selectionIndex + 1) % 2
                updateSelectionVisual()
            }
            rightHandler = () => {
                selectionIndex = (selectionIndex + 1) % 2
                updateSelectionVisual()
            }
            leftKey!.on('down', leftHandler)
            aHandler = leftHandler
            aKey!.on('down', aHandler)
            rightKey!.on('down', rightHandler)
            dHandler = rightHandler
            dKey!.on('down', dHandler)

            qHandler = () => {
                try {
                    if (opts.onCancel) opts.onCancel()
                } finally {
                    close()
                }
            }
            qKey!.on('down', qHandler)

            updateSelectionVisual()
        } catch {
            /* ignore keyboard registration failures */
        }
    }

    // close is defined above

    return {open, close}
}
