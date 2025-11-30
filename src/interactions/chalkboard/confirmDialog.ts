/**
 * Confirmation dialog for quest actions
 * Simple yes/no dialog with keyboard and mouse support
 */

import {chalkboardStyles as styles} from '@/ui/styles/chalkboardStyles'

export interface ConfirmDialogOptions {
    scene: Phaser.Scene
    title: string
    x: number
    y: number
    onConfirm: () => void
    onCancel: () => void
}

export interface ConfirmDialogControls {
    close: () => void
}

/**
 * Creates a modal confirmation dialog
 * @param opts - Configuration options
 * @returns Controls for closing the dialog
 */
export function createConfirmDialog(
    opts: ConfirmDialogOptions
): ConfirmDialogControls {
    const {scene, title, x, y, onConfirm, onCancel} = opts

    let selectionIndex = 0
    let onKeyDown: ((e: KeyboardEvent) => void) | null = null

    const bg = scene.add
        .rectangle(
            x,
            y,
            styles.confirmDialog.width,
            styles.confirmDialog.height,
            styles.colors.confirmDialogBg
        )
        .setDepth(styles.depths.confirmDialog)
        .setStrokeStyle(2, styles.colors.confirmDialogBorder)
        .setInteractive()

    const txt = scene.add
        .text(x, y - styles.confirmDialog.titleOffsetY, title, {
            fontSize: styles.typography.questSize,
            color: '#ffffff',
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.confirmDialogText)

    const btnYes = scene.add
        .text(
            x - styles.confirmDialog.buttonSpacing,
            y + styles.confirmDialog.buttonOffsetY,
            'Yes',
            {
                fontSize: styles.typography.questSize,
                color: styles.colors.tickMark,
                fontFamily: styles.typography.fontFamily,
            }
        )
        .setOrigin(0.5)
        .setDepth(styles.depths.confirmDialogText)
        .setInteractive({cursor: 'pointer'})

    const btnNo = scene.add
        .text(
            x + styles.confirmDialog.buttonSpacing,
            y + styles.confirmDialog.buttonOffsetY,
            'No',
            {
                fontSize: styles.typography.questSize,
                color: styles.colors.questText,
                fontFamily: styles.typography.fontFamily,
            }
        )
        .setOrigin(0.5)
        .setDepth(styles.depths.confirmDialogText)
        .setInteractive({cursor: 'pointer'})

    const updateVisual = () => {
        if (selectionIndex === 0) {
            btnYes
                .setColor(styles.colors.tickMark)
                .setScale(styles.confirmDialog.selectedScale)
            btnNo
                .setColor(styles.colors.questText)
                .setScale(styles.confirmDialog.normalScale)
        } else {
            btnNo
                .setColor(styles.colors.tickMark)
                .setScale(styles.confirmDialog.selectedScale)
            btnYes
                .setColor(styles.colors.questText)
                .setScale(styles.confirmDialog.normalScale)
        }
    }

    const close = () => {
        if (onKeyDown) {
            document.removeEventListener('keydown', onKeyDown)
            onKeyDown = null
        }
        scene.data.set('__dialogActive__', false)
        bg.destroy()
        txt.destroy()
        btnYes.destroy()
        btnNo.destroy()
    }

    const confirm = () => {
        close()
        onConfirm()
    }

    const cancel = () => {
        close()
        onCancel()
    }

    btnYes.on('pointerdown', confirm)
    btnNo.on('pointerdown', cancel)

    onKeyDown = (e: KeyboardEvent) => {
        if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
            e.preventDefault()
            selectionIndex = (selectionIndex + 1) % 2
            updateVisual()
        } else if (['Enter', 'e'].includes(e.key)) {
            e.preventDefault()
            selectionIndex === 0 ? confirm() : cancel()
        } else if (['Escape', 'q'].includes(e.key)) {
            e.preventDefault()
            cancel()
        }
    }

    scene.data.set('__dialogActive__', true)
    document.addEventListener('keydown', onKeyDown)
    updateVisual()

    return {close}
}
