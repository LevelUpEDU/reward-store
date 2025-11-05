import {interactionRegistry} from './interactionRegistry'

interactionRegistry.register('keypad', async (scene, _data?) => {
    scene.interactionHandler.blockMovement()

    // Scale factor - change this number to adjust size (1.0 = original, 2.0 = 2x, etc.)
    const SCALE = 2.0

    const {width: screenWidth, height: screenHeight} = scene.scale
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const elements: Phaser.GameObjects.GameObject[] = []

    // Create white padding background
    const whitePadding = scene.add.rectangle(
        centerX,
        centerY,
        350 * SCALE,
        570 * SCALE,
        0xe8e8e8
    )
    whitePadding.setStrokeStyle(0, 0x000000, 0)
    whitePadding.setScrollFactor(0)
    elements.push(whitePadding)

    // Create gray keypad area
    const keypadArea = scene.add.rectangle(
        centerX,
        centerY,
        330 * SCALE,
        550 * SCALE,
        0x3a4556
    )
    keypadArea.setStrokeStyle(2 * SCALE, 0x1a202c)
    keypadArea.setScrollFactor(0)
    elements.push(keypadArea)

    // Create title
    const title = scene.add.text(
        centerX,
        centerY - 200 * SCALE,
        '📚 Enter Course Code',
        {
            fontSize: `${18 * SCALE}px`,
            color: '#ffd700',
            align: 'center',
            fontStyle: 'bold',
        }
    )
    title.setOrigin(0.5)
    title.setScrollFactor(0)
    elements.push(title)

    // Create display (matching HTML design)
    const displayBg = scene.add.rectangle(
        centerX,
        centerY - 120 * SCALE,
        300 * SCALE,
        60 * SCALE,
        0x3d4a5c
    )
    displayBg.setStrokeStyle(2 * SCALE, 0x2d3748)
    displayBg.setScrollFactor(0)
    elements.push(displayBg)

    const displayText = scene.add.text(
        centerX,
        centerY - 120 * SCALE,
        '---·---',
        {
            fontSize: `${32 * SCALE}px`,
            color: '#ffd700',
            fontFamily: 'Courier New',
            align: 'center',
        }
    )
    displayText.setOrigin(0.5)
    displayText.setScrollFactor(0)
    elements.push(displayText)

    // Create keypad grid (matching HTML layout exactly)
    const keypadKeys: {
        bg: Phaser.GameObjects.Rectangle
        text: Phaser.GameObjects.Text
        num: string
    }[] = []
    const keyPositions = [
        // Row 1
        {x: centerX - 80 * SCALE, y: centerY - 40 * SCALE, num: '1'},
        {x: centerX, y: centerY - 40 * SCALE, num: '2'},
        {x: centerX + 80 * SCALE, y: centerY - 40 * SCALE, num: '3'},
        // Row 2
        {x: centerX - 80 * SCALE, y: centerY + 20 * SCALE, num: '4'},
        {x: centerX, y: centerY + 20 * SCALE, num: '5'},
        {x: centerX + 80 * SCALE, y: centerY + 20 * SCALE, num: '6'},
        // Row 3
        {x: centerX - 80 * SCALE, y: centerY + 80 * SCALE, num: '7'},
        {x: centerX, y: centerY + 80 * SCALE, num: '8'},
        {x: centerX + 80 * SCALE, y: centerY + 80 * SCALE, num: '9'},
        // Row 4
        {x: centerX - 80 * SCALE, y: centerY + 140 * SCALE, num: '✕'},
        {x: centerX, y: centerY + 140 * SCALE, num: '0'},
        {x: centerX + 80 * SCALE, y: centerY + 140 * SCALE, num: '⌫'},
    ]

    keyPositions.forEach((pos) => {
        // Create key background (matching HTML button style)
        const keyBg = scene.add.rectangle(
            pos.x,
            pos.y,
            60 * SCALE,
            50 * SCALE,
            0xffffff
        )
        keyBg.setStrokeStyle(2 * SCALE, 0x94a3b8)
        keyBg.setInteractive()
        keyBg.setScrollFactor(0)
        elements.push(keyBg)

        // Create key text (matching HTML font)
        const keyText = scene.add.text(pos.x, pos.y, pos.num, {
            fontSize: `${18 * SCALE}px`,
            color: '#2d3748',
            align: 'center',
            fontStyle: 'bold',
        })
        keyText.setOrigin(0.5)
        keyText.setScrollFactor(0)
        elements.push(keyText)

        keypadKeys.push({bg: keyBg, text: keyText, num: pos.num})
    })

    // Create action buttons (matching HTML design)
    const enterBtn = scene.add.rectangle(
        centerX - 60 * SCALE,
        centerY + 200 * SCALE,
        100 * SCALE,
        40 * SCALE,
        0x10b981
    )
    enterBtn.setStrokeStyle(2 * SCALE, 0x065f46)
    enterBtn.setInteractive()
    enterBtn.setScrollFactor(0)
    elements.push(enterBtn)

    const enterText = scene.add.text(
        centerX - 60 * SCALE,
        centerY + 200 * SCALE,
        '✓ Enter',
        {
            fontSize: `${16 * SCALE}px`,
            color: '#ffffff',
            align: 'center',
            fontStyle: 'bold',
        }
    )
    enterText.setOrigin(0.5)
    enterText.setScrollFactor(0)
    elements.push(enterText)

    // Create close button
    const closeBtn = scene.add.rectangle(
        centerX + 60 * SCALE,
        centerY + 200 * SCALE,
        100 * SCALE,
        40 * SCALE,
        0xef4444
    )
    closeBtn.setStrokeStyle(2 * SCALE, 0x7f1d1d)
    closeBtn.setInteractive()
    closeBtn.setScrollFactor(0)
    elements.push(closeBtn)

    const closeText = scene.add.text(
        centerX + 60 * SCALE,
        centerY + 200 * SCALE,
        '✕ Close',
        {
            fontSize: `${16 * SCALE}px`,
            color: '#ffffff',
            align: 'center',
            fontStyle: 'bold',
        }
    )
    closeText.setOrigin(0.5)
    closeText.setScrollFactor(0)
    elements.push(closeText)

    // Store references for cleanup
    let currentInput = ''

    const updateDisplay = () => {
        if (!currentInput) {
            displayText.setText('---·---')
        } else {
            const padded = currentInput.padEnd(6, '-')
            displayText.setText(padded.slice(0, 3) + '·' + padded.slice(3, 6))
        }
    }

    // Add key functionality
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

    // Keyboard navigation
    let selectedKeyIndex = 4 // Start at key 5 (center)
    let selectedKey = keypadKeys[selectedKeyIndex]

    // Highlight selected key
    const highlightSelectedKey = () => {
        keypadKeys.forEach((keyData, index) => {
            if (index === selectedKeyIndex) {
                keyData.bg.setFillStyle(0xffff00) // Yellow highlight
                keyData.bg.setAlpha(0.8)
            } else {
                keyData.bg.setFillStyle(0xffffff) // White background
                keyData.bg.setAlpha(1)
            }
        })
    }

    // Initialize highlight
    highlightSelectedKey()

    // Keyboard input handler
    const handleKeyboardInput = (event: KeyboardEvent) => {
        console.log('Key pressed:', event.key) // Debug log
        const key = event.key.toLowerCase()

        // Prevent default behavior for our keys
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

        // Navigation
        if (key === 'w' || event.key === 'ArrowUp') {
            if (selectedKeyIndex >= 3) {
                selectedKeyIndex -= 3
                highlightSelectedKey()
                console.log('Moved up to index:', selectedKeyIndex)
            }
        } else if (key === 's' || event.key === 'ArrowDown') {
            if (selectedKeyIndex <= 8) {
                selectedKeyIndex += 3
                highlightSelectedKey()
                console.log('Moved down to index:', selectedKeyIndex)
            }
        } else if (key === 'a' || event.key === 'ArrowLeft') {
            if (selectedKeyIndex > 0) {
                selectedKeyIndex -= 1
                highlightSelectedKey()
                console.log('Moved left to index:', selectedKeyIndex)
            }
        } else if (key === 'd' || event.key === 'ArrowRight') {
            if (selectedKeyIndex < 11) {
                selectedKeyIndex += 1
                highlightSelectedKey()
                console.log('Moved right to index:', selectedKeyIndex)
            }
        }
        // Selection
        else if (key === ' ' || key === 'e') {
            selectedKey = keypadKeys[selectedKeyIndex]
            console.log('Selected key:', selectedKey?.num)
            if (selectedKey) {
                if (selectedKey.num === '✕') {
                    currentInput = ''
                    updateDisplay()
                } else if (selectedKey.num === '⌫') {
                    currentInput = currentInput.slice(0, -1)
                    updateDisplay()
                } else if (selectedKey.num >= '0' && selectedKey.num <= '9') {
                    if (currentInput.length < 6) {
                        currentInput += selectedKey.num
                        updateDisplay()
                    }
                }
            }
        }
        // Direct number input
        else if (key >= '0' && key <= '9') {
            console.log(
                'Number key pressed:',
                key,
                'Current input:',
                currentInput
            )
            if (currentInput.length < 6) {
                currentInput += key
                updateDisplay()
                console.log('Updated input:', currentInput)
            } else {
                console.log('Input full, ignoring key')
            }
        }
        // Backspace/Delete
        else if (event.key === 'Backspace' || event.key === 'Delete') {
            currentInput = currentInput.slice(0, -1)
            updateDisplay()
        }
        // Clear
        else if (event.key === 'Escape' || key === 'c') {
            currentInput = ''
            updateDisplay()
        }
        // Submit
        else if (event.key === 'Enter') {
            handleEnterPress()
        }
    }

    // Add keyboard listener
    document.addEventListener('keydown', handleKeyboardInput)

    // Enter button functionality
    const handleEnterPress = () => {
        if (currentInput.length === 6) {
            // Show success message
            const successPopup = scene.add.container(centerX, centerY)
            successPopup.setScrollFactor(0)

            const successBg = scene.add.rectangle(0, 0, 400, 200, 0x000000, 0.9)
            successPopup.add(successBg)

            const successText = scene.add.text(
                0,
                0,
                `Course Code: ${currentInput}\nValid!`,
                {
                    fontSize: '24px',
                    color: '#10b981',
                    align: 'center',
                }
            )
            successText.setOrigin(0.5)
            successPopup.add(successText)

            // Auto close after 2 seconds
            scene.time.delayedCall(2000, () => successPopup.destroy())
        } else {
            // Show error message
            const errorPopup = scene.add.container(centerX, centerY)
            errorPopup.setScrollFactor(0)

            const errorBg = scene.add.rectangle(0, 0, 350, 150, 0x000000, 0.9)
            errorPopup.add(errorBg)

            const errorText = scene.add.text(
                0,
                0,
                'Please enter all 6 digits',
                {
                    fontSize: '20px',
                    color: '#ef4444',
                    align: 'center',
                }
            )
            errorText.setOrigin(0.5)
            errorPopup.add(errorText)

            // Auto close after 2 seconds
            scene.time.delayedCall(2000, () => errorPopup.destroy())
        }
    }

    // Close button functionality
    const handleClosePress = () => {
        cleanup()
    }

    enterBtn.on('pointerdown', handleEnterPress)
    enterText.on('pointerdown', handleEnterPress)
    closeBtn.on('pointerdown', handleClosePress)
    closeText.on('pointerdown', handleClosePress)

    // Cleanup function (copied from chalkboard)
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
        // Remove keyboard listener
        document.removeEventListener('keydown', handleKeyboardInput)
        scene.interactionHandler.unblockMovement()
    }

    // Add escape key to close
    const escKey = scene.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.ESC
    )
    escKey.on('down', cleanup)
})
