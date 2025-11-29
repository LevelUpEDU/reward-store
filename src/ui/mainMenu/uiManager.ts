import type {UIScene} from '@/scenes/UIScene'
import {MenuOverlay} from './menuOverlay'
import {ShopOverlay} from './shopOverlay'

export class UIManager {
    private scene: UIScene
    private menuOverlay: MenuOverlay | null = null
    private shopOverlay: ShopOverlay | null = null
    private isMenuOpen: boolean = false
    private isShopOpen: boolean = false

    private keys: {
        up: Phaser.Input.Keyboard.Key
        down: Phaser.Input.Keyboard.Key
        w: Phaser.Input.Keyboard.Key
        s: Phaser.Input.Keyboard.Key
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
        this.setupInputs()
    }

    private setupInputs(): void {
        this.keys = {
            up: this.scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.UP
            ),
            down: this.scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.DOWN
            ),
            w: this.scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.W
            ),
            s: this.scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.S
            ),
            enter: this.scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.ENTER
            ),
            e: this.scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.E
            ),
            esc: this.scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.ESC
            ),
            q: this.scene.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.Q
            ),
        }

        this.keys.up.on('down', () => this.handleUp())
        this.keys.w.on('down', () => this.handleUp())
        this.keys.down.on('down', () => this.handleDown())
        this.keys.s.on('down', () => this.handleDown())
        this.keys.enter.on('down', () => this.handleSelect())
        this.keys.e.on('down', () => this.handleSelect())
        this.keys.esc.on('down', () => this.handleEsc())
        this.keys.q.on('down', () => this.handleEsc())
    }

    private handleUp(): void {
        if (this.isShopOpen) {
            return
        } else if (this.isMenuOpen) {
            this.menuOverlay?.navigateUp()
        }
    }

    private handleDown(): void {
        if (this.isShopOpen) {
            return
        } else if (this.isMenuOpen) {
            this.menuOverlay?.navigateDown()
        }
    }

    private handleSelect(): void {
        if (this.isShopOpen) {
            return
        } else if (this.isMenuOpen) {
            this.menuOverlay?.selectCurrent()
        }
    }

    private handleEsc(): void {
        if (this.isShopOpen) {
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

        if (this.scene.interactionHandler.isMovementBlocked()) {
            return
        }

        this.openMenu()
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

        if (this.keys) {
            Object.values(this.keys).forEach((key) => key.destroy())
            this.keys = null
        }
    }
}
