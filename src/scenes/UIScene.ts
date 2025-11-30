import {type Scene} from './Scene'
import {UIManager} from '@/ui/mainMenu/uiManager'
import {RewardPointsUI} from '@/ui/rewardPointsUI'

export class UIScene extends Phaser.Scene {
    public gameScene!: Scene

    // keep these public, the menu elements need to be able to find each other
    public uiManager!: UIManager
    public rewardPointsUI!: RewardPointsUI

    // for the classrooms chalkboard
    public claimedSubmissionIds: string[] = []

    constructor() {
        super({key: 'UIScene'})
    }

    create(data: {worldScene: Scene}): void {
        this.rewardPointsUI = new RewardPointsUI(this)
        this.uiManager = new UIManager(this)
        this.cameras.main.setScroll(0, 0)
        this.cameras.main.setZoom(1)

        // gets the currently active scene
        if (data && data.worldScene) {
            this.setGameScene(data.worldScene)
        }

        this.uiManager.initialize()

        // listen for scene transitions
        this.events.on('update-world-reference', (newScene: Scene) => {
            this.setGameScene(newScene)
        })

        this.setupMobileMenuButton()
    }

    private setGameScene(newScene: Scene): void {
        if (this.gameScene) {
            this.gameScene.events.off('update-points')
            this.gameScene.events.off('request-point-refresh')
        }

        this.gameScene = newScene

        if (this.gameScene) {
            this.gameScene.events.on('update-points', (points: number) => {
                this.rewardPointsUI.animatePointsChange(points)
            })

            this.gameScene.events.on('request-point-refresh', () => {
                this.refreshRewardPoints()
            })

            this.refreshRewardPoints()
        }
    }

    // forward required functions from Scene

    public getUserEmail(): string {
        return this.registry.get('userEmail') || 'dev@example.com'
    }

    public get courseId(): number {
        return this.registry.get('courseId')
    }

    public getInputHandler() {
        return {
            blockMovement: () =>
                this.gameScene?.getInputHandler()?.blockMovement(),
            unblockMovement: () =>
                this.gameScene?.getInputHandler()?.unblockMovement(),
            releaseTarget: () =>
                this.gameScene?.getInputHandler()?.releaseTarget(),
        }
    }

    public get interactionHandler() {
        return {
            blockMovement: () =>
                this.gameScene?.interactionHandler?.blockMovement(),
            unblockMovement: () =>
                this.gameScene?.interactionHandler?.unblockMovement(),
            isMovementBlocked: () =>
                this.gameScene?.interactionHandler?.isMovementBlocked() ??
                false,
        }
    }

    public async refreshRewardPoints(): Promise<void> {
        const userEmail = this.getUserEmail()
        if (userEmail && this.rewardPointsUI) {
            await this.rewardPointsUI.fetchAndUpdatePoints(userEmail)
        }
    }

    // add a hamburger menu on mobile to open the menu
    protected setupMobileMenuButton(): void {
        // check touch capability before adding this menu
        if (!this.sys.game.device.input.touch) return

        const menuButton = this.add.text(20, 20, '☰', {
            fontSize: '48px',
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: {x: 12, y: 8},
        })

        menuButton.setScrollFactor(0)
        menuButton.setDepth(1000)
        menuButton.setInteractive({useHandCursor: true})

        menuButton.on('pointerdown', () => {
            this.uiManager?.toggleMenu()
        })
    }
}
