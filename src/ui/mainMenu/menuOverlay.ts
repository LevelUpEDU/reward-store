import type {UIScene} from '@/scenes/UIScene'
import {
    UI_COLORS,
    UI_DEPTH,
    UI_TEXT_STYLES,
    createHoverHandlers,
    clearTextStyle,
} from '../uiStyles'
import {UI_POSITIONS} from '../uiPositions'
import {createMenuNavigation, MenuNavigationControls} from '../menuNavigation'

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
    private dimOverlay: Phaser.GameObjects.Rectangle | null = null
    private menuItems: Phaser.GameObjects.Text[] = []
    private isVisible: boolean = false

    // Tilemap background
    private rewardsMap?: Phaser.Tilemaps.Tilemap
    private rewardsLayer?: Phaser.Tilemaps.TilemapLayer | null

    // Sub-screen state
    private subScreenContainer: Phaser.GameObjects.Container | null = null
    private subScreenVisible: boolean = false
    private subScreenMap?: Phaser.Tilemaps.Tilemap
    private subScreenLayer?: Phaser.Tilemaps.TilemapLayer | null

    // Navigation
    private navigation: MenuNavigationControls | null = null

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

    private updateHighlight(): void {
        const selectedIndex = this.navigation?.getSelectedIndex() ?? 0
        this.menuItems.forEach((item, i) => {
            if (i === selectedIndex) {
                item.setStyle(UI_TEXT_STYLES.menuItemSelected)
            } else {
                clearTextStyle(item, UI_TEXT_STYLES.menuItem)
            }
        })
    }

    public show(): void {
        if (this.isVisible) return
        this.isVisible = true

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
                this.navigation?.setSelectedIndex(i)
            })
            item.on('pointerdown', () => {
                option.action()
            })

            this.menuItems.push(item)
            this.container!.add(item)
        })

        this.navigation = createMenuNavigation({
            scene: this.scene,
            itemCount: this.MENU_OPTIONS.length,
            onSelectionChange: () => this.updateHighlight(),
            onSelect: (index) => this.MENU_OPTIONS[index].action(),
            onClose: () => this.handleClose(),
        })

        this.updateHighlight()
    }

    private handleClose(): void {
        if (this.subScreenVisible) {
            this.closeSubScreen()
        } else {
            this.scene.uiManager?.closeMenu()
        }
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
            const bg = UI_POSITIONS.menu.background
            this.rewardsLayer.setScrollFactor(0)
            this.rewardsLayer.setScale(bg.scale)
            this.rewardsLayer.setPosition(bg.x, bg.y)
            this.rewardsLayer.setDepth(UI_DEPTH.menuBackground)
        }
    }

    public hide(): void {
        if (!this.isVisible) return
        this.isVisible = false

        this.closeSubScreen()

        if (this.rewardsLayer) {
            this.rewardsLayer.destroy()
            this.rewardsLayer = null
        }
        if (this.rewardsMap) {
            this.rewardsMap.destroy()
            this.rewardsMap = undefined
        }

        this.dimOverlay?.destroy()
        this.dimOverlay = null

        this.navigation?.cleanup()
        this.navigation = null

        this.container?.destroy()
        this.container = null
        this.menuItems = []
    }

    private openSubScreen(category: string): void {
        if (this.subScreenVisible) return
        this.subScreenVisible = true

        this.navigation?.pause()

        this.menuItems.forEach((item) => item.setVisible(false))
        if (this.rewardsLayer) {
            this.rewardsLayer.setVisible(false)
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

    private createSubScreenBackground(): void {
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
            const bg = UI_POSITIONS.subScreen.background
            this.subScreenLayer.setScrollFactor(0)
            this.subScreenLayer.setScale(bg.scale)
            this.subScreenLayer.setPosition(bg.x, bg.y)
            this.subScreenLayer.setDepth(UI_DEPTH.subScreenBackground)
        }
    }

    private closeSubScreen(): void {
        if (!this.subScreenVisible) return
        this.subScreenVisible = false

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

        this.navigation?.resume()
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
