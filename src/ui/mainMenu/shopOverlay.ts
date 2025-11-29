import type {UIScene} from '@/scenes/UIScene'
import {
    UI_COLORS,
    UI_DEPTH,
    UI_TEXT_STYLES,
    createHoverHandlers,
} from '../styles/uiStyles'
import {UI_POSITIONS} from '../styles/uiPositions'
import {
    createMenuNavigation,
    type MenuNavigationControls,
} from '../menuNavigation'

interface ShopItem {
    id: number
    name: string
    cost: number
    quantityLimit: number | null
    available: number | null
}

interface Course {
    id: number
    title: string
    courseCode: string
}

export class ShopOverlay {
    private scene: UIScene
    private container: Phaser.GameObjects.Container | null = null
    private dimOverlay: Phaser.GameObjects.Rectangle | null = null
    private isVisible: boolean = false
    private playerCoins: number = 0
    private userEmail: string = ''
    private selectedIndex: number = 0

    private coinsText: Phaser.GameObjects.Text | null = null
    private itemsContainer: Phaser.GameObjects.Container | null = null
    private loadingText: Phaser.GameObjects.Text | null = null

    private shopBg: Phaser.GameObjects.Image | null = null
    private btnLeft: Phaser.GameObjects.Image | null = null
    private btnRight: Phaser.GameObjects.Image | null = null

    private shopItems: ShopItem[] = []
    private itemButtons: Phaser.GameObjects.Container[] = []

    private isPurchasing: boolean = false

    // course selector state
    private courses: Course[] = []
    private selectedCourseIndex: number = 0
    private courseNameText: Phaser.GameObjects.Text | null = null
    private leftArrow: Phaser.GameObjects.Text | null = null
    private rightArrow: Phaser.GameObjects.Text | null = null

    // scroll state
    private scrollOffset: number = 0
    private scrollUpIndicator: Phaser.GameObjects.Text | null = null
    private scrollDownIndicator: Phaser.GameObjects.Text | null = null

    private navigation: MenuNavigationControls | null = null

    constructor(scene: UIScene) {
        this.scene = scene
    }

    public async show(userEmail: string): Promise<void> {
        if (this.isVisible) return
        this.isVisible = true
        this.userEmail = userEmail
        this.selectedIndex = 0
        this.scrollOffset = 0
        this.selectedCourseIndex = 0

        this.scene.getInputHandler().blockMovement()

        this.createDimOverlay()
        this.createShopBackground()

        this.container = this.scene.add.container(0, 0)
        this.container.setScrollFactor(0)
        this.container.setDepth(UI_DEPTH.shopContent)

        const shop = UI_POSITIONS.shop

        const title = this.scene.add.text(
            shop.title.x,
            shop.title.y,
            'SHOP',
            UI_TEXT_STYLES.title
        )
        title.setOrigin(0.5)
        title.setScrollFactor(0)
        this.container.add(title)

        this.coinsText = this.scene.add.text(
            shop.coins.x,
            shop.coins.y,
            'Loading...',
            UI_TEXT_STYLES.coins
        )
        this.coinsText.setOrigin(0.5)
        this.coinsText.setScrollFactor(0)
        this.container.add(this.coinsText)

        this.createCourseSelector()
        this.createScrollIndicators()

        this.itemsContainer = this.scene.add.container(0, 0)
        this.itemsContainer.setScrollFactor(0)
        this.container.add(this.itemsContainer)

        this.loadingText = this.scene.add.text(
            shop.loading.x,
            shop.loading.y,
            'Loading...',
            UI_TEXT_STYLES.body
        )
        this.loadingText.setOrigin(0.5)
        this.loadingText.setScrollFactor(0)
        this.container.add(this.loadingText)

        const closeBtn = this.scene.add.text(
            shop.backButton.x,
            shop.backButton.y,
            'BACK',
            UI_TEXT_STYLES.backButtonCyan
        )
        closeBtn.setOrigin(0.5)
        closeBtn.setScrollFactor(0)
        closeBtn.setInteractive({useHandCursor: true})
        closeBtn.on('pointerdown', () => this.returnToMenu())
        createHoverHandlers(
            closeBtn,
            UI_COLORS.cyan,
            UI_COLORS.white,
            UI_COLORS.hoverBgCyan
        )
        this.container.add(closeBtn)

        this.setupNavigation()

        await this.fetchCoins()
        await this.fetchCourses()
    }

    private setupNavigation(): void {
        const maxVisible = UI_POSITIONS.shop.items.maxVisible

        this.navigation = createMenuNavigation({
            scene: this.scene,
            itemCount: 0,
            visibleCount: maxVisible,
            initialIndex: 0,
            onSelectionChange: (index) => {
                this.selectedIndex = index + this.scrollOffset
                this.updateHighlight()
            },
            onSelect: () => {
                this.tryPurchase(this.selectedIndex)
            },
            onClose: () => {
                this.returnToMenu()
            },
            onScrollUp: () => {
                if (this.scrollOffset > 0) {
                    this.scrollOffset--
                    this.selectedIndex = this.scrollOffset
                    this.renderShopItems()
                    return true
                }
                return false
            },
            onScrollDown: () => {
                const maxVis = UI_POSITIONS.shop.items.maxVisible
                if (this.scrollOffset + maxVis < this.shopItems.length) {
                    this.scrollOffset++
                    this.selectedIndex = this.scrollOffset + maxVis - 1
                    this.renderShopItems()
                    return true
                }
                return false
            },
            onLeft: () => {
                this.navigateCourseLeft()
            },
            onRight: () => {
                this.navigateCourseRight()
            },
        })
    }

    private navigateCourseLeft(): void {
        if (this.courses.length <= 1) return

        this.selectedCourseIndex =
            (this.selectedCourseIndex - 1 + this.courses.length) %
            this.courses.length
        this.onCourseChanged()
    }

    private navigateCourseRight(): void {
        if (this.courses.length <= 1) return

        this.selectedCourseIndex =
            (this.selectedCourseIndex + 1) % this.courses.length
        this.onCourseChanged()
    }

    private async onCourseChanged(): Promise<void> {
        this.updateCourseDisplay()
        this.scrollOffset = 0
        this.selectedIndex = 0
        this.navigation?.setSelectedIndex(0)
        await this.fetchShopItems()
    }

    private updateCourseDisplay(): void {
        if (!this.courseNameText || this.courses.length === 0) return

        const course = this.courses[this.selectedCourseIndex]
        this.courseNameText.setText(course.title)

        const hasMultipleCourses = this.courses.length > 1
        this.leftArrow?.setColor(
            hasMultipleCourses ? UI_COLORS.arrowNormal : UI_COLORS.arrowDisabled
        )
        this.rightArrow?.setColor(
            hasMultipleCourses ? UI_COLORS.arrowNormal : UI_COLORS.arrowDisabled
        )
    }

    private updateHighlight(): void {
        this.itemButtons.forEach((btn, i) => {
            const actualIndex = i + this.scrollOffset
            const bg = btn.getAt(0) as Phaser.GameObjects.Rectangle
            if (actualIndex === this.selectedIndex) {
                bg.setFillStyle(UI_COLORS.itemBgSelected)
            } else {
                bg.setFillStyle(UI_COLORS.itemBg)
            }
        })

        this.updateScrollIndicators()
    }

    private updateScrollIndicators(): void {
        const maxVisible = UI_POSITIONS.shop.items.maxVisible
        const canScrollUp = this.scrollOffset > 0
        const canScrollDown =
            this.scrollOffset + maxVisible < this.shopItems.length

        this.scrollUpIndicator?.setStyle(
            canScrollUp ?
                UI_TEXT_STYLES.scrollIndicator
            :   UI_TEXT_STYLES.scrollIndicatorDisabled
        )
        this.scrollDownIndicator?.setStyle(
            canScrollDown ?
                UI_TEXT_STYLES.scrollIndicator
            :   UI_TEXT_STYLES.scrollIndicatorDisabled
        )
    }

    private createCourseSelector(): void {
        if (!this.container) return

        const shop = UI_POSITIONS.shop
        const selector = shop.courseSelector

        this.leftArrow = this.scene.add.text(
            selector.labelX - selector.arrowOffsetX,
            selector.y,
            '◀',
            UI_TEXT_STYLES.courseSelector
        )
        this.leftArrow.setOrigin(0.5)
        this.leftArrow.setScrollFactor(0)
        this.leftArrow.setInteractive({useHandCursor: true})
        this.leftArrow.on('pointerdown', () => this.navigateCourseLeft())
        this.leftArrow.on('pointerover', () =>
            this.leftArrow?.setColor(UI_COLORS.arrowHover)
        )
        this.leftArrow.on('pointerout', () =>
            this.leftArrow?.setColor(
                this.courses.length > 1 ?
                    UI_COLORS.arrowNormal
                :   UI_COLORS.arrowDisabled
            )
        )
        this.container.add(this.leftArrow)

        this.courseNameText = this.scene.add.text(
            selector.labelX,
            selector.y,
            'Loading courses...',
            UI_TEXT_STYLES.courseSelector
        )
        this.courseNameText.setOrigin(0.5)
        this.courseNameText.setScrollFactor(0)
        this.container.add(this.courseNameText)

        this.rightArrow = this.scene.add.text(
            selector.labelX + selector.arrowOffsetX,
            selector.y,
            '▶',
            UI_TEXT_STYLES.courseSelector
        )
        this.rightArrow.setOrigin(0.5)
        this.rightArrow.setScrollFactor(0)
        this.rightArrow.setInteractive({useHandCursor: true})
        this.rightArrow.on('pointerdown', () => this.navigateCourseRight())
        this.rightArrow.on('pointerover', () =>
            this.rightArrow?.setColor(UI_COLORS.arrowHover)
        )
        this.rightArrow.on('pointerout', () =>
            this.rightArrow?.setColor(
                this.courses.length > 1 ?
                    UI_COLORS.arrowNormal
                :   UI_COLORS.arrowDisabled
            )
        )
        this.container.add(this.rightArrow)
    }

    private createScrollIndicators(): void {
        if (!this.container) return

        const indicators = UI_POSITIONS.shop.scrollIndicators

        this.scrollUpIndicator = this.scene.add.text(
            indicators.x,
            indicators.upY,
            '▲',
            UI_TEXT_STYLES.scrollIndicatorDisabled
        )
        this.scrollUpIndicator.setOrigin(0.5)
        this.scrollUpIndicator.setScrollFactor(0)
        this.scrollUpIndicator.setInteractive({useHandCursor: true})
        this.scrollUpIndicator.on('pointerdown', () => {
            if (this.scrollOffset > 0) {
                this.scrollOffset--
                this.renderShopItems()
                this.updateScrollIndicators()
            }
        })
        this.container.add(this.scrollUpIndicator)

        this.scrollDownIndicator = this.scene.add.text(
            indicators.x,
            indicators.downY,
            '▼',
            UI_TEXT_STYLES.scrollIndicatorDisabled
        )
        this.scrollDownIndicator.setOrigin(0.5)
        this.scrollDownIndicator.setScrollFactor(0)
        this.scrollDownIndicator.setInteractive({useHandCursor: true})
        this.scrollDownIndicator.on('pointerdown', () => {
            const maxVisible = UI_POSITIONS.shop.items.maxVisible
            if (this.scrollOffset + maxVisible < this.shopItems.length) {
                this.scrollOffset++
                this.renderShopItems()
                this.updateScrollIndicators()
            }
        })
        this.container.add(this.scrollDownIndicator)
    }

    private returnToMenu(): void {
        this.scene.uiManager?.closeShop()
        this.scene.uiManager?.openMenu()
    }

    private tryPurchase(index: number): void {
        const item = this.shopItems[index]
        if (item && this.playerCoins >= item.cost && item.available !== 0) {
            this.purchaseItem(item)
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
    }

    private createShopBackground(): void {
        const bg = UI_POSITIONS.shop.background
        const btnPos = UI_POSITIONS.shop.backButton
        const btnDecor = UI_POSITIONS.shop.backButtonDecor

        this.shopBg = this.scene.add.image(bg.x, bg.y, 'shopMenu')
        this.shopBg.setOrigin(0, 0)
        this.shopBg.setDisplaySize(bg.width, bg.height)
        this.shopBg.setScrollFactor(0)
        this.shopBg.setDepth(UI_DEPTH.shopBackground)

        const halfTotalWidth = btnDecor.totalWidth / 2
        const leftX = btnPos.x - halfTotalWidth * btnDecor.scale

        this.btnLeft = this.scene.add.image(leftX, btnPos.y, 'btn_yellow_l')
        this.btnLeft.setOrigin(0, 0.5)
        this.btnLeft.setScale(btnDecor.scale)
        this.btnLeft.setScrollFactor(0)
        this.btnLeft.setDepth(UI_DEPTH.shopBackground + 1)

        const rightX = leftX + btnDecor.leftWidth * btnDecor.scale
        this.btnRight = this.scene.add.image(rightX, btnPos.y, 'btn_yellow_r')
        this.btnRight.setOrigin(0, 0.5)
        this.btnRight.setScale(btnDecor.scale)
        this.btnRight.setScrollFactor(0)
        this.btnRight.setDepth(UI_DEPTH.shopBackground + 1)
    }

    public hide(): void {
        if (!this.isVisible) return
        this.isVisible = false

        this.navigation?.cleanup()
        this.navigation = null

        this.scene.getInputHandler().unblockMovement()

        this.shopBg?.destroy()
        this.shopBg = null

        this.btnLeft?.destroy()
        this.btnLeft = null

        this.btnRight?.destroy()
        this.btnRight = null

        this.dimOverlay?.destroy()
        this.dimOverlay = null

        this.container?.destroy()
        this.container = null

        this.itemsContainer = null
        this.coinsText = null
        this.loadingText = null
        this.courseNameText = null
        this.leftArrow = null
        this.rightArrow = null
        this.scrollUpIndicator = null
        this.scrollDownIndicator = null
        this.itemButtons = []
        this.shopItems = []
        this.courses = []
    }

    private async fetchCoins(): Promise<void> {
        try {
            const response = await fetch(
                `/api/student/points?email=${encodeURIComponent(this.userEmail)}`
            )
            if (!response.ok) throw new Error('Failed to fetch points')

            const data = await response.json()
            this.playerCoins = data.points ?? 0
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

    private async fetchCourses(): Promise<void> {
        try {
            const response = await fetch('/api/student/available-courses')
            if (!response.ok) throw new Error('Failed to fetch courses')

            const allCourses = await response.json()
            this.courses = allCourses
                .filter((c: {isRegistered: boolean}) => c.isRegistered)
                .map((c: {id: number; title: string; courseCode: string}) => ({
                    id: c.id,
                    title: c.title,
                    courseCode: c.courseCode,
                }))

            if (this.courses.length === 0) {
                this.courseNameText?.setText('No courses')
                this.loadingText?.setText('Not registered for any courses')
                return
            }

            this.selectedCourseIndex = 0
            this.updateCourseDisplay()
            await this.fetchShopItems()
        } catch (error) {
            console.error('Failed to fetch courses:', error)
            this.courseNameText?.setText('Error loading courses')
        }
    }

    private async fetchShopItems(): Promise<void> {
        if (this.courses.length === 0) return

        const courseId = this.courses[this.selectedCourseIndex].id

        try {
            this.loadingText?.setText('Loading shop items...')
            this.loadingText?.setVisible(true)

            const response = await fetch(`/api/rewards?courseId=${courseId}`)
            if (!response.ok) throw new Error('Failed to fetch rewards')

            const rewards = await response.json()
            const visibleRewards = rewards.filter((r: any) => r.reward.active)

            this.shopItems = visibleRewards.map(
                (entry: {
                    reward: {
                        id: number
                        name: string
                        cost: number
                        quantityLimit: number | null
                    }
                    available: number | null
                }) => ({
                    id: entry.reward.id,
                    name: entry.reward.name,
                    cost: entry.reward.cost,
                    quantityLimit: entry.reward.quantityLimit,
                    available: entry.available,
                })
            )

            this.loadingText?.setVisible(false)

            const maxVisible = UI_POSITIONS.shop.items.maxVisible
            this.navigation?.setItemCount(
                Math.min(this.shopItems.length, maxVisible)
            )

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
            this.updateScrollIndicators()
            return
        }

        const maxVisible = items.maxVisible
        const visibleItems = this.shopItems.slice(
            this.scrollOffset,
            this.scrollOffset + maxVisible
        )

        visibleItems.forEach((item, i) => {
            const actualIndex = i + this.scrollOffset
            const y = items.startY + i * items.height
            const itemContainer = this.scene.add.container(0, 0)

            const bg = this.scene.add.rectangle(
                items.bgCenterX,
                y,
                items.bgWidth,
                items.bgHeight,
                actualIndex === this.selectedIndex ?
                    UI_COLORS.itemBgSelected
                :   UI_COLORS.itemBg
            )
            bg.setStrokeStyle(1, UI_COLORS.itemBorder)
            bg.setScrollFactor(0)
            itemContainer.add(bg)

            const nameText = this.scene.add.text(
                items.startX,
                y + items.nameOffsetY,
                item.name,
                UI_TEXT_STYLES.body
            )
            nameText.setScrollFactor(0)
            itemContainer.add(nameText)

            const costText = this.scene.add.text(
                items.startX,
                y + items.costOffsetY,
                `${item.cost} coins`,
                UI_TEXT_STYLES.cost
            )
            costText.setScrollFactor(0)
            itemContainer.add(costText)

            if (item.quantityLimit !== null && item.available !== null) {
                const isLow = item.available <= 3
                const stockText = this.scene.add.text(
                    items.startX + items.stockOffsetX,
                    y + items.stockOffsetY,
                    `Left: ${item.available}`,
                    UI_TEXT_STYLES.stock(isLow)
                )
                stockText.setOrigin(0, 0.5)
                stockText.setScrollFactor(0)
                itemContainer.add(stockText)
            }

            const canAfford = this.playerCoins >= item.cost
            const inStock = item.available === null || item.available > 0
            const canBuy = canAfford && inStock

            let buttonText = 'BUY'
            if (!inStock) {
                buttonText = 'SOLD OUT'
            } else if (!canAfford) {
                buttonText = 'NOT ENOUGH'
            }

            const buyBtn = this.scene.add.text(
                items.startX + items.buyButtonOffsetX,
                y,
                buttonText,
                UI_TEXT_STYLES.buyButton(canBuy)
            )
            buyBtn.setOrigin(0.5)
            buyBtn.setScrollFactor(0)

            if (canBuy) {
                buyBtn.setInteractive({useHandCursor: true})
                buyBtn.on('pointerdown', () => this.purchaseItem(item))
                buyBtn.on('pointerover', () => {
                    buyBtn.setStyle({backgroundColor: UI_COLORS.buyButtonHover})
                    this.selectedIndex = actualIndex
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

        this.updateScrollIndicators()
    }

    private async purchaseItem(item: ShopItem): Promise<void> {
        if (this.isPurchasing) return
        if (this.playerCoins < item.cost) return
        if (item.available !== null && item.available <= 0) return

        this.isPurchasing = true
        // "optimistic" UI update
        this.playerCoins -= item.cost
        this.updateCoinsDisplay()

        try {
            const response = await fetch('/api/rewards/purchase', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({rewardId: item.id}),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Purchase failed')
            }

            const result = await response.json()

            // Update with server-confirmed balance
            this.playerCoins = result.newBalance
            this.updateCoinsDisplay()

            this.showPurchaseSuccess()
            await this.fetchShopItems()
            this.scene.refreshRewardPoints()
        } catch (error) {
            console.error('Purchase failed:', error)
            // revert "optimistic" update
            this.playerCoins += item.cost
            this.updateCoinsDisplay()
            this.showPurchaseError(
                error instanceof Error ? error.message : 'Purchase failed'
            )
        }
        this.isPurchasing = false
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

        this.scene.cameras.main.flash(300, 0, 255, 0)
    }

    private showPurchaseError(message: string): void {
        const feedback = UI_POSITIONS.feedback
        const errorText = this.scene.add.text(
            feedback.x,
            feedback.y,
            message,
            UI_TEXT_STYLES.purchaseError
        )
        errorText.setOrigin(0.5)
        errorText.setScrollFactor(0)
        errorText.setDepth(UI_DEPTH.feedback)

        this.scene.time.delayedCall(2000, () => errorText.destroy())
    }

    public destroy(): void {
        this.hide()
    }
}
