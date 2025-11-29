import type {UIScene} from '@/scenes/UIScene'
import {
    UI_COLORS,
    UI_DEPTH,
    UI_TEXT_STYLES,
    createHoverHandlers,
} from '../styles/uiStyles'
import {UI_POSITIONS} from '../styles/uiPositions'

interface Course {
    id: number
    title: string
}

interface StudentRedemption {
    id: number
    rewardName: string
    status: 'pending' | 'fulfilled'
    quantity: number
}

export class RewardsOverlay {
    private scene: UIScene
    private container: Phaser.GameObjects.Container | null = null
    private isVisible: boolean = false

    private bg: Phaser.GameObjects.Image | null = null
    private windowBg: Phaser.GameObjects.Image | null = null
    private dimOverlay: Phaser.GameObjects.Rectangle | null = null

    // state
    private courses: Course[] = []
    private selectedCourseIndex: number = 0
    private redemptions: StudentRedemption[] = []
    private isLoading: boolean = false

    constructor(scene: UIScene) {
        this.scene = scene
    }

    public async show(): Promise<void> {
        if (this.isVisible) return
        this.isVisible = true

        this.scene.getInputHandler().blockMovement()

        this.createDimOverlay()
        this.createBackgrounds()

        const subPos = UI_POSITIONS.subScreen.container
        this.container = this.scene.add.container(subPos.x, subPos.y)
        this.container.setScrollFactor(0)
        this.container.setDepth(UI_DEPTH.subScreenContent)

        // static elements to render
        const sub = UI_POSITIONS.subScreen
        const title = this.scene.add.text(
            sub.title.rewards.x,
            sub.title.rewards.y,
            'REWARDS',
            UI_TEXT_STYLES.title
        )
        title.setScrollFactor(0)
        this.container.add(title)

        const backBtn = this.scene.add.text(
            sub.backButton.x,
            sub.backButton.y,
            'BACK',
            UI_TEXT_STYLES.backButton
        )
        backBtn.setOrigin(0.5)
        backBtn.setScrollFactor(0)
        backBtn.setInteractive({useHandCursor: true})
        backBtn.on('pointerdown', () => this.returnToMenu())
        createHoverHandlers(
            backBtn,
            UI_COLORS.gold,
            UI_COLORS.white,
            UI_COLORS.hoverBgGold
        )
        this.container.add(backBtn)

        await this.initRewards()
    }

    public hide(): void {
        if (!this.isVisible) return
        this.isVisible = false

        this.scene.getInputHandler().unblockMovement()

        this.container?.destroy()
        this.container = null

        this.bg?.destroy()
        this.bg = null

        this.windowBg?.destroy()
        this.windowBg = null

        this.dimOverlay?.destroy()
        this.dimOverlay = null
    }

    public navigateLeft(): void {
        if (this.courses.length > 1) {
            this.navigateCourse(-1)
        }
    }

    public navigateRight(): void {
        if (this.courses.length > 1) {
            this.navigateCourse(1)
        }
    }

    private returnToMenu(): void {
        this.scene.uiManager?.closeRewards()
        this.scene.uiManager?.openMenu()
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
        this.dimOverlay.on('pointerdown', () => this.returnToMenu())
    }

    private createBackgrounds(): void {
        const menuPos = UI_POSITIONS.menu.background
        this.bg = this.scene.add.image(menuPos.x, menuPos.y, 'mainMenu')
        this.bg.setOrigin(0, 0)
        this.bg.setScale(menuPos.scale)
        this.bg.setScrollFactor(0)
        this.bg.setDepth(UI_DEPTH.menuBackground)

        const subPos = UI_POSITIONS.subScreen.background
        this.windowBg = this.scene.add.image(subPos.x, subPos.y, 'infoWindow')
        this.windowBg.setOrigin(0, 0)
        this.windowBg.setScale(subPos.scale)
        this.windowBg.setScrollFactor(0)
        this.windowBg.setDepth(UI_DEPTH.subScreenBackground)
    }

    private async initRewards(): Promise<void> {
        // only fetch courses if we haven't
        if (this.courses.length === 0) {
            await this.fetchCourses()
        }
        await this.fetchRedemptions()
        this.renderContent()
    }

    private async fetchCourses(): Promise<void> {
        try {
            const response = await fetch('/api/student/available-courses')
            if (!response.ok) throw new Error('Failed to fetch courses')

            const allCourses = await response.json()
            this.courses = allCourses
                .filter((c: {isRegistered: boolean}) => c.isRegistered)
                .map((c: any) => ({id: c.id, title: c.title}))

            if (this.selectedCourseIndex >= this.courses.length) {
                this.selectedCourseIndex = 0
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error)
            this.courses = []
        }
    }

    private async fetchRedemptions(): Promise<void> {
        if (this.courses.length === 0) return
        this.isLoading = true

        try {
            const courseId = this.courses[this.selectedCourseIndex].id
            const response = await fetch(
                `/api/student/redemptions?courseId=${courseId}`
            )
            if (response.ok) {
                this.redemptions = await response.json()
            } else {
                this.redemptions = []
            }
        } catch (error) {
            this.redemptions = []
        }
        this.isLoading = false
    }

    private async navigateCourse(direction: number): Promise<void> {
        if (this.courses.length <= 1) return

        this.selectedCourseIndex =
            (this.selectedCourseIndex + direction + this.courses.length) %
            this.courses.length

        this.hide()

        await this.show()
    }

    private renderContent(): void {
        if (!this.container) return

        const rewardsConfig = UI_POSITIONS.subScreen.rewards

        // course selector
        if (this.courses.length > 0) {
            const selector = rewardsConfig.courseSelector
            const courseTitle = this.courses[this.selectedCourseIndex].title

            const leftArrow = this.scene.add.text(
                selector.labelX - selector.arrowOffset,
                selector.y,
                '◀',
                UI_TEXT_STYLES.courseSelector
            )
            leftArrow.setOrigin(0.5).setInteractive({useHandCursor: true})
            leftArrow.on('pointerdown', () => this.navigateCourse(-1))
            this.container.add(leftArrow)

            const nameText = this.scene.add.text(
                selector.labelX,
                selector.y,
                courseTitle,
                UI_TEXT_STYLES.courseSelector
            )
            nameText.setOrigin(0.5)
            this.container.add(nameText)

            const rightArrow = this.scene.add.text(
                selector.labelX + selector.arrowOffset,
                selector.y,
                '▶',
                UI_TEXT_STYLES.courseSelector
            )
            rightArrow.setOrigin(0.5).setInteractive({useHandCursor: true})
            rightArrow.on('pointerdown', () => this.navigateCourse(1))
            this.container.add(rightArrow)
        }

        const headers = rewardsConfig.headers
        this.container.add(
            this.scene.add.text(
                headers.nameX,
                headers.y,
                'ITEM',
                UI_TEXT_STYLES.rewardHeader
            )
        )
        this.container.add(
            this.scene.add.text(
                headers.qtyX,
                headers.y,
                'QTY',
                UI_TEXT_STYLES.rewardHeader
            )
        )
        this.container.add(
            this.scene.add.text(
                headers.statusX,
                headers.y,
                'STATUS',
                UI_TEXT_STYLES.rewardHeader
            )
        )

        if (this.isLoading) {
            this.container.add(
                this.scene.add
                    .text(
                        rewardsConfig.loading.x,
                        rewardsConfig.loading.y,
                        'Loading...',
                        UI_TEXT_STYLES.body
                    )
                    .setOrigin(0.5)
            )
            return
        }

        if (this.redemptions.length === 0) {
            this.container.add(
                this.scene.add
                    .text(
                        rewardsConfig.empty.x,
                        rewardsConfig.empty.y,
                        'No rewards yet',
                        UI_TEXT_STYLES.body
                    )
                    .setOrigin(0.5)
            )
            return
        }

        this.redemptions
            .slice(0, rewardsConfig.list.maxVisible)
            .forEach((item, index) => {
                const y =
                    rewardsConfig.list.startY +
                    index * rewardsConfig.list.rowHeight
                this.container!.add(
                    this.scene.add.text(
                        rewardsConfig.list.nameX,
                        y,
                        item.rewardName,
                        UI_TEXT_STYLES.rewardName
                    )
                )
                this.container!.add(
                    this.scene.add.text(
                        rewardsConfig.list.qtyX,
                        y,
                        `${item.quantity}`,
                        UI_TEXT_STYLES.rewardQty
                    )
                )
                this.container!.add(
                    this.scene.add.text(
                        rewardsConfig.list.statusX,
                        y,
                        item.status.toUpperCase(),
                        UI_TEXT_STYLES.rewardStatus(item.status)
                    )
                )
            })
    }
}
