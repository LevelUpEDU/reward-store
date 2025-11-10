import {Scene} from '@/scenes/Scene'
import type {MapConfig} from '@/types'

export class Lobby extends Scene {
    private rewardsMap?: Phaser.Tilemaps.Tilemap
    private rewardsLayer?: Phaser.Tilemaps.TilemapLayer | null
    private rewardsVisible = false
    private interactKey?: Phaser.Input.Keyboard.Key
    private interactiveObject?: Phaser.GameObjects.Rectangle
    private escKey?: Phaser.Input.Keyboard.Key

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
    private playerCoins = 1000 // Starting coins
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
                imagePath: '/assets/tilemaps/carpet spritesheet.png',
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
    }

    create(): void {
        this.cleanUp()
        super.create()
        this.setCameraResolution()
        this.welcomeText()
        this.defineSceneTransitions()
        this.setupRewardsOverlay()
        this.setupInteractiveObject()

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

    private renderShopItems(): void {
        this.shopList = [
            'Energy Drink - 100 coins',
            'Double XP Boost - 250 coins',
            'Golden Skin - 500 coins',
            'Remove Ads - 1000 coins',
        ]

        const startY = 350
        const lineHeight = 70
        this.shopItems = []
        this.shopBuyButtons = []

        this.shopList.forEach((item, i) => {
            const yPos = startY + i * lineHeight

            // Shop item text (left side)
            const itemText = this.add
                .text(770, yPos, `• ${item}`, {
                    fontFamily: 'CyberPunkFont',
                    fontSize: '28px',
                    color: '#ffffff',
                    wordWrap: {width: 600}, // Limited width for buttons
                })
                .setScrollFactor(0)
                .setDepth(1001)
            this.shopItems.push(itemText)

            // Extract price for this item
            const price = parseInt(item.match(/(\d+)/)?.[1] || '0')

            // Buy button (right side)
            const buttonText = this.canAfford(price) ? 'BUY' : 'NOT ENOUGH'
            const buttonColor = this.canAfford(price) ? '#00ff00' : '#ff4444'

            const buyButton = this.add
                .text(1500, yPos + 10, buttonText, {
                    // +5 for vertical center
                    fontFamily: 'CyberPunkFont',
                    fontSize: '24px',
                    color: '#ffffff',
                    backgroundColor: buttonColor + '88',
                    padding: {left: 15, right: 15, top: 8, bottom: 8},
                })
                .setScrollFactor(0)
                .setDepth(1001)
                .setOrigin(0.5, 0.5)

            if (this.canAfford(price)) {
                buyButton.setInteractive({useHandCursor: true})
                buyButton.on('pointerdown', () => this.buyItem(i, price))
                buyButton.on('pointerover', () =>
                    buyButton.setStyle({backgroundColor: '#ffffff44'})
                )
                buyButton.on('pointerout', () =>
                    buyButton.setStyle({backgroundColor: buttonColor + '88'})
                )
            }

            this.shopBuyButtons.push(buyButton)
        })

        // Coins display
        this.updateCoinsDisplay()
    }

    private canAfford(price: number): boolean {
        return this.playerCoins >= price
    }

    private buyItem(index: number, price: number): void {
        if (this.playerCoins >= price) {
            this.playerCoins -= price

            // Update button to "BOUGHT"
            const button = this.shopBuyButtons[index]
            button.setText('BOUGHT')
            button.setStyle({
                color: '#888888',
                backgroundColor: '#44444488',
            })
            button.removeInteractive() // Disable clicks

            // Real-Time Coins Update
            this.updateCoinsDisplay()

            // Visual feedback
            button.setScale(1.2)
            this.tweens.add({
                targets: button,
                scale: 1,
                duration: 200,
                yoyo: true,
            })

            console.log(`Bought: ${this.shopList![index]} (${price} coins)`)
            console.log(`💰 Coins left: ${this.playerCoins}`)
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
            const rect = this.add.rectangle(
                portal.x,
                portal.y,
                portal.width,
                portal.height,
                0x00ff00,
                0.3
            )
            this.physics.add.existing(rect, true)
            this.physics.add.overlap(
                this.player,
                rect,
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
        const helloPortal = this.add.rectangle(
            500, // Close to classroom portal (400)
            400, // Same Y as classroom portal
            64,
            64,
            0xff0000, // RED color to distinguish from classroom portal
            0.3
        )
        this.physics.add.existing(helloPortal, true)

        // Create interaction zone (like chalkboard)
        const interactionZone = this.add.rectangle(
            500,
            400,
            64,
            64,
            0x00ff00,
            0
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
        // Create a rectangular object (you can replace with a sprite if desired)
        this.interactiveObject = this.add.rectangle(
            600, // x position (adjust as needed)
            600, // y position (adjust as needed)
            64, // width
            64, // height
            0xff0000, // red color for visibility
            0.5 // semi-transparent
        )

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
