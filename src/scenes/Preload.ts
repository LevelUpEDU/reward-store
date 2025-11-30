export class Preload extends Phaser.Scene {
    constructor() {
        super({key: 'Preload'})
    }

    preload(): void {
        // player sprite
        this.load.aseprite(
            'bob',
            '/assets/sprites/Bob_run_16x16-sheet.png',
            '/assets/sprites/Bob_run_16x16.json'
        )

        // main menu graphics
        this.load.image('mainMenu', '/assets/sprites/mainMenu.png')
        this.load.image('infoWindow', '/assets/sprites/infoWindow.png')
        this.load.image('shopMenu', '/assets/sprites/shopMenu.png')
        this.load.image(
            'btn_yellow_l',
            '/assets/sprites/button_yellow_left.png'
        )
        this.load.image(
            'btn_yellow_r',
            '/assets/sprites/button_yellow_right.png'
        )

        // coin asset for points display
        this.load.image('coin-icon', '/assets/sprites/coin.png')

        this.load.font(
            'CyberPunkFont',
            '/assets/fonts/CyberpunkCraftpixPixel.otf'
        )

        // apply filtering to textures
        this.load.on('complete', () => {
            const textureManager = this.textures
            const textureKeys = [
                'bob',
                'mainMenu',
                'infoWindow',
                'shopMenu',
                'btn_yellow_l',
                'btn_yellow_r',
                'coin-icon',
            ]

            textureKeys.forEach((key) => {
                const texture = textureManager.get(key)
                if (texture) {
                    texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
                }
            })
        })
    }

    create(): void {
        // create player animations
        if (!this.anims.exists('walk_right')) {
            this.anims.createFromAseprite('bob')
        }

        // start the game
        this.scene.start('LobbyScene')
    }
}
