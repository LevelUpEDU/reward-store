import type {Scene} from '@/scenes/Scene'

export interface ClassroomOption {
    label: string
    sceneKey?: string
    action?: () => void
    courseId?: number
}

export class ClassroomSelector {
    private scene: Scene
    private visible = false
    private options: ClassroomOption[] = []
    private selectedIndex = 0
    private uiElements: Phaser.GameObjects.GameObject[] = []
    private optionTexts: Phaser.GameObjects.Text[] = []
    private background?: Phaser.GameObjects.Rectangle
    private title?: Phaser.GameObjects.Text
    private keyboardHandler?: (event: KeyboardEvent) => void

    constructor(scene: Scene) {
        this.scene = scene
    }

    public show(options: ClassroomOption[]): void {
        // Clean up any previous state first
        if (this.visible) {
            this.close()
        }

        this.visible = true
        this.options = options
        this.selectedIndex = 0

        // Block player movement
        this.scene.interactionHandler.blockMovement()

        this.createUI()
        this.setupInput()
    }

    private createUI(): void {
        const centerX = 960
        const centerY = 540

        // Ensure arrays are clean
        this.uiElements = []
        this.optionTexts = []

        // Create semi-transparent background overlay
        this.background = this.scene.add.rectangle(
            centerX,
            centerY,
            800,
            400,
            0x000000,
            0.85
        )
        this.background.setDepth(1000)
        this.background.setScrollFactor(0)
        this.uiElements.push(this.background)

        // Create title
        this.title = this.scene.add.text(
            centerX,
            centerY - 160,
            'Select Classroom',
            {
                fontSize: '40px',
                color: '#ffffff',
                fontFamily: 'Arial',
            }
        )
        this.title.setOrigin(0.5)
        this.title.setDepth(1001)
        this.title.setScrollFactor(0)
        this.uiElements.push(this.title)

        // Create option texts
        const baseY = centerY - 60
        const spacing = 60

        this.options.forEach((option, i) => {
            const txt = this.scene.add.text(
                centerX,
                baseY + i * spacing,
                option.label,
                {
                    fontSize: '32px',
                    color: '#ffffff',
                    fontFamily: 'Arial',
                }
            )
            txt.setOrigin(0.5)
            txt.setDepth(1001)
            txt.setScrollFactor(0)
            txt.setInteractive({useHandCursor: true})

            // Mouse hover events
            txt.on('pointerover', () => {
                if (this.visible) {
                    this.selectedIndex = i
                    this.updateSelection()
                }
            })

            // Mouse click event
            txt.on('pointerdown', () => {
                if (this.visible) {
                    this.selectedIndex = i
                    this.updateSelection()
                    this.selectOption()
                }
            })

            this.optionTexts.push(txt)
            this.uiElements.push(txt)
        })

        this.updateSelection()
    }

    private updateSelection(): void {
        // Ensure we only update if we have valid text objects
        if (!this.optionTexts || this.optionTexts.length === 0) return

        this.optionTexts.forEach((txt, i) => {
            if (!txt || !txt.scene) return // Skip if destroyed

            if (i === this.selectedIndex) {
                // Apply selected style - yellow text only
                txt.setColor('#ffff00')
            } else {
                // Reset to default - white text
                txt.setColor('#ffffff')
            }
        })
    }

    private setupInput(): void {
        // Remove any existing handler first to prevent stacking
        if (this.keyboardHandler) {
            this.scene.input.keyboard!.off('keydown', this.keyboardHandler)
        }

        this.keyboardHandler = (event: KeyboardEvent) => {
            if (!this.visible) return

            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.selectedIndex =
                        (this.selectedIndex - 1 + this.options.length) %
                        this.options.length
                    this.updateSelection()
                    event.preventDefault()
                    break

                case 'ArrowDown':
                case 'KeyS':
                    this.selectedIndex =
                        (this.selectedIndex + 1) % this.options.length
                    this.updateSelection()
                    event.preventDefault()
                    break

                case 'Enter':
                case 'KeyE':
                    this.selectOption()
                    event.preventDefault()
                    break

                case 'Escape':
                case 'KeyQ':
                    this.close()
                    event.preventDefault()
                    break
            }
        }

        this.scene.input.keyboard!.on('keydown', this.keyboardHandler)
    }

    private selectOption(): void {
        const selected = this.options[this.selectedIndex]

        this.close()

        if (selected.sceneKey) {
            // Get user email - check if scene has a public method or property
            let userEmail: string | undefined
            const sceneWithEmail = this.scene as any
            if (typeof sceneWithEmail.getUserEmail === 'function') {
                userEmail = sceneWithEmail.getUserEmail()
            }

            // Transition to the scene with course data
            this.scene.scene.start(selected.sceneKey, {
                courseId: selected.courseId,
                userEmail: userEmail,
            })
        } else if (selected.action) {
            // Execute custom action
            selected.action()
        }
    }

    public close(): void {
        this.visible = false

        // Clean up UI elements - remove event listeners first
        this.optionTexts.forEach((txt) => {
            if (txt) {
                txt.removeAllListeners()
                txt.disableInteractive()
            }
        })

        this.uiElements.forEach((element) => {
            if (element) {
                try {
                    element.destroy()
                } catch (e) {
                    // Already destroyed
                }
            }
        })
        this.uiElements = []
        this.optionTexts = []

        // Remove keyboard handler
        if (this.keyboardHandler) {
            this.scene.input.keyboard!.off('keydown', this.keyboardHandler)
            this.keyboardHandler = undefined
        }

        // Unblock player movement only if it was blocked
        if (this.scene.interactionHandler) {
            this.scene.interactionHandler.unblockMovement()
        }
    }

    public isVisible(): boolean {
        return this.visible
    }
}
