import type {UIScene} from '@/scenes/UIScene'
import {
    UI_COLORS,
    UI_DEPTH,
    UI_TEXT_STYLES,
    createHoverHandlers,
    clearTextStyle,
} from '../styles/uiStyles'
import {UI_POSITIONS} from '../styles/uiPositions'

interface MenuItem {
    label: string
    action: () => void
}

export class MenuOverlay {
    private scene: UIScene
    private container: Phaser.GameObjects.Container | null = null
    private dimOverlay: Phaser.GameObjects.Rectangle | null = null
    private menuItems: Phaser.GameObjects.Text[] = []
    private isVisible: boolean = false
    private selectedIndex: number = 0

    private menuBg: Phaser.GameObjects.Image | null = null
    private subScreenBg: Phaser.GameObjects.Image | null = null

    private subScreenContainer: Phaser.GameObjects.Container | null = null
    private subScreenVisible: boolean = false

    private readonly MENU_OPTIONS: MenuItem[] = [
        {label: 'REWARDS', action: () => this.openSubScreen('REWARDS')},
        {
            label: 'ACHIEVEMENTS',
            action: () => this.openSubScreen('ACHIEVEMENTS'),
        },
        {label: 'BADGES', action: () => this.openSubScreen('BADGES')},
        {label: 'SHOP', action: () => this.openShop()},
        {label: 'LOGOUT', action: () => this.handleLogout()},
    ]

    constructor(scene: UIScene) {
        this.scene = scene
    }

    public navigateUp(): void {
        if (!this.isVisible || this.subScreenVisible) return

        this.selectedIndex =
            (this.selectedIndex - 1 + this.MENU_OPTIONS.length) %
            this.MENU_OPTIONS.length
        this.updateHighlight()
    }

    public navigateDown(): void {
        if (!this.isVisible || this.subScreenVisible) return

        this.selectedIndex = (this.selectedIndex + 1) % this.MENU_OPTIONS.length
        this.updateHighlight()
    }

    public selectCurrent(): void {
        if (!this.isVisible) return
        if (this.subScreenVisible) return

        this.MENU_OPTIONS[this.selectedIndex].action()
    }

    public isSubScreenOpen(): boolean {
        return this.subScreenVisible
    }

    public closeSubScreen(): void {
        if (!this.subScreenVisible) return
        this.subScreenVisible = false

        this.subScreenBg?.destroy()
        this.subScreenBg = null

        this.subScreenContainer?.destroy()
        this.subScreenContainer = null

        this.menuItems.forEach((item) => item.setVisible(true))
        if (this.menuBg) {
            this.menuBg.setVisible(true)
        }
    }

    private updateHighlight(): void {
        this.menuItems.forEach((item, i) => {
            if (i === this.selectedIndex) {
                item.setStyle(UI_TEXT_STYLES.menuItemSelected)
            } else {
                clearTextStyle(item, UI_TEXT_STYLES.menuItem)
            }
        })
    }

    public show(): void {
        if (this.isVisible) return
        this.isVisible = true
        this.selectedIndex = 0

        this.createDimOverlay()

        this.container = this.scene.add.container(0, 0)
        this.container.setScrollFactor(0)
        this.container.setDepth(UI_DEPTH.menuContent)

        this.createMenuBackground()

        this.menuItems = []
        this.MENU_OPTIONS.forEach((option, i) => {
            const pos = UI_POSITIONS.menu.items[i]
            const item = this.scene.add.text(
                pos.x,
                pos.y,
                option.label,
                UI_TEXT_STYLES.menuItem
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

    private createDimOverlay(): void {
        const dim = UI_POSITIONS.dimOverlay
        this.dimOverlay = this.scene.add.rectangle(
            dim.x,
            dim.y,
            dim.width,
            dim.height,
            UI_COLORS.dimOverlay,
            UI_COLORS.dimOverlayAlpha
        )
        this.dimOverlay.setScrollFactor(0)
        this.dimOverlay.setInteractive()
        this.dimOverlay.setDepth(UI_DEPTH.dimOverlay)
        this.dimOverlay.on('pointerdown', () => {
            this.scene.uiManager?.closeMenu()
        })
    }

    private createMenuBackground(): void {
        const bg = UI_POSITIONS.menu.background

        this.menuBg = this.scene.add.image(bg.x, bg.y, 'mainMenu')
        this.menuBg.setOrigin(0, 0)
        this.menuBg.setScale(bg.scale)
        this.menuBg.setScrollFactor(0)
        this.menuBg.setDepth(UI_DEPTH.menuBackground)
    }

    public hide(): void {
        if (!this.isVisible) return
        this.isVisible = false

        this.closeSubScreen()

        // CLEANUP: Destroy Main Menu BG
        this.menuBg?.destroy()
        this.menuBg = null

        this.dimOverlay?.destroy()
        this.dimOverlay = null

        this.container?.destroy()
        this.container = null
        this.menuItems = []
    }

    private openSubScreen(category: string): void {
        if (this.subScreenVisible) return
        this.subScreenVisible = true

        this.menuItems.forEach((item) => item.setVisible(false))
        if (this.menuBg) {
            this.menuBg.setVisible(false)
        }

        const sub = UI_POSITIONS.subScreen
        this.subScreenContainer = this.scene.add.container(
            sub.container.x,
            sub.container.y
        )
        this.subScreenContainer.setScrollFactor(0)
        this.subScreenContainer.setDepth(UI_DEPTH.subScreenContent)

        this.createSubScreenBackground()

        const titlePos =
            category === 'ACHIEVEMENTS' ?
                sub.title.achievements
            :   sub.title.default
        const title = this.scene.add.text(
            titlePos.x,
            titlePos.y,
            category,
            UI_TEXT_STYLES.title
        )
        title.setScrollFactor(0)
        this.subScreenContainer.add(title)

        const data = this.getDataForCategory(category)
        const content = sub.content

        data.forEach((item, i) => {
            const text = this.scene.add.text(
                content.startX,
                content.startY + i * content.lineHeight,
                `• ${item}`,
                UI_TEXT_STYLES.bodyWithWrap(content.wrapWidth)
            )
            text.setScrollFactor(0)
            this.subScreenContainer!.add(text)
        })

        const backBtn = this.scene.add.text(
            sub.backButton.x,
            sub.backButton.y,
            'BACK',
            UI_TEXT_STYLES.backButton
        )
        backBtn.setOrigin(0.5)
        backBtn.setScrollFactor(0)
        backBtn.setInteractive({useHandCursor: true})
        backBtn.on('pointerdown', () => this.closeSubScreen())
        createHoverHandlers(
            backBtn,
            UI_COLORS.gold,
            UI_COLORS.white,
            UI_COLORS.hoverBgGold
        )
        this.subScreenContainer.add(backBtn)
    }

    // REFACTORED: Use Image instead of Tilemap
    private createSubScreenBackground(): void {
        const bg = UI_POSITIONS.subScreen.background

        // Uses 'infoWindow' which is the square box image
        this.subScreenBg = this.scene.add.image(bg.x, bg.y, 'infoWindow')
        this.subScreenBg.setOrigin(0, 0)
        this.subScreenBg.setScale(bg.scale)
        this.subScreenBg.setScrollFactor(0)
        this.subScreenBg.setDepth(UI_DEPTH.subScreenBackground)
    }

    private getDataForCategory(category: string): string[] {
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
        const feedback = UI_POSITIONS.feedback

        const logoutText = this.scene.add.text(
            feedback.x,
            feedback.y,
            'Logging out...',
            UI_TEXT_STYLES.logoutFeedback
        )
        logoutText.setOrigin(0.5)
        logoutText.setScrollFactor(0)
        logoutText.setDepth(UI_DEPTH.feedback)

        this.scene.time.delayedCall(1500, () => {
            window.location.href = `/auth/logout?returnTo=${returnUrl}`
        })
    }

    private openShop(): void {
        this.scene.uiManager?.closeMenu()
        this.scene.uiManager?.openShop()
    }

    public destroy(): void {
        this.hide()
    }
}
