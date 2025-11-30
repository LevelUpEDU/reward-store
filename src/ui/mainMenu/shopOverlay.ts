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
import {
    createHorizontalSelector,
    type HorizontalSelectorControls,
} from '../components/horizontalSelector'
import {
    createScrollWindow,
    type ScrollWindowControls,
} from '../components/scrollWindow'
import {renderShopItems} from '../components/shopItemRenderer'
import {
    getStudentPoints,
    getStudentCourses,
    getShopItems,
    purchaseReward,
    type ShopItem,
    type Course,
} from '@/data/api/shop'

const ITEMS_VISIBLE = 4

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
    private loadingCourse: boolean = false // prevent concurrent course switches

    private courses: Course[] = []
    private courseSelector: HorizontalSelectorControls | null = null
    private scrollWindow: ScrollWindowControls<ShopItem> | null = null
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
        this.navigation = createMenuNavigation({
            scene: this.scene,
            itemCount: 0,
            visibleCount: ITEMS_VISIBLE,
            initialIndex: 0,
            onSelectionChange: (index) => {
                if (!this.scrollWindow) return
                this.selectedIndex = this.scrollWindow.getOffset() + index
                this.updateHighlight()
            },
            onSelect: () => {
                this.tryPurchase(this.selectedIndex)
            },
            onClose: () => {
                this.returnToMenu()
            },
            onScrollUp: () => {
                if (this.scrollWindow?.canScrollUp()) {
                    this.scrollWindow.scrollUp()
                    this.selectedIndex = this.scrollWindow.getOffset()
                    this.renderShopItems()
                    return true
                }
                return false
            },
            onScrollDown: () => {
                if (this.scrollWindow?.canScrollDown()) {
                    this.scrollWindow.scrollDown()
                    this.selectedIndex =
                        this.scrollWindow.getOffset() + ITEMS_VISIBLE - 1
                    this.renderShopItems()
                    return true
                }
                return false
            },
            onLeft: () => {
                this.courseSelector?.navigateLeft()
            },
            onRight: () => {
                this.courseSelector?.navigateRight()
            },
        })
    }

    private async onCourseChanged(_index: number): Promise<void> {
        if (this.loadingCourse) return
        this.loadingCourse = true

        try {
            this.selectedIndex = 0
            this.navigation?.setSelectedIndex(0)
            await this.fetchShopItems()
        } finally {
            this.loadingCourse = false
        }
    }

    private updateHighlight(): void {
        if (!this.scrollWindow) return

        const scrollOffset = this.scrollWindow.getOffset()

        this.itemButtons.forEach((btn, i) => {
            const actualIndex = i + scrollOffset
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
        if (!this.scrollWindow) return

        const canScrollUp = this.scrollWindow.canScrollUp()
        const canScrollDown = this.scrollWindow.canScrollDown()

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

        this.courseSelector = createHorizontalSelector({
            scene: this.scene,
            centerX: selector.labelX,
            centerY: selector.y,
            arrowOffset: selector.arrowOffsetX,
            items: ['Loading courses...'],
            initialIndex: 0,
            onIndexChange: (index) => {
                this.onCourseChanged(index)
            },
            arrowStyle: {
                fontSize: UI_TEXT_STYLES.courseSelector.fontSize as string,
                color: UI_COLORS.arrowNormal,
                fontFamily: UI_TEXT_STYLES.courseSelector.fontFamily as string,
            },
            labelStyle: {
                fontSize: UI_TEXT_STYLES.courseSelector.fontSize as string,
                color: UI_TEXT_STYLES.courseSelector.color as string,
                fontFamily: UI_TEXT_STYLES.courseSelector.fontFamily as string,
            },
        })

        this.container.add(this.courseSelector.container)
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
            if (this.scrollWindow?.canScrollUp()) {
                this.scrollWindow.scrollUp()
                this.selectedIndex = this.scrollWindow.getOffset()
                this.renderShopItems()
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
            if (this.scrollWindow?.canScrollDown()) {
                this.scrollWindow.scrollDown()
                this.selectedIndex =
                    this.scrollWindow.getOffset() + ITEMS_VISIBLE - 1
                this.renderShopItems()
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

        this.courseSelector?.destroy()
        this.courseSelector = null

        this.scrollWindow = null

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
        this.scrollUpIndicator = null
        this.scrollDownIndicator = null
        this.itemButtons = []
        this.shopItems = []
        this.courses = []
    }

    private async fetchCoins(): Promise<void> {
        try {
            this.playerCoins = await getStudentPoints(this.userEmail)
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
            this.courses = await getStudentCourses()

            if (this.courses.length === 0) {
                this.courseSelector?.setItems(['No courses'])
                this.loadingText?.setText('Not registered for any courses')
                return
            }

            const courseTitles = this.courses.map((c) => c.title)
            this.courseSelector?.setItems(courseTitles)
            await this.fetchShopItems()
        } catch (error) {
            console.error('Failed to fetch courses:', error)
            this.courseSelector?.setItems(['Error loading courses'])
        }
    }

    private async fetchShopItems(): Promise<void> {
        if (this.courses.length === 0) return

        const currentIndex = this.courseSelector?.getIndex() ?? 0
        const courseId = this.courses[currentIndex].id

        try {
            this.loadingText?.setText('Loading shop items...')
            this.loadingText?.setVisible(true)

            this.shopItems = await getShopItems(courseId)

            this.loadingText?.setVisible(false)

            // Create scroll window
            this.scrollWindow = createScrollWindow({
                items: this.shopItems,
                maxVisible: ITEMS_VISIBLE,
                onScrollChange: () => {
                    this.renderShopItems()
                },
            })

            this.navigation?.setItemCount(
                Math.min(this.shopItems.length, ITEMS_VISIBLE)
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
        if (!this.itemsContainer || !this.scrollWindow) return

        this.itemButtons = renderShopItems({
            scene: this.scene,
            container: this.itemsContainer,
            allItems: this.shopItems,
            visibleItems: this.scrollWindow.getVisibleItems(),
            scrollOffset: this.scrollWindow.getOffset(),
            selectedIndex: this.selectedIndex,
            playerCoins: this.playerCoins,
            onPurchase: (item) => this.purchaseItem(item),
            onHover: (globalIndex) => {
                this.selectedIndex = globalIndex
                this.updateHighlight()
            },
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
            const result = await purchaseReward(item.id)

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
