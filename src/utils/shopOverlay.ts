import type {Scene} from '@/scenes/Scene'
import {createTransaction, getRewardsByCourseWithStats} from '@/db'

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
    private scene: Scene
    private container: Phaser.GameObjects.Container | null = null
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

    // Styles
    private readonly TITLE_STYLE = {
        fontFamily: 'CyberPunkFont, Arial',
        fontSize: '48px',
        color: '#ffd700',
        fontStyle: 'bold',
    }

    private readonly ITEM_STYLE = {
        fontFamily: 'CyberPunkFont, Arial',
        fontSize: '32px',
        color: '#ffffff',
    }

    private readonly COST_STYLE = {
        fontFamily: 'CyberPunkFont, Arial',
        fontSize: '24px',
        color: '#ffff00',
    }

    private readonly COINS_STYLE = {
        fontFamily: 'CyberPunkFont, Arial',
        fontSize: '32px',
        color: '#ffd700',
    }

    // Tilemap background
    private shopMap?: Phaser.Tilemaps.Tilemap
    private shopLayer?: Phaser.Tilemaps.TilemapLayer | null

    constructor(scene: Scene) {
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
                bg.setFillStyle(0x444444)
            } else {
                bg.setFillStyle(0x222222)
            }
        })
    }

    public async show(userEmail: string): Promise<void> {
        if (this.isVisible) return
        this.isVisible = true
        this.userEmail = userEmail
        this.selectedIndex = 0

        // Block movement while shop is open
        this.scene.inputHandler.blockMovement()

        // Create tilemap background first
        this.createShopBackground()

        // Create main container
        this.container = this.scene.add.container(0, 0)
        this.container.setScrollFactor(0)
        this.container.setDepth(1100)

        // Title
        const title = this.scene.add.text(400, 150, 'SHOP', this.TITLE_STYLE)
        title.setOrigin(0.5)
        title.setScrollFactor(0)
        this.container.add(title)

        // Coins display
        this.coinsText = this.scene.add.text(
            400,
            220,
            'Loading...',
            this.COINS_STYLE
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
            400,
            450,
            'Loading shop items...',
            this.ITEM_STYLE
        )
        this.loadingText.setOrigin(0.5)
        this.loadingText.setScrollFactor(0)
        this.container.add(this.loadingText)

        // Close button
        const closeBtn = this.scene.add.text(470, 740, 'BACK', {
            fontFamily: 'CyberPunkFont, Arial',
            fontSize: '48px',
            color: '#00ffff',
        })
        closeBtn.setOrigin(0.5)
        closeBtn.setScrollFactor(0)
        closeBtn.setInteractive({useHandCursor: true})
        closeBtn.on('pointerdown', () => this.hide())
        closeBtn.on('pointerover', () => {
            closeBtn.setColor('#ffffff')
            closeBtn.setStyle({
                backgroundColor: '#00ffff44',
                padding: {left: 12, right: 12, top: 4, bottom: 4},
            })
        })
        closeBtn.on('pointerout', () => {
            closeBtn.setColor('#00ffff')
            closeBtn.setStyle({backgroundColor: undefined, padding: undefined})
        })
        this.container.add(closeBtn)

        // Make main camera ignore these UI elements
        this.scene.cameras.main.ignore(this.container)
        if (this.shopLayer) {
            this.scene.cameras.main.ignore(this.shopLayer)
        }

        // Fetch data
        await this.fetchCoins()
        await this.fetchShopItems()
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

        if (validTilesets.length < 1) {
            console.error('Shop tilesets missing!')
            return
        }

        this.shopLayer = this.shopMap.createLayer('base layer', validTilesets)
        if (this.shopLayer) {
            this.shopLayer.setScrollFactor(0)
            this.shopLayer.setScale(2.5)
            this.shopLayer.setPosition(-20, 0)
            this.shopLayer.setDepth(1099)
        }
    }

    public hide(): void {
        if (!this.isVisible) return
        this.isVisible = false

        this.scene.inputHandler.unblockMovement()

        // Clean up tilemap
        if (this.shopLayer) {
            this.shopLayer.destroy()
            this.shopLayer = null
        }
        if (this.shopMap) {
            this.shopMap.destroy()
            this.shopMap = undefined
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
                this.loadingText.setColor('#ff0000')
            }
        }
    }

    private renderShopItems(): void {
        if (!this.itemsContainer) return

        // Clear existing
        this.itemsContainer.removeAll(true)
        this.itemButtons = []

        const startX = 70
        const startY = 280
        const itemHeight = 90

        if (this.shopItems.length === 0) {
            const noItems = this.scene.add.text(
                400,
                450,
                'No items available',
                this.ITEM_STYLE
            )
            noItems.setOrigin(0.5)
            noItems.setScrollFactor(0)
            this.itemsContainer.add(noItems)
            return
        }

        this.shopItems.forEach((item, i) => {
            const y = startY + i * itemHeight
            const itemContainer = this.scene.add.container(0, 0)

            // Background
            const bg = this.scene.add.rectangle(400, y, 650, 70, 0x222222)
            bg.setStrokeStyle(1, 0x444444)
            bg.setScrollFactor(0)
            itemContainer.add(bg)

            // Item name
            const nameText = this.scene.add.text(
                startX,
                y - 20,
                item.name,
                this.ITEM_STYLE
            )
            nameText.setScrollFactor(0)
            itemContainer.add(nameText)

            // Cost
            const costText = this.scene.add.text(
                startX,
                y + 15,
                `${item.cost} coins`,
                this.COST_STYLE
            )
            costText.setScrollFactor(0)
            itemContainer.add(costText)

            // Stock (if limited)
            if (item.quantityLimit !== null && item.available !== null) {
                const stockColor = item.available > 3 ? '#88ff88' : '#ff8888'
                const stockText = this.scene.add.text(
                    450,
                    y,
                    `Left: ${item.available}`,
                    {
                        fontFamily: 'CyberPunkFont, Arial',
                        fontSize: '20px',
                        color: stockColor,
                    }
                )
                stockText.setOrigin(0, 0.5)
                stockText.setScrollFactor(0)
                itemContainer.add(stockText)
            }

            // Buy button
            const canAfford = this.playerCoins >= item.cost
            const buyBtn = this.scene.add.text(
                700,
                y,
                canAfford ? 'BUY' : 'NOT ENOUGH',
                {
                    fontFamily: 'CyberPunkFont, Arial',
                    fontSize: '28px',
                    color: '#ffffff',
                    backgroundColor: canAfford ? '#00ff0088' : '#ff444488',
                    padding: {left: 20, right: 20, top: 10, bottom: 10},
                }
            )
            buyBtn.setOrigin(0.5)
            buyBtn.setScrollFactor(0)

            if (canAfford) {
                buyBtn.setInteractive({useHandCursor: true})
                buyBtn.on('pointerdown', () => this.purchaseItem(item))
                buyBtn.on('pointerover', () => {
                    buyBtn.setStyle({backgroundColor: '#ffffff44'})
                    this.selectedIndex = i
                    this.updateHighlight()
                })
                buyBtn.on('pointerout', () => {
                    buyBtn.setStyle({backgroundColor: '#00ff0088'})
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
        const successText = this.scene.add.text(960, 540, 'PURCHASED!', {
            fontFamily: 'CyberPunkFont, Arial',
            fontSize: '56px',
            color: '#00ff00',
            stroke: '#00ff00',
            strokeThickness: 8,
        })
        successText.setOrigin(0.5)
        successText.setScrollFactor(0)
        successText.setDepth(2000)
        successText.setAlpha(0)

        // Animate in + fade out
        this.scene.tweens.add({
            targets: successText,
            alpha: 1,
            scale: 1.3,
            y: successText.y - 50,
            duration: 400,
            ease: 'Power2',
            yoyo: true,
            hold: 600,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: successText,
                    alpha: 0,
                    y: successText.y - 100,
                    duration: 600,
                    onComplete: () => successText.destroy(),
                })
            },
        })

        // Flash effect
        this.scene.cameras.main.flash(300, 0, 255, 0)
    }

    private showPurchaseError(): void {
        const errorText = this.scene.add.text(960, 540, 'Purchase failed!', {
            fontFamily: 'CyberPunkFont, Arial',
            fontSize: '40px',
            color: '#ff0000',
        })
        errorText.setOrigin(0.5)
        errorText.setScrollFactor(0)
        errorText.setDepth(2000)

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
