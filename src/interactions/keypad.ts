import {interactionRegistry} from './interactionRegistry'
import {UI_COLORS, UI_DEPTH, UI_TEXT_STYLES} from '@/ui/uiStyles'
import {UI_POSITIONS} from '@/ui/uiPositions'

interactionRegistry.register('keypad', async (worldScene, _data?) => {
    const uiScene = worldScene.scene.get('UIScene')
    const scene = uiScene as any

    scene.interactionHandler.blockMovement()

    const {width: screenWidth, height: screenHeight} = scene.scale
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const keypadPos = UI_POSITIONS.keypad
    const scale = keypadPos.scale

    const elements: Phaser.GameObjects.GameObject[] = []

    const whitePadding = scene.add.rectangle(
        centerX,
        centerY,
        keypadPos.padding.width * scale,
        keypadPos.padding.height * scale,
        UI_COLORS.keypadPadding
    )
    whitePadding.setStrokeStyle(0, 0x000000, 0)
    whitePadding.setScrollFactor(0)
    elements.push(whitePadding)

    const keypadArea = scene.add.rectangle(
        centerX,
        centerY,
        keypadPos.area.width * scale,
        keypadPos.area.height * scale,
        UI_COLORS.keypadBg
    )
    keypadArea.setStrokeStyle(2 * scale, UI_COLORS.keypadBorder)
    keypadArea.setScrollFactor(0)
    elements.push(keypadArea)

    const title = scene.add.text(
        centerX,
        centerY + keypadPos.title.offsetY * scale,
        '📚 Enter Course Code',
        scaleTextStyle(UI_TEXT_STYLES.keypadTitle, scale)
    )
    title.setOrigin(0.5)
    title.setScrollFactor(0)
    elements.push(title)

    const displayBg = scene.add.rectangle(
        centerX,
        centerY + keypadPos.display.offsetY * scale,
        keypadPos.display.width * scale,
        keypadPos.display.height * scale,
        UI_COLORS.keypadDisplay
    )
    displayBg.setStrokeStyle(2 * scale, UI_COLORS.keypadDisplayBorder)
    displayBg.setScrollFactor(0)
    elements.push(displayBg)

    const displayText = scene.add.text(
        centerX,
        centerY + keypadPos.display.offsetY * scale,
        '---·---',
        scaleTextStyle(UI_TEXT_STYLES.keypadDisplay, scale)
    )
    displayText.setOrigin(0.5)
    displayText.setScrollFactor(0)
    elements.push(displayText)

    let currentInput = ''

    const updateDisplay = () => {
        if (!currentInput) {
            displayText.setText('---·---')
        } else {
            const padded = currentInput.padEnd(6, '-')
            displayText.setText(padded.slice(0, 3) + '·' + padded.slice(3, 6))
        }
    }

    const keypadKeys: {
        bg: Phaser.GameObjects.Rectangle
        text: Phaser.GameObjects.Text
        num: string
    }[] = []

    const keysConfig = keypadPos.keys
    keysConfig.grid.forEach((row, rowIndex) => {
        row.forEach((num, colIndex) => {
            const x = centerX + (colIndex - 1) * keysConfig.spacingX * scale
            const y =
                centerY +
                (keysConfig.startOffsetY + rowIndex * keysConfig.spacingY) *
                    scale

            const keyBg = scene.add.rectangle(
                x,
                y,
                keysConfig.width * scale,
                keysConfig.height * scale,
                UI_COLORS.keypadKey
            )
            keyBg.setStrokeStyle(2 * scale, UI_COLORS.keypadKeyBorder)
            keyBg.setInteractive()
            keyBg.setScrollFactor(0)
            elements.push(keyBg)

            const keyText = scene.add.text(
                x,
                y,
                num,
                scaleTextStyle(UI_TEXT_STYLES.keypadKey, scale)
            )
            keyText.setOrigin(0.5)
            keyText.setScrollFactor(0)
            elements.push(keyText)

            keypadKeys.push({bg: keyBg, text: keyText, num})
        })
    })

    const actionConfig = keypadPos.actionButtons
    const enterBtn = scene.add.rectangle(
        centerX - (actionConfig.spacing / 2) * scale,
        centerY + actionConfig.offsetY * scale,
        actionConfig.width * scale,
        actionConfig.height * scale,
        UI_COLORS.keypadEnter
    )
    enterBtn.setStrokeStyle(2 * scale, UI_COLORS.keypadEnterBorder)
    enterBtn.setInteractive()
    enterBtn.setScrollFactor(0)
    elements.push(enterBtn)

    const enterText = scene.add.text(
        centerX - (actionConfig.spacing / 2) * scale,
        centerY + actionConfig.offsetY * scale,
        '✓ Enter',
        scaleTextStyle(UI_TEXT_STYLES.keypadButton, scale)
    )
    enterText.setOrigin(0.5)
    enterText.setScrollFactor(0)
    elements.push(enterText)

    const closeBtn = scene.add.rectangle(
        centerX + (actionConfig.spacing / 2) * scale,
        centerY + actionConfig.offsetY * scale,
        actionConfig.width * scale,
        actionConfig.height * scale,
        UI_COLORS.keypadClose
    )
    closeBtn.setStrokeStyle(2 * scale, UI_COLORS.keypadCloseBorder)
    closeBtn.setInteractive()
    closeBtn.setScrollFactor(0)
    elements.push(closeBtn)

    const closeText = scene.add.text(
        centerX + (actionConfig.spacing / 2) * scale,
        centerY + actionConfig.offsetY * scale,
        '✕ Close',
        scaleTextStyle(UI_TEXT_STYLES.keypadButton, scale)
    )
    closeText.setOrigin(0.5)
    closeText.setScrollFactor(0)
    elements.push(closeText)

    elements.forEach((el) => {
        ;(el as Phaser.GameObjects.Image).setDepth(UI_DEPTH.keypad)
    })

    keypadKeys.forEach((keyData) => {
        const handleKeyPress = () => {
            if (keyData.num === '✕') {
                currentInput = ''
                updateDisplay()
            } else if (keyData.num === '⌫') {
                currentInput = currentInput.slice(0, -1)
                updateDisplay()
            } else if (keyData.num >= '0' && keyData.num <= '9') {
                if (currentInput.length < 6) {
                    currentInput += keyData.num
                    updateDisplay()
                }
            }
        }

        keyData.bg.on('pointerdown', handleKeyPress)
        keyData.text.on('pointerdown', handleKeyPress)
    })

    const handleKeyboardInput = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase()

        if (
            ['w', 'a', 's', 'd', ' ', 'e', 'c'].includes(key) ||
            [
                'ArrowUp',
                'ArrowDown',
                'ArrowLeft',
                'ArrowRight',
                'Enter',
                'Backspace',
                'Delete',
                'Escape',
            ].includes(event.key)
        ) {
            event.preventDefault()
        }

        if (event.key === 'Escape') {
            handleClosePress()
        } else if (key >= '0' && key <= '9') {
            if (currentInput.length < 6) {
                currentInput += key
                updateDisplay()
            }
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
            currentInput = currentInput.slice(0, -1)
            updateDisplay()
        } else if (event.key === 'c') {
            currentInput = ''
            updateDisplay()
        } else if (event.key === 'Enter') {
            handleEnterPress()
        }
    }

    document.addEventListener('keydown', handleKeyboardInput)

    const createPopup = (
        message: string,
        color: string,
        size: 'small' | 'large' = 'small'
    ) => {
        const popupConfig = UI_POSITIONS.keypad.popup
        const isLarge = size === 'large'
        const dimensions = isLarge ? popupConfig.large : popupConfig.small
        const textOffsetY =
            isLarge ? popupConfig.largeTextOffsetY : popupConfig.textOffsetY
        const buttonOffsetY =
            isLarge ? popupConfig.largeButtonOffsetY : popupConfig.buttonOffsetY

        const popup = scene.add.container(centerX, centerY)
        popup.setScrollFactor(0)
        popup.setDepth(UI_DEPTH.keypadPopup)

        const bg = scene.add.rectangle(
            0,
            0,
            dimensions.width,
            dimensions.height,
            UI_COLORS.popupBg,
            UI_COLORS.popupBgAlpha
        )
        popup.add(bg)

        const text = scene.add.text(
            0,
            textOffsetY,
            message,
            UI_TEXT_STYLES.popupText(color)
        )
        text.setOrigin(0.5)
        popup.add(text)

        const closeBtnBg = scene.add.rectangle(
            0,
            buttonOffsetY,
            popupConfig.buttonWidth,
            popupConfig.buttonHeight,
            UI_COLORS.keypadClose
        )
        closeBtnBg.setStrokeStyle(2, UI_COLORS.keypadCloseBorder)
        closeBtnBg.setInteractive()
        closeBtnBg.setScrollFactor(0)
        popup.add(closeBtnBg)

        const closeBtnText = scene.add.text(
            0,
            buttonOffsetY,
            'Close',
            UI_TEXT_STYLES.popupButton
        )
        closeBtnText.setOrigin(0.5)
        closeBtnText.setScrollFactor(0)
        popup.add(closeBtnText)

        closeBtnBg.on('pointerdown', () => popup.destroy())
        closeBtnText.on('pointerdown', () => popup.destroy())

        return popup
    }

    const createLoadingPopup = (message: string) => {
        const popupConfig = UI_POSITIONS.keypad.popup

        const popup = scene.add.container(centerX, centerY)
        popup.setScrollFactor(0)
        popup.setDepth(UI_DEPTH.keypadPopup)

        const bg = scene.add.rectangle(
            0,
            0,
            popupConfig.small.width,
            popupConfig.small.height,
            UI_COLORS.popupBg,
            UI_COLORS.popupBgAlpha
        )
        popup.add(bg)

        const text = scene.add.text(
            0,
            0,
            message,
            UI_TEXT_STYLES.popupText(UI_COLORS.gold)
        )
        text.setOrigin(0.5)
        popup.add(text)

        return popup
    }

    const handleEnterPress = async () => {
        if (currentInput.length !== 6) {
            createPopup('Please enter all 6 digits', UI_COLORS.error)
            return
        }

        const loadingPopup = createLoadingPopup('Verifying course code...')

        try {
            const response = await fetch(
                `/api/courses/verify?code=${currentInput}`
            )
            const data = await response.json()

            loadingPopup.destroy()

            if (response.ok && data.courseCode) {
                try {
                    const registerResponse = await fetch(
                        '/api/student/register-course',
                        {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({courseId: data.id}),
                        }
                    )

                    const registerData = await registerResponse.json()

                    let successMessage = `✓ Course Found!\n\n${data.title}\nInstructor: ${data.instructorName}\nCode: ${data.courseCode}`

                    if (registerResponse.ok) {
                        successMessage += '\n\n✅ Successfully registered!'
                    } else if (registerResponse.status === 409) {
                        successMessage +=
                            '\n\n⚠️ Already registered for this course'
                    } else {
                        successMessage += `\n\n⚠️ Registration failed: ${registerData.error || 'Unknown error'}`
                    }

                    createPopup(successMessage, UI_COLORS.success, 'large')
                } catch (_registerError) {
                    createPopup(
                        'Course found but registration failed\nPlease try again',
                        UI_COLORS.error
                    )
                }
            } else {
                createPopup(
                    '✕ Invalid Course Code\nPlease try again',
                    UI_COLORS.error
                )
            }
        } catch (_error) {
            loadingPopup.destroy()
            createPopup(
                'Error verifying course\nPlease try again',
                UI_COLORS.error
            )
        }
    }

    const handleClosePress = () => {
        cleanup()
    }

    enterBtn.on('pointerdown', handleEnterPress)
    enterText.on('pointerdown', handleEnterPress)
    closeBtn.on('pointerdown', handleClosePress)
    closeText.on('pointerdown', handleClosePress)

    let _cleaned = false
    const cleanup = () => {
        if (_cleaned) return
        _cleaned = true
        elements.forEach((el) => {
            try {
                el.destroy()
            } catch {
                /* ignore */
            }
        })
        document.removeEventListener('keydown', handleKeyboardInput)
        scene.interactionHandler.unblockMovement()
    }

    const escKey = scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.ESC
    )
    escKey.on('down', cleanup)
})

function scaleTextStyle(style: object, scale: number): object {
    const scaled = {...style}
    if ('fontSize' in scaled && typeof scaled.fontSize === 'string') {
        const size = parseInt(scaled.fontSize)
        scaled.fontSize = `${size * scale}px`
    }
    return scaled
}
