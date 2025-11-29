import type {UIScene} from '@/scenes/UIScene'
import {MenuOverlay} from './menuOverlay'
import {ShopOverlay} from './shopOverlay'
import {RewardsOverlay} from './rewardsOverlay'

export class UIManager {
    private scene: UIScene
    private menuOverlay: MenuOverlay | null = null
    private shopOverlay: ShopOverlay | null = null
    private rewardsOverlay: RewardsOverlay | null = null // 👈 Add

    private isMenuOpen: boolean = false
    private isShopOpen: boolean = false
    private isRewardsOpen: boolean = false // 👈 Add

    private keys: {
        up: Phaser.Input.Keyboard.Key
        down: Phaser.Input.Keyboard.Key
        left: Phaser.Input.Keyboard.Key
        right: Phaser.Input.Keyboard.Key
        w: Phaser.Input.Keyboard.Key
        s: Phaser.Input.Keyboard.Key
        a: Phaser.Input.Keyboard.Key
        d: Phaser.Input.Keyboard.Key
        enter: Phaser.Input.Keyboard.Key
        e: Phaser.Input.Keyboard.Key
        esc: Phaser.Input.Keyboard.Key
        q: Phaser.Input.Keyboard.Key
    } | null = null

    constructor(scene: UIScene) {
        this.scene = scene
    }

    public initialize(): void {
        this.menuOverlay = new MenuOverlay(this.scene)
        this.shopOverlay = new ShopOverlay(this.scene)
        this.rewardsOverlay = new RewardsOverlay(this.scene)
        this.setupInputs()
    }

    private setupInputs(): void {
        const keyboard = this.scene.input.keyboard!
        this.keys = {
            up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            enter: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
            e: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            esc: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
            q: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        }

        this.keys.up.on('down', () => this.handleUp())
        this.keys.w.on('down', () => this.handleUp())
        this.keys.down.on('down', () => this.handleDown())
        this.keys.s.on('down', () => this.handleDown())

        this.keys.left.on('down', () => this.handleLeft())
        this.keys.a.on('down', () => this.handleLeft())
        this.keys.right.on('down', () => this.handleRight())
        this.keys.d.on('down', () => this.handleRight())

        this.keys.enter.on('down', () => this.handleSelect())
        this.keys.e.on('down', () => this.handleSelect())
        this.keys.esc.on('down', () => this.handleEsc())
        this.keys.q.on('down', () => this.handleEsc())
    }

    private handleUp(): void {
        if (this.isShopOpen || this.isRewardsOpen) return
        if (this.isMenuOpen) this.menuOverlay?.navigateUp()
    }

    private handleDown(): void {
        if (this.isShopOpen || this.isRewardsOpen) return
        if (this.isMenuOpen) this.menuOverlay?.navigateDown()
    }

    private handleLeft(): void {
        if (this.isShopOpen) return
        if (this.isRewardsOpen) {
            this.rewardsOverlay?.navigateLeft()
            return
        }
    }

    private handleRight(): void {
        if (this.isShopOpen) return
        if (this.isRewardsOpen) {
            this.rewardsOverlay?.navigateRight()
            return
        }
    }

    private handleSelect(): void {
        if (this.isShopOpen || this.isRewardsOpen) return
        if (this.isMenuOpen) this.menuOverlay?.selectCurrent()
    }

    private handleEsc(): void {
        if (this.isShopOpen) return

        if (this.isRewardsOpen) {
            this.closeRewards()
            this.openMenu()
            return
        }

        if (this.isMenuOpen) {
            if (this.menuOverlay?.isSubScreenOpen()) {
                this.menuOverlay.closeSubScreen()
            } else {
                this.closeMenu()
            }
            return
        }

        if (this.scene.interactionHandler.isMovementBlocked()) return
        this.openMenu()
    }

    // generic menu controls
    public toggleMenu(): void {
        if (this.isMenuOpen) this.closeMenu()
        else this.openMenu()
    }

    public openMenu(): void {
        if (this.isMenuOpen || !this.menuOverlay) return
        if (this.isShopOpen || this.isRewardsOpen) return
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

    // shop controls
    public async openShop(): Promise<void> {
        if (this.isShopOpen || !this.shopOverlay) return
        if (this.isMenuOpen) this.closeMenu()

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

    // rewards controls
    public async openRewards(): Promise<void> {
        if (this.isRewardsOpen || !this.rewardsOverlay) return
        if (this.isMenuOpen) this.closeMenu()

        this.isRewardsOpen = true
        this.scene.getInputHandler().blockMovement()
        await this.rewardsOverlay.show()
    }

    public closeRewards(): void {
        if (!this.isRewardsOpen || !this.rewardsOverlay) return
        this.isRewardsOpen = false
        this.scene.getInputHandler().unblockMovement()
        this.rewardsOverlay.hide()
    }

    public destroy(): void {
        this.menuOverlay?.destroy()
        this.shopOverlay?.destroy()
        this.rewardsOverlay?.hide()

        this.menuOverlay = null
        this.shopOverlay = null
        this.rewardsOverlay = null

        if (this.keys) {
            Object.values(this.keys).forEach((key) => key.destroy())
            this.keys = null
        }
    }
}
