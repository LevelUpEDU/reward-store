export type InputMode = 'navigation' | 'dialog' | 'numericInput' | 'inactive'

export interface InputHandlers {
    onNavigateUp?: () => void
    onNavigateDown?: () => void
    onNavigateLeft?: () => void
    onNavigateRight?: () => void
    onSelect?: () => void
    onClose?: () => void
    onNumericInput?: (digit: string) => void
    onBackspace?: () => void
    onClear?: () => void
}

export interface InteractionInputConfig {
    scene: Phaser.Scene
    initialMode?: InputMode
    handlers: InputHandlers
}

export interface InteractionInputControls {
    setMode: (mode: InputMode) => void
    getMode: () => InputMode
    setHandlers: (handlers: Partial<InputHandlers>) => void
    cleanup: () => void
}

export function createInteractionInput(
    config: InteractionInputConfig
): InteractionInputControls {
    const {scene, initialMode = 'navigation'} = config

    let mode: InputMode = initialMode
    let handlers: InputHandlers = {...config.handlers}
    let cleaned = false

    const handleUp = () => {
        if (mode === 'inactive' || cleaned) return
        if (mode === 'navigation' || mode === 'dialog') {
            handlers.onNavigateUp?.()
        }
    }

    const handleDown = () => {
        if (mode === 'inactive' || cleaned) return
        if (mode === 'navigation' || mode === 'dialog') {
            handlers.onNavigateDown?.()
        }
    }

    const handleLeft = () => {
        if (mode === 'inactive' || cleaned) return
        if (mode === 'navigation' || mode === 'dialog') {
            handlers.onNavigateLeft?.()
        }
    }

    const handleRight = () => {
        if (mode === 'inactive' || cleaned) return
        if (mode === 'navigation' || mode === 'dialog') {
            handlers.onNavigateRight?.()
        }
    }

    const handleSelect = () => {
        if (mode === 'inactive' || cleaned) return
        if (
            mode === 'navigation' ||
            mode === 'dialog' ||
            mode === 'numericInput'
        ) {
            handlers.onSelect?.()
        }
    }

    const handleClose = () => {
        if (mode === 'inactive' || cleaned) return
        handlers.onClose?.()
    }

    const handleBackspace = () => {
        if (mode === 'inactive' || cleaned) return
        if (mode === 'numericInput') {
            handlers.onBackspace?.()
        }
    }

    const handleClear = () => {
        if (mode === 'inactive' || cleaned) return
        if (mode === 'numericInput') {
            handlers.onClear?.()
        }
    }

    const handleNumeric = (digit: string) => {
        if (mode === 'inactive' || cleaned) return
        if (mode === 'numericInput') {
            handlers.onNumericInput?.(digit)
        }
    }

    // Event handler references for cleanup
    const onUp = () => handleUp()
    const onDown = () => handleDown()
    const onLeft = () => handleLeft()
    const onRight = () => handleRight()
    const onEnter = () => handleSelect()
    const onEsc = () => handleClose()
    const onBackspace = () => handleBackspace()
    const onC = () => handleClear()
    const onZero = () => handleNumeric('0')
    const onOne = () => handleNumeric('1')
    const onTwo = () => handleNumeric('2')
    const onThree = () => handleNumeric('3')
    const onFour = () => handleNumeric('4')
    const onFive = () => handleNumeric('5')
    const onSix = () => handleNumeric('6')
    const onSeven = () => handleNumeric('7')
    const onEight = () => handleNumeric('8')
    const onNine = () => handleNumeric('9')

    const keyboard = scene.input.keyboard!

    // Bind all events
    keyboard.on('keydown-UP', onUp)
    keyboard.on('keydown-W', onUp)
    keyboard.on('keydown-DOWN', onDown)
    keyboard.on('keydown-S', onDown)
    keyboard.on('keydown-LEFT', onLeft)
    keyboard.on('keydown-A', onLeft)
    keyboard.on('keydown-RIGHT', onRight)
    keyboard.on('keydown-D', onRight)
    keyboard.on('keydown-ENTER', onEnter)
    keyboard.on('keydown-E', onEnter)
    keyboard.on('keydown-ESC', onEsc)
    keyboard.on('keydown-Q', onEsc)
    keyboard.on('keydown-BACKSPACE', onBackspace)
    keyboard.on('keydown-DELETE', onBackspace)
    keyboard.on('keydown-C', onC)
    keyboard.on('keydown-ZERO', onZero)
    keyboard.on('keydown-ONE', onOne)
    keyboard.on('keydown-TWO', onTwo)
    keyboard.on('keydown-THREE', onThree)
    keyboard.on('keydown-FOUR', onFour)
    keyboard.on('keydown-FIVE', onFive)
    keyboard.on('keydown-SIX', onSix)
    keyboard.on('keydown-SEVEN', onSeven)
    keyboard.on('keydown-EIGHT', onEight)
    keyboard.on('keydown-NINE', onNine)

    const cleanup = () => {
        if (cleaned) return
        cleaned = true

        keyboard.off('keydown-UP', onUp)
        keyboard.off('keydown-W', onUp)
        keyboard.off('keydown-DOWN', onDown)
        keyboard.off('keydown-S', onDown)
        keyboard.off('keydown-LEFT', onLeft)
        keyboard.off('keydown-A', onLeft)
        keyboard.off('keydown-RIGHT', onRight)
        keyboard.off('keydown-D', onRight)
        keyboard.off('keydown-ENTER', onEnter)
        keyboard.off('keydown-E', onEnter)
        keyboard.off('keydown-ESC', onEsc)
        keyboard.off('keydown-Q', onEsc)
        keyboard.off('keydown-BACKSPACE', onBackspace)
        keyboard.off('keydown-DELETE', onBackspace)
        keyboard.off('keydown-C', onC)
        keyboard.off('keydown-ZERO', onZero)
        keyboard.off('keydown-ONE', onOne)
        keyboard.off('keydown-TWO', onTwo)
        keyboard.off('keydown-THREE', onThree)
        keyboard.off('keydown-FOUR', onFour)
        keyboard.off('keydown-FIVE', onFive)
        keyboard.off('keydown-SIX', onSix)
        keyboard.off('keydown-SEVEN', onSeven)
        keyboard.off('keydown-EIGHT', onEight)
        keyboard.off('keydown-NINE', onNine)
    }

    return {
        setMode: (newMode: InputMode) => {
            mode = newMode
        },
        getMode: () => mode,
        setHandlers: (newHandlers: Partial<InputHandlers>) => {
            handlers = {...handlers, ...newHandlers}
        },
        cleanup,
    }
}
