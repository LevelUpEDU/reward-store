import type {UIScene} from '@/scenes/UIScene'

interface MenuItem {
    label: string
    action: () => void
}

/**
 * Overlay menu for rewards, shop, settings, logout, etc.
 */
export class MenuOverlay {
    private scene: UIScene
    private container: Phaser.GameObjects.Container | null = null
    private menuItems: Phaser.GameObjects.Text[] = []
    private selectedIndex: number = 0
    private isVisible: boolean = false

    // Tilemap background
    private rewardsMap?: Phaser.Tilemaps.Tilemap
    private rewardsLayer?: Phaser.Tilemaps.TilemapLayer | null

    // Sub-screen state
    private subScreenContainer: Phaser.GameObjects.Container | null = null
    private subScreenVisible: boolean = false
    private subScreenMap?: Phaser.Tilemaps.Tilemap
    private subScreenLayer?: Phaser.Tilemaps.TilemapLayer | null

    // Keyboard controls
    private upKey?: Phaser.Input.Keyboard.Key
    private downKey?: Phaser.Input.Keyboard.Key
    private enterKey?: Phaser.Input.Keyboard.Key

    // Menu position config (relative to screen)
    private readonly MENU_POSITIONS = [
        {x: 870, y: 315}, // REWARDS
        {x: 870, y: 425}, // ACHIEVEMENTS
        {x: 870, y: 540}, // BADGES
        {x: 870, y: 650}, // SHOP
        {x: 870, y: 760}, // LOGOUT
    ]

    private readonly MENU_OPTIONS: MenuItem[] = [
        {label: 'REWARDS', action: () => this.openSubScreen('REWARDS')},
        {
            label: 'ACHIEVEMENTS',
            action: () => this.openSubScreen('ACHIEVEMENTS'),
        },
        {label: 'BADGES', action: () => this.openSubScreen('BADGES')},
        {label: 'SHOP', action: () => this.openShop()},
        {label: 'LOGOUT', action: () => this.handleLogout()},
    ] // Menu configuration

    // Styles - using CyberPunk font
    private readonly NORMAL_STYLE = {
        fontFamily: 'CyberPunkFont, Arial',
        fontSize: '36px',
        color: '#ffd700',
        fontStyle: 'bold',
    }

    private readonly SELECTED_STYLE = {
        fontFamily: 'CyberPunkFont, Arial',
        fontSize: '36px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: {left: 12, right: 12, top: 4, bottom: 4},
    }

    constructor(scene: UIScene) {
        this.scene = scene
        this.setupKeyboardControls()
    }

    private setupKeyboardControls(): void {
        this.upKey = this.scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.UP
        )
        this.downKey = this.scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.DOWN
        )
        this.enterKey = this.scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.ENTER
        )

        this.upKey.on('down', () => this.navigateUp())
        this.downKey.on('down', () => this.navigateDown())
        this.enterKey.on('down', () => this.selectCurrent())
    }

    private navigateUp(): void {
        if (!this.isVisible) return
        if (this.subScreenVisible) return // Don't navigate main menu when sub-screen is open

        this.selectedIndex =
            (this.selectedIndex - 1 + this.MENU_OPTIONS.length) %
            this.MENU_OPTIONS.length
        this.updateHighlight()
    }

    private navigateDown(): void {
        if (!this.isVisible) return
        if (this.subScreenVisible) return

        this.selectedIndex = (this.selectedIndex + 1) % this.MENU_OPTIONS.length
        this.updateHighlight()
    }

    private selectCurrent(): void {
        if (!this.isVisible) return
        if (this.subScreenVisible) {
            this.closeSubScreen()
            return
        }

        const option = this.MENU_OPTIONS[this.selectedIndex]
        option.action()
    }

    private updateHighlight(): void {
        this.menuItems.forEach((item, i) => {
            if (i === this.selectedIndex) {
                item.setStyle(this.SELECTED_STYLE)
            } else {
                item.setStyle({
                    ...this.NORMAL_STYLE,
                    backgroundColor: undefined,
                    padding: undefined,
                })
            }
        })
    }

    public show(): void {
        if (this.isVisible) return
        this.isVisible = true
        this.selectedIndex = 0

        // Create container for all menu elements
        this.container = this.scene.add.container(0, 0)
        this.container.setScrollFactor(0)
        this.container.setDepth(1000)

        // Create full-screen background to catch clicks outside menu
        const clickOutside = this.scene.add.rectangle(
            960,
            540,
            1920,
            1080,
            0x000000,
            0.3
        )
        clickOutside.setScrollFactor(0)
        clickOutside.setInteractive()
        clickOutside.setDepth(998)
        clickOutside.on('pointerdown', () => {
            this.scene.uiManager?.closeMenu()
        })
        this.container.add(clickOutside)

        // Create tilemap background
        this.createMenuBackground()

        // Menu items at specific positions
        this.menuItems = []
        this.MENU_OPTIONS.forEach((option, i) => {
            const pos = this.MENU_POSITIONS[i]
            const item = this.scene.add.text(
                pos.x,
                pos.y,
                option.label,
                this.NORMAL_STYLE
            )
            item.setScrollFactor(0)
            item.setInteractive({useHandCursor: true})

            item.on('pointerover', () => {
                this.selectedIndex = i
                this.updateHighlight()
            })
            item.on('pointerdown', () => {
                option.action()
            })

            this.menuItems.push(item)
            this.container!.add(item)
        })

        this.updateHighlight()
    }

    private createMenuBackground(): void {
        if (!this.scene.textures.exists('Interface windows')) {
            // Fallback to simple rectangle if tilemap not loaded
            const bg = this.scene.add.rectangle(
                200,
                400,
                400,
                600,
                0x000000,
                0.85
            )
            bg.setScrollFactor(0)
            this.container!.add(bg)
            return
        }

        this.rewardsMap = this.scene.make.tilemap({key: 'rewardsMap'})
        const tileset = this.rewardsMap.addTilesetImage('Interface windows')

        if (!tileset) {
            console.error('Menu tileset missing')
            return
        }

        this.rewardsLayer = this.rewardsMap.createLayer(
            'base_layer',
            tileset,
            0,
            0
        )
        if (this.rewardsLayer) {
            this.rewardsLayer.setScrollFactor(0)
            this.rewardsLayer.setScale(2.5)
            this.rewardsLayer.setPosition(700, 100)
            this.rewardsLayer.setDepth(999)
        }
    }

    public hide(): void {
        if (!this.isVisible) return
        this.isVisible = false

        this.closeSubScreen()

        // Clean up tilemap
        if (this.rewardsLayer) {
            this.rewardsLayer.destroy()
            this.rewardsLayer = null
        }
        if (this.rewardsMap) {
            this.rewardsMap.destroy()
            this.rewardsMap = undefined
        }

        this.container?.destroy()
        this.container = null
        this.menuItems = []
    }

    private openSubScreen(category: string): void {
        if (this.subScreenVisible) return
        this.subScreenVisible = true

        this.menuItems.forEach((item) => item.setVisible(false))
        if (this.rewardsLayer) {
            this.rewardsLayer.setVisible(false)
        }

        this.subScreenContainer = this.scene.add.container(0, 0)
        this.subScreenContainer.setScrollFactor(0)
        this.subScreenContainer.setDepth(1001)

        // Create tilemap background for sub-screen
        this.createSubScreenBackground()

        // Title
        const titleX = category === 'ACHIEVEMENTS' ? 130 : 200
        const title = this.scene.add.text(titleX, 60, category, {
            fontFamily: 'CyberPunkFont, Arial',
            fontSize: '48px',
            color: '#ffd700',
            fontStyle: 'bold',
        })
        title.setScrollFactor(0)
        this.subScreenContainer.add(title)
        title.setScrollFactor(0)
        this.subScreenContainer.add(title)

        // Content based on category
        const data = this.getDataForCategory(category)
        const startY = 150
        const lineHeight = 60

        data.forEach((item, i) => {
            const text = this.scene.add.text(
                70,
                startY + i * lineHeight,
                `• ${item}`,
                {
                    fontFamily: 'CyberPunkFont, Arial',
                    fontSize: '28px',
                    color: '#ffffff',
                    wordWrap: {width: 400},
                }
            )
            text.setScrollFactor(0)
            this.subScreenContainer!.add(text)
        })
        // Title - check if it's ACHIEVEMENTS and adjust x

        // Back button
        const backBtn = this.scene.add.text(310, 760, 'BACK', {
            fontFamily: 'CyberPunkFont, Arial',
            fontSize: '48px',
            color: '#ffd700',
        })
        backBtn.setOrigin(0.5)
        backBtn.setScrollFactor(0)
        backBtn.setInteractive({useHandCursor: true})
        backBtn.on('pointerdown', () => this.closeSubScreen())
        backBtn.on('pointerover', () => {
            backBtn.setColor('#ffffff')
            backBtn.setStyle({
                backgroundColor: '#ffd70044',
                padding: {left: 12, right: 12, top: 4, bottom: 4},
            })
        })
        backBtn.on('pointerout', () => {
            backBtn.setColor('#ffd700')
            backBtn.setStyle({backgroundColor: undefined, padding: undefined})
        })
        this.subScreenContainer.add(backBtn)
    }

    private createSubScreenBackground(): void {
        if (!this.scene.textures.exists('Interface windows')) {
            const bg = this.scene.add.rectangle(
                250,
                400,
                500,
                700,
                0x222222,
                0.95
            )
            bg.setScrollFactor(0)
            this.subScreenContainer!.add(bg)
            return
        }

        this.subScreenMap = this.scene.make.tilemap({key: 'subScreenMap'})
        const tileset = this.subScreenMap.addTilesetImage('Interface windows')

        if (!tileset) {
            console.error('Sub-screen tileset missing')
            return
        }

        this.subScreenLayer = this.subScreenMap.createLayer(
            'base_layer',
            tileset,
            0,
            0
        )
        if (this.subScreenLayer) {
            this.subScreenLayer.setScrollFactor(0)
            this.subScreenLayer.setScale(2.5)
            this.subScreenLayer.setPosition(0, 20)
            this.subScreenLayer.setDepth(1000)
        }
    }

    private closeSubScreen(): void {
        if (!this.subScreenVisible) return
        this.subScreenVisible = false

        // Clean up tilemap
        if (this.subScreenLayer) {
            this.subScreenLayer.destroy()
            this.subScreenLayer = null
        }
        if (this.subScreenMap) {
            this.subScreenMap.destroy()
            this.subScreenMap = undefined
        }

        this.subScreenContainer?.destroy()
        this.subScreenContainer = null
        this.menuItems.forEach((item) => item.setVisible(true))
        if (this.rewardsLayer) {
            this.rewardsLayer.setVisible(true)
        }
    }

    private getDataForCategory(category: string): string[] {
        // TODO: Replace with actual data fetching
        switch (category) {
            case 'REWARDS':
                return [
                    'Gold Star',
                    'Bonus Points: 500',
                    'Certificate of Excellence',
                ]
            case 'ACHIEVEMENTS':
                return [
                    'Completed Math Level 1',
                    'Solved 50 Puzzles',
                    'Perfect Score in Quiz #3',
                ]
            case 'BADGES':
                return ['Math Master', 'Science Star', 'History Hero']
            case 'SHOP':
                return ['Coming soon...']
            default:
                return ['No data available']
        }
    }

    private handleLogout(): void {
        const returnUrl = window.location.origin

        // Visual feedback
        const logoutText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            'Logging out...',
            {
                fontFamily: 'Arial',
                fontSize: '36px',
                color: '#ff4800',
                backgroundColor: '#000000dd',
                padding: {left: 20, right: 20, top: 10, bottom: 10},
            }
        )
        logoutText.setOrigin(0.5)
        logoutText.setScrollFactor(0)
        logoutText.setDepth(2000)

        this.scene.time.delayedCall(1500, () => {
            window.location.href = `/auth/logout?returnTo=${returnUrl}`
        })
    }

    private openShop(): void {
        // Close menu first, then open shop
        this.scene.uiManager?.closeMenu()
        this.scene.uiManager?.openShop()
    }

    public destroy(): void {
        this.upKey?.off('down')
        this.downKey?.off('down')
        this.enterKey?.off('down')

        this.hide()
    }
}
