/**
 * RewardPointsUI - A fixed UI component that displays the player's reward points balance
 * at the top right of the screen across all scenes.
 */
export class RewardPointsUI {
    private scene: Phaser.Scene
    private container: Phaser.GameObjects.Container
    private pointsText: Phaser.GameObjects.Text
    private currentPoints: number = 0
    private iconSprite: Phaser.GameObjects.Image
    private background: Phaser.GameObjects.Graphics

    constructor(scene: Phaser.Scene) {
        this.scene = scene

        this.container = this.scene.add.container(0, 0)
        this.container.setDepth(1000)

        this.createBackground()
        this.iconSprite = this.createIcon()
        this.pointsText = this.createText()

        this.positionUI()

        this.scene.scale.on('resize', this.positionUI, this)
    }

    private positionUI(): void {
        const x = 1920 - 160
        const y = 20
        this.container.setPosition(x, y)
    }

    private createBackground(): void {
        this.background = this.scene.add.graphics()

        // Draw rounded rectangle background
        this.background.fillStyle(0x3d2817, 0.9) // Brown color with transparency
        this.background.fillRoundedRect(0, 0, 140, 50, 10)

        // Add border
        this.background.lineStyle(2, 0x8b6f47, 1)
        this.background.strokeRoundedRect(0, 0, 140, 50, 10)

        this.container.add(this.background)
    }

    private createIcon(): Phaser.GameObjects.Image {
        // Check if the coin-icon texture is loaded, otherwise use a fallback
        let icon: Phaser.GameObjects.Image

        if (this.scene.textures.exists('coin-icon')) {
            icon = this.scene.add.image(25, 25, 'coin-icon')
            icon.setDisplaySize(32, 32) // Set to fixed size that fits the UI
        } else {
            // Fallback: create a simple circle as placeholder
            console.warn(
                '[RewardPointsUI] coin-icon texture not found, using fallback'
            )
            // Create a temporary texture with a circle
            const graphics = this.scene.make.graphics({x: 0, y: 0}, false)
            graphics.fillStyle(0xffd700, 1)
            graphics.fillCircle(16, 16, 16)
            graphics.generateTexture('coin-fallback', 32, 32)
            graphics.destroy()

            icon = this.scene.add.image(25, 25, 'coin-fallback')
            icon.setScale(0.6)
        }

        this.container.add(icon)
        return icon
    }

    private createText(): Phaser.GameObjects.Text {
        const text = this.scene.add.text(65, 25, '0', {
            fontSize: '28px',
            color: '#f4d03f',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
        })
        text.setOrigin(0, 0.5)
        this.container.add(text)
        return text
    }

    // private positionUI(): void {
    //     // Position at top right with some padding
    //     // Use the game's scale dimensions instead of camera
    //     const gameWidth = this.scene.scale.width
    //     const x = gameWidth - 160
    //     const y = 20
    //     this.container.setPosition(x, y)
    // }

    /**
     * Update the displayed points value
     */
    public setPoints(points: number): void {
        this.currentPoints = points
        this.pointsText.setText(points.toString())
    }

    /**
     * Fetch and update points from the API
     */
    public async fetchAndUpdatePoints(userEmail: string): Promise<any> {
        try {
            const response = await fetch(
                `/api/student/points?email=${encodeURIComponent(userEmail)}`
            )

            if (!response.ok) {
                console.warn(
                    '[RewardPointsUI] Failed to fetch points:',
                    response.statusText
                )
                return 0
            }

            const data = await response.json()
            this.setPoints(data.points || 0)
            return data
        } catch (error) {
            console.error('[RewardPointsUI] Error fetching points:', error)
            return 0
        }
    }

    /**
     * Animate points change (e.g., when earning or spending points)
     */
    public animatePointsChange(newPoints: number): void {
        const oldPoints = this.currentPoints
        const difference = newPoints - oldPoints

        // Flash effect
        this.scene.tweens.add({
            targets: this.pointsText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            onComplete: () => {
                this.setPoints(newPoints)
            },
        })

        // Show +/- indicator
        if (difference !== 0) {
            const indicator = this.scene.add.text(
                this.container.x + 70,
                this.container.y + 50,
                difference > 0 ? `+${difference}` : `${difference}`,
                {
                    fontSize: '20px',
                    color: difference > 0 ? '#00ff00' : '#ff0000',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 2,
                }
            )
            indicator.setScrollFactor(0)
            indicator.setDepth(1001)
            indicator.setOrigin(0.5, 0)

            this.scene.tweens.add({
                targets: indicator,
                y: indicator.y - 30,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    indicator.destroy()
                },
            })
        }
    }

    /**
     * Clean up the UI
     */
    public destroy(): void {
        this.scene.scale.off('resize', this.positionUI, this)
        this.container.destroy()
    }
}
