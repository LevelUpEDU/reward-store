import type {UIScene} from '@/scenes/UIScene'
import {createTransaction, getRewardsByCourseWithStats} from '@/db'
import {
    UI_COLORS,
    UI_DEPTH,
    UI_TEXT_STYLES,
    createHoverHandlers,
} from '../uiStyles'
import {UI_POSITIONS} from '../uiPositions'

interface ShopItem {
    id: number
    name: string
    cost: number
    quantityLimit: number | null
    available: number | null
}

/**
 * Shop overlay for purchasing rewards with coins
 * Can be opened from MenuOverlay or directly via interaction
 */
export class ShopOverlay {
    private scene: UIScene
    private container: Phaser.GameObjects.Container | null = null
    private dimOverlay: Phaser.GameObjects.Rectangle | null = null
    private isVisible: boolean = false
    private playerCoins: number = 0
    private userEmail: string = ''

    // UI elements that need updating
    private coinsText: Phaser.GameObjects.Text | null = null
    private itemsContainer: Phaser.GameObjects.Container | null = null
    private loadingText: Phaser.GameObjects.Text | null = null

    // Navigation
    private shopItems: ShopItem[] = []
    private selectedIndex: number = 0
    private itemButtons: Phaser.GameObjects.Container[] = []

    // Keyboard controls
    private upKey?: Phaser.Input.Keyboard.Key
    private downKey?: Phaser.Input.Keyboard.Key
    private enterKey?: Phaser.Input.Keyboard.Key
    private escKey?: Phaser.Input.Keyboard.Key

    // Tilemap background
    private shopMap?: Phaser.Tilemaps.Tilemap
    private shopLayer?: Phaser.Tilemaps.TilemapLayer | null

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
        this.escKey = this.scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.ESC
        )

        this.upKey.on('down', () => this.navigateUp())
        this.downKey.on('down', () => this.navigateDown())
        this.enterKey.on('down', () => this.selectCurrent())
        this.escKey.on('down', () => this.hide())
    }

    private navigateUp(): void {
        if (!this.isVisible || this.shopItems.length === 0) return

        this.selectedIndex =
            (this.selectedIndex - 1 + this.shopItems.length) %
            this.shopItems.length
        this.updateHighlight()
    }

    private navigateDown(): void {
        if (!this.isVisible || this.shopItems.length === 0) return

        this.selectedIndex = (this.selectedIndex + 1) % this.shopItems.length
        this.updateHighlight()
    }

    private selectCurrent(): void {
        if (!this.isVisible || this.shopItems.length === 0) return

        const item = this.shopItems[this.selectedIndex]
        if (this.playerCoins >= item.cost) {
            this.purchaseItem(item)
        }
    }

    private updateHighlight(): void {
        this.itemButtons.forEach((btn, i) => {
            const bg = btn.getAt(0) as Phaser.GameObjects.Rectangle
            if (i === this.selectedIndex) {
                bg.setFillStyle(UI_COLORS.itemBgSelected)
            } else {
                bg.setFillStyle(UI_COLORS.itemBg)
            }
        })
    }

    public async show(userEmail: string): Promise<void> {
        if (this.isVisible) return
        this.isVisible = true
        this.userEmail = userEmail
        this.selectedIndex = 0

        // Block movement while shop is open
        this.scene.getInputHandler().blockMovement()

        this.createDimOverlay()

        // Create tilemap background first
        this.createShopBackground()

        // Create main container
        this.container = this.scene.add.container(0, 0)
        this.container.setScrollFactor(0)
        this.container.setDepth(UI_DEPTH.shopContent)

        const shop = UI_POSITIONS.shop

        // Title
        const title = this.scene.add.text(
            shop.title.x,
            shop.title.y,
            'SHOP',
            UI_TEXT_STYLES.title
        )
        title.setOrigin(0.5)
        title.setScrollFactor(0)
        this.container.add(title)

        // Coins display
        this.coinsText = this.scene.add.text(
            shop.coins.x,
            shop.coins.y,
            'Loading...',
            UI_TEXT_STYLES.coins
        )
        this.coinsText.setOrigin(0.5)
        this.coinsText.setScrollFactor(0)
        this.container.add(this.coinsText)

        // Items container
        this.itemsContainer = this.scene.add.container(0, 0)
        this.itemsContainer.setScrollFactor(0)
        this.container.add(this.itemsContainer)

        // Loading text
        this.loadingText = this.scene.add.text(
            shop.loading.x,
            shop.loading.y,
            'Loading shop items...',
            UI_TEXT_STYLES.body
        )
        this.loadingText.setOrigin(0.5)
        this.loadingText.setScrollFactor(0)
        this.container.add(this.loadingText)

        // Close button
        const closeBtn = this.scene.add.text(
            shop.backButton.x,
            shop.backButton.y,
            'BACK',
            UI_TEXT_STYLES.backButtonCyan
        )
        closeBtn.setOrigin(0.5)
        closeBtn.setScrollFactor(0)
        closeBtn.setInteractive({useHandCursor: true})
        closeBtn.on('pointerdown', () => {
            this.scene.uiManager?.closeShop()
            this.scene.uiManager?.openMenu()
        })
        createHoverHandlers(
            closeBtn,
            UI_COLORS.cyan,
            UI_COLORS.white,
            UI_COLORS.hoverBgCyan
        )
        this.container.add(closeBtn)

        // Fetch data
        await this.fetchCoins()
        await this.fetchShopItems()
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
    }

    private createShopBackground(): void {
        if (!this.scene.textures.exists('FrameMap')) {
            // Fallback - no tilemap
            return
        }

        this.shopMap = this.scene.make.tilemap({key: 'shopMap'})

        const tilesets = [
            this.shopMap.addTilesetImage('FrameMap'),
            this.shopMap.addTilesetImage('button_yellow_left'),
            this.shopMap.addTilesetImage('button_yellow_right'),
        ]

        const validTilesets = tilesets.filter(
            (t): t is Phaser.Tilemaps.Tileset => Boolean(t)
        )

        this.shopLayer = this.shopMap.createLayer('base layer', validTilesets)
        if (this.shopLayer) {
            const bg = UI_POSITIONS.shop.background
            this.shopLayer.setScrollFactor(0)
            this.shopLayer.setScale(bg.scale)
            this.shopLayer.setPosition(bg.x, bg.y)
            this.shopLayer.setDepth(UI_DEPTH.shopBackground)
        }
    }

    public hide(returnToMenu: boolean = false): void {
        if (!this.isVisible) return
        this.isVisible = false

        this.scene.getInputHandler().unblockMovement()

        // Clean up tilemap
        if (this.shopLayer) {
            this.shopLayer.destroy()
            this.shopLayer = null
        }
        if (this.shopMap) {
            this.shopMap.destroy()
            this.shopMap = undefined
        }

        this.dimOverlay?.destroy()
        this.dimOverlay = null

        if (returnToMenu) {
            this.scene.uiManager?.openMenu()
        }

        this.container?.destroy()
        this.container = null
        this.itemsContainer = null
        this.coinsText = null
        this.loadingText = null
        this.itemButtons = []
        this.shopItems = []
    }

    private async fetchCoins(): Promise<void> {
        try {
            // Use the scene's reward points UI to get current coins
            if (this.scene.rewardPointsUI) {
                const data =
                    await this.scene.rewardPointsUI.fetchAndUpdatePoints(
                        this.userEmail
                    )
                this.playerCoins = data.coins ?? data.points ?? 0
            }
            this.updateCoinsDisplay()
        } catch (error) {
            console.error('Failed to fetch coins:', error)
            this.playerCoins = 0
            this.updateCoinsDisplay()
        }
    }

    private updateCoinsDisplay(): void {
        if (this.coinsText) {
            this.coinsText.setText(`Coins: ${this.playerCoins}`)
        }
    }

    private async fetchShopItems(): Promise<void> {
        try {
            // TODO: Make course ID configurable or fetch from context
            const rewards = await getRewardsByCourseWithStats(19)
            const available = rewards.filter((r) => r.isAvailable)

            this.shopItems = available.map((entry) => ({
                id: entry.reward.id,
                name: entry.reward.name,
                cost: entry.reward.cost,
                quantityLimit: entry.reward.quantityLimit,
                available: entry.available,
            }))

            this.loadingText?.destroy()
            this.loadingText = null

            this.renderShopItems()
        } catch (error) {
            console.error('Failed to fetch shop items:', error)
            if (this.loadingText) {
                this.loadingText.setText('Error loading shop')
                this.loadingText.setColor(UI_COLORS.red)
            }
        }
    }

    private renderShopItems(): void {
        if (!this.itemsContainer) return

        // Clear existing
        this.itemsContainer.removeAll(true)
        this.itemButtons = []

        const items = UI_POSITIONS.shop.items
        const shop = UI_POSITIONS.shop

        if (this.shopItems.length === 0) {
            const noItems = this.scene.add.text(
                shop.noItems.x,
                shop.noItems.y,
                'No items available',
                UI_TEXT_STYLES.body
            )
            noItems.setOrigin(0.5)
            noItems.setScrollFactor(0)
            this.itemsContainer.add(noItems)
            return
        }

        this.shopItems.forEach((item, i) => {
            const y = items.startY + i * items.height
            const itemContainer = this.scene.add.container(0, 0)

            // Background
            const bg = this.scene.add.rectangle(
                items.bgCenterX,
                y,
                items.bgWidth,
                items.bgHeight,
                UI_COLORS.itemBg
            )
            bg.setStrokeStyle(1, UI_COLORS.itemBorder)
            bg.setScrollFactor(0)
            itemContainer.add(bg)

            // Item name
            const nameText = this.scene.add.text(
                items.startX,
                y + items.nameOffsetY,
                item.name,
                UI_TEXT_STYLES.body
            )
            nameText.setScrollFactor(0)
            itemContainer.add(nameText)

            // Cost
            const costText = this.scene.add.text(
                items.startX,
                y + items.costOffsetY,
                `${item.cost} coins`,
                UI_TEXT_STYLES.cost
            )
            costText.setScrollFactor(0)
            itemContainer.add(costText)

            // Stock (if limited)
            if (item.quantityLimit !== null && item.available !== null) {
                const isLow = item.available <= 3
                const stockText = this.scene.add.text(
                    items.startX + items.stockOffsetX,
                    y,
                    `Left: ${item.available}`,
                    UI_TEXT_STYLES.stock(isLow)
                )
                stockText.setOrigin(0, 0.5)
                stockText.setScrollFactor(0)
                itemContainer.add(stockText)
            }

            // Buy button
            const canAfford = this.playerCoins >= item.cost
            const buyBtn = this.scene.add.text(
                items.startX + items.buyButtonOffsetX,
                y,
                canAfford ? 'BUY' : 'NOT ENOUGH',
                UI_TEXT_STYLES.buyButton(canAfford)
            )
            buyBtn.setOrigin(0.5)
            buyBtn.setScrollFactor(0)

            if (canAfford) {
                buyBtn.setInteractive({useHandCursor: true})
                buyBtn.on('pointerdown', () => this.purchaseItem(item))
                buyBtn.on('pointerover', () => {
                    buyBtn.setStyle({backgroundColor: UI_COLORS.buyButtonHover})
                    this.selectedIndex = i
                    this.updateHighlight()
                })
                buyBtn.on('pointerout', () => {
                    buyBtn.setStyle({backgroundColor: UI_COLORS.buyButtonBg})
                })
            }
            itemContainer.add(buyBtn)

            this.itemButtons.push(itemContainer)
            this.itemsContainer!.add(itemContainer)
        })

        this.updateHighlight()
    }

    private async purchaseItem(item: ShopItem): Promise<void> {
        if (this.playerCoins < item.cost) return

        // Optimistic update
        this.playerCoins -= item.cost
        this.updateCoinsDisplay()

        try {
            await createTransaction({
                email: this.userEmail,
                points: -item.cost,
                submissionId: 151, // TODO: Make configurable
            })

            // Success feedback
            this.showPurchaseSuccess()

            // Refresh shop items to update stock
            await this.fetchShopItems()

            // Update the scene's reward points UI
            this.scene.refreshRewardPoints()
        } catch (error) {
            console.error('Purchase failed:', error)

            // Rollback
            this.playerCoins += item.cost
            this.updateCoinsDisplay()

            this.showPurchaseError()
        }
    }

    private showPurchaseSuccess(): void {
        const feedback = UI_POSITIONS.feedback
        const successText = this.scene.add.text(
            feedback.x,
            feedback.y,
            'PURCHASED!',
            UI_TEXT_STYLES.purchaseSuccess
        )
        successText.setOrigin(0.5)
        successText.setScrollFactor(0)
        successText.setDepth(UI_DEPTH.feedback)
        successText.setAlpha(0)

        // Animate in + fade out
        this.scene.tweens.add({
            targets: successText,
            alpha: 1,
            scale: 1.3,
            y: feedback.y + feedback.animateOffsetY,
            duration: 400,
            ease: 'Power2',
            yoyo: true,
            hold: 600,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: successText,
                    alpha: 0,
                    y: feedback.y + feedback.fadeOffsetY,
                    duration: 600,
                    onComplete: () => successText.destroy(),
                })
            },
        })

        // Flash effect
        this.scene.cameras.main.flash(300, 0, 255, 0)
    }

    private showPurchaseError(): void {
        const feedback = UI_POSITIONS.feedback
        const errorText = this.scene.add.text(
            feedback.x,
            feedback.y,
            'Purchase failed!',
            UI_TEXT_STYLES.purchaseError
        )
        errorText.setOrigin(0.5)
        errorText.setScrollFactor(0)
        errorText.setDepth(UI_DEPTH.feedback)

        this.scene.time.delayedCall(2000, () => errorText.destroy())
    }

    public destroy(): void {
        this.upKey?.off('down')
        this.downKey?.off('down')
        this.enterKey?.off('down')
        this.escKey?.off('down')

        this.hide()
    }
}
