import {type Scene} from './Scene'
import {UIManager} from '@/utils/uiManager'
import {RewardPointsUI} from '@/utils/rewardPointsUI'

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
        // fools typescript through double casting, probably not great >:(
        this.rewardPointsUI = new RewardPointsUI(this)
        this.uiManager = new UIManager(this)

        // gets the currently active scene
        if (data && data.worldScene) {
            this.setGameScene(data.worldScene)
        }

        this.uiManager.initialize()

        // listen for scene transitions
        this.events.on('update-world-reference', (newScene: Scene) => {
            this.setGameScene(newScene)
        })
    }

    private setGameScene(newScene: Scene): void {
        // 1. CLEANUP OLD LISTENERS
        if (this.gameScene) {
            this.gameScene.events.off('update-points')
            this.gameScene.events.off('request-point-refresh') // <--- ADD THIS
        }

        this.gameScene = newScene

        // 2. ADD NEW LISTENERS
        if (this.gameScene) {
            // Existing listener
            this.gameScene.events.on('update-points', (points: number) => {
                this.rewardPointsUI.animatePointsChange(points)
            })

            // NEW: Listen for refresh requests from the world
            this.gameScene.events.on('request-point-refresh', () => {
                this.refreshRewardPoints()
            })

            // Initial fetch
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
}
