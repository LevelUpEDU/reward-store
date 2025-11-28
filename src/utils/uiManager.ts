import type {Scene} from '@/scenes/Scene'
import type {UIScene} from '@/scenes/UIScene'
import {MenuOverlay} from './menuOverlay'
import {ShopOverlay} from './shopOverlay'

/**
 * Manages the main menu UI accessible to all screens
 */
export class UIManager {
    private scene: UIScene
    private menuOverlay: MenuOverlay | null = null
    private shopOverlay: ShopOverlay | null = null
    private isMenuOpen: boolean = false
    private isShopOpen: boolean = false

    constructor(scene: UIScene) {
        this.scene = scene
    }

    public initialize(): void {
        this.menuOverlay = new MenuOverlay(this.scene)
        this.shopOverlay = new ShopOverlay(this.scene)
        this.setupGlobalInputs()
    }

    private setupGlobalInputs(): void {
        // ESC toggles menu
        this.scene.input.keyboard!.on('keydown-ESC', () => {
            if (this.isShopOpen) {
                this.closeShop()
            } else {
                this.toggleMenu()
            }
        })
    }

    public toggleMenu(): void {
        if (this.isMenuOpen) {
            this.closeMenu()
        } else {
            this.openMenu()
        }
    }

    public openMenu(): void {
        if (this.isMenuOpen || !this.menuOverlay) return
        // dont open menu if shop is open
        if (this.isShopOpen) return
        if (this.scene.interactionHandler.isMovementBlocked()) return

        this.isMenuOpen = true
        this.scene.getInputHandler().blockMovement()
        this.menuOverlay.show()
    }

    public closeMenu(): void {
        if (!this.isMenuOpen || !this.menuOverlay) return

        this.isMenuOpen = false
        this.scene.getInputHandler().unblockMovement()
        this.menuOverlay.hide()
    }

    public isOpen(): boolean {
        return this.isMenuOpen
    }

    public async openShop(): Promise<void> {
        if (this.isShopOpen || !this.shopOverlay) return

        // close the menu if already open
        if (this.isMenuOpen) {
            this.closeMenu()
        }

        this.isShopOpen = true
        this.scene.getInputHandler().blockMovement()
        const userEmail = this.scene.getUserEmail()
        await this.shopOverlay.show(userEmail)
    }

    public closeShop(): void {
        if (!this.isShopOpen || !this.shopOverlay) return

        this.isShopOpen = false
        this.scene.getInputHandler().unblockMovement()
        this.shopOverlay.hide()
    }

    public isShopVisible(): boolean {
        return this.isShopOpen
    }

    public destroy(): void {
        this.menuOverlay?.destroy()
        this.shopOverlay?.destroy()
        this.menuOverlay = null
        this.shopOverlay = null
    }
}
