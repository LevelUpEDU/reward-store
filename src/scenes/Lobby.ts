import {Scene} from '@/scenes/Scene'
import type {MapConfig} from '@/types'
import {createTransaction, getRewardsByCourseWithStats} from '@/db'
// import {createCollisionBorders} from '@/utils/physics' // DISABLED: Commented out for now

export class Lobby extends Scene {
    private rewardsMap?: Phaser.Tilemaps.Tilemap
    private rewardsLayer?: Phaser.Tilemaps.TilemapLayer | null
    private rewardsVisible = false
    private interactKey?: Phaser.Input.Keyboard.Key
    private interactiveObject?:
        | Phaser.GameObjects.Image
        | Phaser.GameObjects.Rectangle
    private escKey?: Phaser.Input.Keyboard.Key
    // private portalCollisionGroup?: Phaser.Physics.Arcade.StaticGroup // DISABLED: Commented out for now
    private keypadInteractionZone?: Phaser.GameObjects.Rectangle

    // Navigation
    private menuItems: Phaser.GameObjects.Text[] = []
    private selectedIndex = 0
    private upKey?: Phaser.Input.Keyboard.Key
    private downKey?: Phaser.Input.Keyboard.Key
    private enterKey?: Phaser.Input.Keyboard.Key

    // Sub-screen state
    private subScreenVisible = false
    private subScreenTitle?: Phaser.GameObjects.Text
    private subScreenList?: Phaser.GameObjects.Text[]

    // Shop menu
    private shopMap?: Phaser.Tilemaps.Tilemap
    private shopLayer?: Phaser.Tilemaps.TilemapLayer | null
    private shopVisible = false
    private shopItems: Phaser.GameObjects.Text[] = []
    private shopBuyButtons: Phaser.GameObjects.Text[] = []
    private playerCoins = 0 // Starting coins
    private shopList?: string[] // Track shop items for this session
    private isShop = false // Track if current subscreen is SHOP

    // Sub-Screen Background
    private subScreenMap?: Phaser.Tilemaps.Tilemap
    private subScreenLayer?: Phaser.Tilemaps.TilemapLayer | null

    private backText?: Phaser.GameObjects.Text
    private backSelected = false

    // Rewards Overlay Menu Position (x/y per item)
    private readonly MENU_POSITIONS = [
        {x: 940, y: 315}, // REWARDS
        {x: 880, y: 425}, // ACHIEVEMENTS
        {x: 945, y: 540}, // BADGES
        {x: 970, y: 650}, // SHOP
        {x: 950, y: 765}, // LOGOUT
    ]

    private static readonly CONFIG: MapConfig = {
        name: 'lobby',
        tilemapPath: '/api/maps/lobby',
        tilesets: [
            {
                name: 'carpet_spritesheet',
                imagePath: '/assets/tilemaps/carpet_spritesheet.png',
                key: 'groundLayer',
            },
            {
                name: 'CGS_Urban_A5',
                imagePath: '/assets/tilemaps/CGS_Urban_A5.png',
                key: 'wallsLayer-2',
            },
            {
                name: 'Classroom Second Spritesheet 5',
                imagePath:
                    '/assets/tilemaps/Classroom Second Spritesheet 5.png',
                key: 'furnitureLayer-2',
            },
            {
                name: 'Room_Builder_free_32x32',
                imagePath: '/assets/tilemaps/Room_Builder_free_32x32.png',
                key: 'wallsLayer',
            },
            {
                name: 'Art Room Spritesheet 3',
                imagePath: '/assets/tilemaps/Art Room Spritesheet 3.png',
                key: 'furnitureLayer',
            },
            {
                name: 'Cafeteria First Spritesheet 1',
                imagePath: '/assets/tilemaps/Cafeteria First Spritesheet 1.png',
                key: 'extraLayer2',
            },
            {
                name: 'Cafeteria First Spritesheet 3',
                imagePath: '/assets/tilemaps/Cafeteria First Spritesheet 3.png',
                key: 'extraLayer4',
            },
            {
                name: 'chckerboard spritesheet',
                imagePath: '/assets/tilemaps/chckerboard spritesheet.png',
                key: 'extraLayer6',
            },
            {
                name: 'Chemistry Lab First Spritesheet 8',
                imagePath:
                    '/assets/tilemaps/Chemistry Lab First Spritesheet 8.png',
                key: 'propsLayer',
            },
            {
                name: 'Chemistry Lab Second Spritesheet 8',
                imagePath:
                    '/assets/tilemaps/Chemistry Lab Second Spritesheet 8.png',
                key: 'extraLayer3',
            },
            {
                name: 'Classroom Props Second Spritesheet 4',
                imagePath:
                    '/assets/tilemaps/Classroom Props Second Spritesheet 4.png',
                key: 'propsLayer-2',
            },
            {
                name: 'Computer Room Spritesheet 5',
                imagePath: '/assets/tilemaps/Computer Room Spritesheet 5.png',
                key: 'furnitureLayer-3',
            },
            {
                name: 'Principal Office Second Spritesheet 5',
                imagePath:
                    '/assets/tilemaps/Principal Office Second Spritesheet 5.png',
                key: 'extraLayer5',
            },
            {
                name: 'strokespritesheet20133',
                imagePath: '/assets/tilemaps/strokespritesheet20133.png',
                key: 'extraLayer1',
            },
        ],
        layers: [
            {name: 'ground', tilesetKey: 'groundLayer'},
            {name: 'walls', tilesetKey: 'wallsLayer'},
            {name: 'furniture', tilesetKey: 'furnitureLayer'},
            {name: 'props', tilesetKey: 'propsLayer'},
        ],
    }

    constructor() {
        super('LobbyScene', Lobby.CONFIG)
    }

    preload(): void {
        super.preload?.()

        // Load the font
        this.load.font(
            'CyberPunkFont',
            '/assets/fonts/CyberpunkCraftpixPixel.otf'
        )

        // Load the rewards map and its tileset
        this.load.tilemapTiledJSON('rewardsMap', '/assets/rewards/rewards.json')
        this.load.image(
            'Interface windows',
            '/assets/tilemaps/Interface windows.png'
        )

        // Load Rewards Sub Screen Background Map
        this.load.tilemapTiledJSON(
            'subScreenMap',
            '/assets/rewards/rewards_subscreen.json'
        )

        // Load Shop Background Map
        this.load.tilemapTiledJSON('shopMap', '/assets/rewards/shop.json')

        // Shop Background Tilesets:
        this.load.image('FrameMap', '/assets/tilemaps/FrameMap.png')
        this.load.spritesheet(
            'button_yellow_left',
            '/assets/tilemaps/button_yellow_left.png',
            {frameWidth: 32, frameHeight: 32}
        )
        this.load.image(
            'button_yellow_right',
            '/assets/tilemaps/button_yellow_right.png'
        )

        // Load keypad portal image
        this.load.image(
            'keypad-portal',
            '/assets/sprites/classroom/keypad_2.png'
        )

        // Load reward shop image
        this.load.image('reward-shop', '/assets/sprites/reward_shop.png')

        // Load portal rings spritesheet (5 frames horizontally, 32x32 each)
        this.load.spritesheet(
            'portal-rings',
            '/assets/sprites/classroom/portalRings2.png',
            {frameWidth: 32, frameHeight: 32}
        )
    }

    create(): void {
        this.cleanUp()
        super.create()
        this.setCameraResolution()
        this.welcomeText()
        this.defineSceneTransitions()
        this.setupRewardsOverlay()
        this.setupInteractiveObject()

        // Fetch coins using the existing reward system
        const userEmail = this.getUserEmail()

        if (this.rewardPointsUI) {
            this.rewardPointsUI.fetchAndUpdatePoints(userEmail).then((data) => {
                this.playerCoins = data.coins ?? data.points ?? 0
                console.log(
                    '%cCoins loaded from server:',
                    'color: gold; font-size: 16px;',
                    this.playerCoins
                )

                // If shop is already open, refresh it
                if (this.subScreenVisible && this.isShop) {
                    this.updateCoinsDisplay()
                    this.renderShopItems() // updates BUY buttons
                }
            })
        }

        // ---- Wait For The Font
        if (!this.cache.bitmapFont.exists('MyCustomFont')) {
            // If for some reason the font didn’t load yet, wait one frame.
            this.time.delayedCall(0, () => this.fontReady())
        } else {
            this.fontReady()
        }
    }

    private cleanUp(): void {
        this.upKey = undefined
        this.downKey = undefined
        this.enterKey = undefined
        this.subScreenMap = undefined
        this.escKey = undefined
        // Clear portal collision group - it will be recreated
        // this.portalCollisionGroup = undefined // DISABLED: Commented out for now
    }

    private fontReady(): void {
        this.welcomeText()
        this.defineSceneTransitions()
        this.setupRewardsOverlay()
        this.setupInteractiveObject()
    }

    private setupRewardsOverlay(): void {
        // Initialize escKey if not already set
        if (!this.escKey) {
            this.escKey = this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.ESC
            )
        }

        // Remove any existing listeners to prevent duplicates
        this.escKey.off('down')
        this.escKey.on('down', () => {
            if (this.subScreenVisible) {
                this.closeSubScreen()
            } else if (this.rewardsVisible) {
                this.rewardsVisible = false
                this.hideRewardsOverlay()
            }
        })
    }

    private showRewardsOverlay(): void {
        // background UI

        // DESTROY FIRST
        if (this.rewardsMap) {
            this.rewardsMap = undefined
        }

        if (!this.rewardsMap) {
            this.rewardsMap = this.make.tilemap({key: 'rewardsMap'})

            const tileset = this.rewardsMap.addTilesetImage('Interface windows')
            if (!tileset) {
                console.error('Tileset missing')
                return
            }

            this.rewardsLayer = this.rewardsMap.createLayer(
                'base_layer',
                tileset,
                0,
                0
            )
            this.rewardsLayer!.setScrollFactor(0)
                .setScale(2.5)
                // .setAlpha(0.9)
                .setPosition(700, 100)
        } else {
            this.rewardsLayer?.setVisible(true)
        }

        // ---------- styles ----------
        const normalStyle = {
            fontFamily: 'CyberPunkFont',
            fontSize: '36px',
            color: '#ffd700',
            fontStyle: 'bold' as const,
            align: 'left' as const,
        }

        // DESTROY OLD MENU ITEMS
        this.menuItems.forEach((item) => item.destroy())
        this.menuItems = []

        // ALWAYS RECREATE
        const labels = ['REWARDS', 'ACHIEVEMENTS', 'BADGES', 'SHOP', 'LOGOUT']
        labels.forEach((txt, i) => {
            const pos = this.MENU_POSITIONS[i]
            const item = this.add
                .text(pos.x, pos.y, txt, normalStyle)
                .setScrollFactor(0)
            this.menuItems.push(item)
        })

        this.highlightSelected()
        this.setupMenuControls()
    }

    private hideRewardsOverlay(): void {
        this.rewardsLayer?.setVisible(false)
        this.menuItems.forEach((t) => t.setVisible(false))
        this.closeSubScreen() // ensures sub-screen is gone
    }

    private highlightSelected(): void {
        const normal = {
            color: '#ffd700',
            backgroundColor: undefined,
            padding: undefined,
        }
        const sel = {
            color: '#ffffff',
            backgroundColor: '#00000088',
            padding: {left: 12, right: 12, top: 4, bottom: 4},
        }

        this.menuItems.forEach((item, i) => {
            if (i === this.selectedIndex) {
                item.setStyle(sel)
            } else {
                item.setStyle(normal)
            }
        })
    }

    private setupMenuControls(): void {
        // create keys once
        if (!this.upKey)
            this.upKey = this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.UP
            )
        if (!this.downKey)
            this.downKey = this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.DOWN
            )
        if (!this.enterKey)
            this.enterKey = this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.ENTER
            )
        // also support SPACE
        const spaceKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        )

        // remove old listeners (prevents duplicates)
        this.upKey.off('down')
        this.downKey.off('down')
        this.enterKey.off('down')
        spaceKey.off('down')

        this.upKey.on('down', () => {
            if (!this.rewardsVisible) return
            this.selectedIndex =
                (this.selectedIndex - 1 + this.menuItems.length) %
                this.menuItems.length
            this.highlightSelected()
        })

        this.downKey.on('down', () => {
            if (!this.rewardsVisible) return
            this.selectedIndex =
                (this.selectedIndex + 1) % this.menuItems.length
            this.highlightSelected()
        })

        const activate = () => {
            // if (!this.rewardsVisible) return;
            // const selected = this.menuItems[this.selectedIndex].text;
            if (!this.rewardsVisible || this.subScreenVisible) return

            const selected = this.menuItems[this.selectedIndex].text
            this.openSubScreen(selected)
        }
        this.enterKey.on('down', activate)
        spaceKey.on('down', activate)
    }

    private openSubScreen(category: string): void {
        if (this.subScreenVisible) return
        this.subScreenVisible = true
        this.backSelected = false // reset

        // ---- SUB-SCREEN BACKGROUND MAP ----
        if (!this.subScreenMap) {
            // Create the tilemap ONCE
            this.subScreenMap = this.make.tilemap({key: 'subScreenMap'})
            const tileset =
                this.subScreenMap.addTilesetImage('Interface windows')
            if (!tileset) {
                console.error('Sub-screen tileset missing')
                return
            }

            // Create the layer
            this.subScreenLayer = this.subScreenMap.createLayer(
                'base_layer',
                tileset,
                0,
                0
            )
            if (this.subScreenLayer) {
                this.subScreenLayer
                    .setScrollFactor(0)
                    .setScale(2.5) // same as main overlay
                    .setPosition(700, 120) // same position as main overlay
                    .setDepth(1000) // behind text
            }
        } else {
            // Already created, just show it
            this.subScreenLayer?.setVisible(true)
        }

        if (category === 'SHOP') {
            this.showShopBackground()
        }

        // Title
        this.subScreenTitle = this.add
            .text(900, 250, category, {
                fontFamily: 'CyberPunkFont',
                fontSize: '48px',
                color: '#ffd700',
                fontStyle: 'bold',
                align: 'center',
            })
            .setScrollFactor(0)
            .setDepth(1001)

        // Content list
        if (category === 'LOGOUT') {
            this.handleLogout()
            return
        }

        if (category === 'SHOP') {
            this.renderShopItems()
        } else {
            const data = this.getDataForCategory(category)
            this.subScreenList = []

            const startY = 350
            const lineHeight = 60
            data.forEach((item, i) => {
                const text = this.add
                    .text(770, startY + i * lineHeight, `• ${item}`, {
                        fontFamily: 'CyberPunkFont',
                        fontSize: '28px',
                        color: '#ffffff',
                        wordWrap: {width: 1000},
                    })
                    .setScrollFactor(0)
                    .setDepth(1001)
                this.subScreenList!.push(text)
            })
        }

        // ---- ADD BACK BUTTON ----
        this.isShop = category === 'SHOP'

        const backX = this.isShop ? 1170 : 1015
        const backColor = this.isShop ? '#00ffff' : '#ffd700' // Cyan for shop, red for others

        this.backText = this.add
            .text(backX, 840, 'BACK', {
                fontFamily: 'CyberPunkFont',
                fontSize: '48px',
                color: backColor,
                align: 'center',
            })
            .setScrollFactor(0)
            .setDepth(1001)
            .setOrigin(0.5, 0)
            .setInteractive({useHandCursor: true})

        // Click to go back
        this.backText.on('pointerdown', () => {
            this.closeSubScreen()
        })

        // Hover effect
        this.backText.on('pointerover', () => {
            this.backText!.setColor('#ffffff')
            this.backText!.setStyle({
                backgroundColor: this.isShop ? '#00ffff44' : '#ffd70044',
                padding: {left: 12, right: 12, top: 4, bottom: 4},
            })
        })
        this.backText.on('pointerout', () => {
            if (!this.backSelected) {
                this.backText!.setColor(this.isShop ? '#00ffff' : '#ffd700')
                this.backText!.setStyle({
                    backgroundColor: undefined,
                    padding: undefined,
                })
            }
        })

        // Initial style
        this.updateBackStyle()

        // ---- ESC TO CLOSE SUB-SCREEN ONLY ----
        this.input.keyboard!.off('keydown-ESC') // remove old
        this.input.keyboard!.once('keydown-ESC', () => {
            this.closeSubScreen()
        })

        // ---- RE-ENABLE MENU NAVIGATION WITH BACK SUPPORT ----
        this.setupSubScreenControls()
    }

    private showShopBackground(): void {
        if (this.shopMap) {
            this.shopLayer?.setVisible(true)
            return
        }

        this.shopMap = this.make.tilemap({key: 'shopMap'})

        const tilesets = [
            this.shopMap.addTilesetImage('FrameMap'),
            this.shopMap.addTilesetImage('button_yellow_left'),
            this.shopMap.addTilesetImage('button_yellow_right'),
        ]

        // Type guard + explicit Boolean() = ESLint + TS happy
        const validTilesets = tilesets.filter(
            (t): t is Phaser.Tilemaps.Tileset => Boolean(t)
        )

        if (validTilesets.length !== 3) {
            console.error('Shop tilesets missing!', tilesets.map(Boolean))
            return
        }

        this.shopLayer = this.shopMap
            .createLayer('base layer', validTilesets)
            ?.setScrollFactor(0)
            .setScale(2.5)
            .setPosition(680, 100)
            .setDepth(1000)
    }

    private async renderShopItems(): Promise<void> {
        // Clean previous - now destroys EVERYTHING
        this.shopItems.forEach((i) => i.destroy())
        this.shopBuyButtons.forEach((b) => b.destroy())
        this.shopItems = []
        this.shopBuyButtons = []

        const loading = this.add
            .text(900, 400, 'Loading shop...', {
                fontFamily: 'CyberPunkFont',
                fontSize: '36px',
                color: '#ffd700',
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001)
        this.shopItems.push(loading) // Track loading text too!

        try {
            const rewards = await getRewardsByCourseWithStats(19)
            const available = rewards.filter((r) => r.isAvailable)

            loading.destroy()
            this.shopItems = this.shopItems.filter((t) => t !== loading) // remove loading

            if (available.length === 0) {
                const noItems = this.add
                    .text(900, 400, 'No items in shop yet!', {
                        fontFamily: 'CyberPunkFont',
                        fontSize: '32px',
                        color: '#ff6666',
                    })
                    .setOrigin(0.5)
                    .setScrollFactor(0)
                    .setDepth(1001)
                this.shopItems.push(noItems)
                return
            }

            available.forEach((entry, i) => {
                const {reward} = entry
                const y = 350 + i * 90

                // Track ALL texts in this.shopItems
                const nameText = this.add
                    .text(770, y, reward.name, {
                        fontFamily: 'CyberPunkFont',
                        fontSize: '32px',
                        color: '#ffffff',
                        wordWrap: {width: 650},
                    })
                    .setScrollFactor(0)
                    .setDepth(1001)
                this.shopItems.push(nameText)

                const costText = this.add
                    .text(770, y + 35, `${reward.cost} coins`, {
                        fontFamily: 'CyberPunkFont',
                        fontSize: '24px',
                        color: '#ffff00',
                    })
                    .setScrollFactor(0)
                    .setDepth(1001)
                this.shopItems.push(costText)

                // Stock text (if limited)
                if (reward.quantityLimit !== null) {
                    const stockText = this.add
                        .text(770, y + 60, `Left: ${entry.available}`, {
                            fontFamily: 'CyberPunkFont',
                            fontSize: '20px',
                            color: entry.available! > 3 ? '#88ff88' : '#ff8888',
                        })
                        .setScrollFactor(0)
                        .setDepth(1001)
                    this.shopItems.push(stockText)
                }

                // Buy button (already tracked in shopBuyButtons)
                const canBuy = this.playerCoins >= reward.cost
                const btn = this.add
                    .text(1500, y + 25, canBuy ? 'BUY' : 'NOT ENOUGH', {
                        fontFamily: 'CyberPunkFont',
                        fontSize: '28px',
                        color: '#ffffff',
                        backgroundColor: canBuy ? '#00ff0088' : '#ff444488',
                        padding: {left: 20, right: 20, top: 10, bottom: 10},
                    })
                    .setOrigin(0.5)
                    .setScrollFactor(0)
                    .setDepth(1001)

                if (canBuy) {
                    btn.setInteractive({useHandCursor: true})
                    btn.on('pointerdown', () =>
                        this.buyItem(reward.id, reward.cost)
                    )
                    btn.on('pointerover', () =>
                        btn.setStyle({backgroundColor: '#ffffff44'})
                    )
                    btn.on('pointerout', () =>
                        btn.setStyle({backgroundColor: '#00ff0088'})
                    )
                }

                this.shopBuyButtons.push(btn)
            })

            this.updateCoinsDisplay()
        } catch (err) {
            console.error('Failed to load shop:', err)
            loading.setText('Error loading shop').setColor('#ff0000')
        }
    }

    private canAfford(price: number): boolean {
        return this.playerCoins >= price
    }

    private async buyItem(rewardId: number, price: number): Promise<void> {
        if (this.playerCoins < price) return

        const email = this.getUserEmail()
        if (!email) {
            alert('Not logged in!')
            return
        }

        // Optimistic update
        this.playerCoins -= price
        this.updateCoinsDisplay()

        try {
            // - Deducts points
            await createTransaction({
                email,
                points: -price,
                submissionId: 151,
            })

            // Success feedback
            const successText = this.add
                .text(960, 540, 'PURCHASED!', {
                    fontFamily: 'CyberPunkFont',
                    fontSize: '56px',
                    color: '#00ff00',
                    stroke: '#00ff00',
                    strokeThickness: 8,
                })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(2000)
                .setAlpha(0)

            // Animate in + fade out
            this.tweens.add({
                targets: successText,
                alpha: 1,
                scale: 1.3,
                y: '+= -50',
                duration: 400,
                ease: 'Power2',
                yoyo: true,
                hold: 600,
                onComplete: () => {
                    this.tweens.add({
                        targets: successText,
                        alpha: 0,
                        y: '-= 100',
                        duration: 600,
                        onComplete: () => successText.destroy(),
                    })
                },
            })

            // Optional: Flash effect
            this.cameras.main.flash(300, 0, 255, 0)

            // Refresh shop to update stock counts
            this.renderShopItems()

            console.log(`Bought reward #${rewardId} for ${price} coins`)
        } catch (error) {
            console.error('Purchase failed:', error)
            this.playerCoins += price
            this.updateCoinsDisplay()
            alert('Purchase failed — try again')
        }
    }

    private updateCoinsDisplay(): void {
        // Destroy Old Coins Text
        this.children.list.forEach((child) => {
            if (
                child instanceof Phaser.GameObjects.Text &&
                child.text.includes('Coins:')
            ) {
                child.destroy()
            }
        })

        // Create New Coins Text with Current playerCoins
        this.add
            .text(770, 760, `Coins: ${this.playerCoins}`, {
                fontFamily: 'CyberPunkFont',
                fontSize: '32px',
                color: '#ffd700',
            })
            .setScrollFactor(0)
            .setDepth(1001)
    }

    private setupSubScreenControls(): void {
        if (!this.upKey)
            this.upKey = this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.UP
            )
        if (!this.downKey)
            this.downKey = this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.DOWN
            )
        if (!this.enterKey)
            this.enterKey = this.input.keyboard!.addKey(
                Phaser.Input.Keyboard.KeyCodes.ENTER
            )
        const spaceKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        )

        // Remove old
        this.upKey.off('down')
        this.downKey.off('down')
        this.enterKey.off('down')
        spaceKey.off('down')

        this.upKey.on('down', () => {
            if (!this.subScreenVisible) return
            this.backSelected = false
            this.updateBackStyle()
            this.highlightSelected() // re-highlight main menu
        })

        this.downKey.on('down', () => {
            if (!this.subScreenVisible) return
            this.backSelected = true
            this.updateBackStyle()
            // dim main menu
            this.menuItems.forEach((item) => {
                item.setColor('#888888')
                item.setStyle({backgroundColor: undefined, padding: undefined})
            })
        })

        const activate = () => {
            if (!this.subScreenVisible) return
            if (this.backSelected) {
                this.closeSubScreen()
            }
        }
        this.enterKey.on('down', activate)
        spaceKey.on('down', activate)
    }

    private updateBackStyle(): void {
        if (!this.backText) return
        const selectedColor = '#ffffff'
        const selectedBg = this.isShop ? '#00ffff88' : '#ff480088'
        const normalColor = this.isShop ? '#00ffff' : '#ffd700'

        if (this.backSelected) {
            this.backText.setColor(selectedColor)
            this.backText.setStyle({
                backgroundColor: selectedBg,
                padding: {left: 12, right: 12, top: 4, bottom: 4},
            })
        } else {
            this.backText.setColor(normalColor)
            this.backText.setStyle({
                backgroundColor: undefined,
                padding: undefined,
            })
        }
    }

    private getDataForCategory(category: string): string[] {
        switch (category) {
            case 'REWARDS':
                return [
                    'Gold Star',
                    'Bonus Points: 500',
                    'Certificate of Excellence',
                ]
            case 'ACHIEVEMENTS':
                return [
                    'Completed Math Level 1',
                    'Solved 50 Puzzles',
                    'Perfect Score in Quiz #3',
                    'Helped 5 Classmates',
                    'Attendance Streak: 7 Days',
                ]
            case 'BADGES':
                return ['Math Master', 'Science Star', 'History Hero']
            case 'SHOP':
                return [] // Empty - handled by renderShopItems()
            default:
                return ['No data available']
        }
    }

    private closeSubScreen(): void {
        if (!this.subScreenVisible) return
        this.subScreenVisible = false
        this.backSelected = false

        this.subScreenTitle?.destroy()
        this.subScreenList?.forEach((t) => t.destroy())
        this.backText?.destroy()

        // Shop Cleanup:
        this.shopItems.forEach((item) => item.destroy())
        this.shopBuyButtons.forEach((btn) => btn.destroy())

        //Destroy coins text too
        this.children.list.forEach((child) => {
            if (
                child instanceof Phaser.GameObjects.Text &&
                child.text.includes('Coins:')
            ) {
                child.destroy()
            }
        })

        this.isShop = false
        this.shopItems = []
        this.shopBuyButtons = []
        this.shopList = undefined

        this.subScreenTitle = undefined
        this.subScreenList = undefined
        this.backText = undefined

        this.subScreenLayer?.setVisible(false)
        this.shopLayer?.setVisible(false)

        // Re-highlight main menu
        this.highlightSelected()

        // Re-enable main menu navigation
        this.setupMenuControls()
    }

    private setCameraResolution(): void {
        const cam = this.cameras.main
        const lobbyWidth = 1920
        const lobbyHeight = 1080

        this.scale.resize(lobbyWidth, lobbyHeight)
        this.scale.displaySize.setAspectRatio(lobbyWidth / lobbyHeight)
        this.scale.refresh()

        cam.setViewport(0, 0, lobbyWidth, lobbyHeight)

        // Zoom OUT to see more of the map
        cam.setZoom(0.8) // 0.5 = zoomed out, 1 = normal, 2 = zoomed in
        cam.startFollow(this.player, true, 0.1, 0.1) // smooth follow
    }

    private welcomeText(): void {
        // Example: Add custom text or interactions
        const text = this.add.text(1000, 100, 'Welcome to the Lobby!\nKD', {
            fontFamily: 'CyberPunkFont',
            fontSize: '60px',
            color: '#fff',
        })
        text.setScrollFactor(1)
    }

    private defineSceneTransitions(): void {
        const portals = [
            {x: 400, y: 400, width: 64, height: 64, target: 'ClassroomScene'},
        ]

        portals.forEach((portal) => {
            // Create animated portal sprite instead of green rectangle
            const portalSprite = this.add.sprite(
                portal.x,
                portal.y,
                'portal-rings'
            )
            portalSprite.setDisplaySize(portal.width, portal.height)
            portalSprite.setDepth(0) // Behind player so player walks over it

            // Create animation from spritesheet (5 frames)
            if (!this.anims.exists('portal-spin')) {
                this.anims.create({
                    key: 'portal-spin',
                    frames: this.anims.generateFrameNumbers('portal-rings', {
                        start: 0,
                        end: 4,
                    }),
                    frameRate: 10, // 10 frames per second for smooth animation
                    repeat: -1, // Loop forever
                })
            }
            portalSprite.play('portal-spin')

            // Create collision borders (top, left, right - no bottom)
            // This prevents player from stepping on top or walking through sides
            // but allows approach from the bottom
            // DISABLED: Commented out for now as it's not stable yet
            /*
            // Use separate collision group for portals to avoid conflicts
            if (!this.portalCollisionGroup) {
                this.portalCollisionGroup = this.physics.add.staticGroup()
                if (this.player && this.player.body) {
                    this.physics.add.collider(this.player, this.portalCollisionGroup)
                }
            }
            const borders = createCollisionBorders(
                this,
                portal.x,
                portal.y,
                portal.width,
                portal.height,
                10 // border width
            )
            // Add borders to collision group
            borders.forEach((border) => {
                // Ensure border has physics body before adding to group
                if (border && border.body && this.portalCollisionGroup) {
                    this.portalCollisionGroup.add(border)
                }
            })
            */

            // Create invisible interaction zone for overlap detection
            const interactionZone = this.add.rectangle(
                portal.x,
                portal.y,
                portal.width,
                portal.height,
                0x00ff00,
                0 // Invisible
            )
            this.physics.add.existing(interactionZone, true)
            this.physics.add.overlap(
                this.player,
                interactionZone,
                () => {
                    this.transitionTo(portal.target)
                },
                undefined,
                this
            )
        })

        // Add hello portal near classroom portal
        this.createHelloPortal()
    }

    // Create hello popup portal - using chalkboard interaction system
    private createHelloPortal(): void {
        // Create the visual image - keypad portal
        const helloPortal = this.add.image(
            500, // Close to classroom portal (400)
            400, // Same Y as classroom portal
            'keypad-portal'
        )
        helloPortal.setDisplaySize(64, 64)
        helloPortal.setDepth(0) // Behind player so player walks over it

        // Create interaction zone (like chalkboard)
        const interactionZone = this.add.rectangle(
            500,
            400,
            64,
            64,
            0x00ff00,
            0 // Invisible
        )
        this.physics.add.existing(interactionZone, true)

        // Set interaction data (like chalkboard)
        const config = {
            name: 'Course Code Entry',
            type: 'keypad',
            tooltip: 'Press E to enter course code',
            canInteract: true,
        }
        interactionZone.setData('config', config)

        // Add to interaction group
        this.interactionHandler.interactionGroup.add(interactionZone)
    }

    private transitionTo(targetSceneKey: string): void {
        this.cameras.main.fadeOut(800, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(targetSceneKey, {restart: true})
        })
    }

    private setupInteractiveObject(): void {
        // Create reward shop image instead of red rectangle
        this.interactiveObject = this.add.image(
            600, // x position (adjust as needed)
            600, // y position (adjust as needed)
            'reward-shop'
        )
        this.interactiveObject.setDisplaySize(64, 64)
        this.interactiveObject.setDepth(0) // Behind player so player walks over it

        // Add physics to the object
        this.physics.add.existing(this.interactiveObject, true) // true = static object

        // Ensure the player is defined and has a physics body
        if (this.player && this.player.body) {
            // Add overlap detection between player and interactive object
            this.physics.add.overlap(
                this.player,
                this.interactiveObject,
                this.handleInteraction,
                undefined,
                this
            )
        } else {
            console.error('Player or player.body is not defined')
        }

        // DESTROY OLD KEY FIRST
        if (this.interactKey) {
            this.interactKey.off('down') // remove listeners
            this.input.keyboard!.removeKey(this.interactKey)
        }

        // ALWAYS CREATE FRESH
        // Initialize interactKey if not already set
        this.interactKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.E
        )

        // Remove any existing listeners to prevent duplicates
        this.interactKey.off('down')
        this.interactKey.on('down', () => {
            // Only trigger if overlapping
            if (
                this.physics.world.overlap(this.player, this.interactiveObject)
            ) {
                this.rewardsVisible = !this.rewardsVisible
                if (this.rewardsVisible) {
                    this.showRewardsOverlay()
                } else {
                    this.hideRewardsOverlay()
                }
            }
        })
    }

    private handleLogout(): void {
        const returnUrl = window.location.origin

        console.log(
            '%c[LOGOUT] User logged out successfully!',
            'color: #ff4800; font-size: 20px; font-weight: bold;'
        )

        // Optional: Visual feedback
        this.add
            .text(960, 540, 'Logging out...', {
                fontFamily: 'CyberPunkFont',
                fontSize: '48px',
                color: '#ff4800',
                backgroundColor: '#000000dd',
                padding: {left: 20, right: 20, top: 10, bottom: 10},
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(2000)

        // Close rewards overlay
        this.rewardsVisible = false
        this.hideRewardsOverlay()

        // Simulate delay + redirect (or real logout later)
        this.time.delayedCall(1500, () => {
            console.log(
                '%c[REDIRECT] Going back to login screen...',
                'color: #ffd700; font-size: 16px;'
            )

            window.location.href = `/auth/logout?returnTo=${returnUrl}`
        })
    }

    private handleInteraction(): void {
        // add later
    }
}
