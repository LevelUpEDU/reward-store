/**
 * Pure rendering function for shop items
 * Separates rendering logic from shop overlay state management
 */

import type Phaser from 'phaser'
import {UI_COLORS, UI_TEXT_STYLES} from '../styles/uiStyles'
import {UI_POSITIONS} from '../styles/uiPositions'
import type {ShopItem} from '@/data/api/shop'

export interface RenderShopItemsConfig {
    /** Phaser scene to create game objects in */
    scene: Phaser.Scene
    /** Container to add rendered items to */
    container: Phaser.GameObjects.Container
    /** All shop items (not just visible) */
    allItems: ShopItem[]
    /** Items currently visible in scroll window */
    visibleItems: ShopItem[]
    /** Current scroll offset */
    scrollOffset: number
    /** Currently selected item index (global, not visible) */
    selectedIndex: number
    /** Player's current coin balance */
    playerCoins: number
    /** Callback when user clicks purchase button */
    onPurchase: (item: ShopItem) => void
    /** Callback when user hovers over an item */
    onHover: (globalIndex: number) => void
}

/**
 * Renders shop items in a container
 * Returns array of item containers for external management (e.g., highlight updates)
 */
export function renderShopItems(
    config: RenderShopItemsConfig
): Phaser.GameObjects.Container[] {
    const {
        scene,
        container,
        allItems,
        visibleItems,
        scrollOffset,
        selectedIndex,
        playerCoins,
        onPurchase,
        onHover,
    } = config

    // Clear previous items
    container.removeAll(true)

    const items = UI_POSITIONS.shop.items
    const shop = UI_POSITIONS.shop

    // Handle empty state
    if (allItems.length === 0) {
        const noItems = scene.add.text(
            shop.noItems.x,
            shop.noItems.y,
            'No items available',
            UI_TEXT_STYLES.body
        )
        noItems.setOrigin(0.5)
        noItems.setScrollFactor(0)
        container.add(noItems)
        return []
    }

    const itemContainers: Phaser.GameObjects.Container[] = []

    // Render each visible item
    visibleItems.forEach((item, i) => {
        const globalIndex = i + scrollOffset
        const y = items.startY + i * items.height
        const itemContainer = scene.add.container(0, 0)

        // Background
        const bg = scene.add.rectangle(
            items.bgCenterX,
            y,
            items.bgWidth,
            items.bgHeight,
            globalIndex === selectedIndex ?
                UI_COLORS.itemBgSelected
            :   UI_COLORS.itemBg
        )
        bg.setStrokeStyle(1, UI_COLORS.itemBorder)
        bg.setScrollFactor(0)
        itemContainer.add(bg)

        // Item name
        const nameText = scene.add.text(
            items.startX,
            y + items.nameOffsetY,
            item.name,
            UI_TEXT_STYLES.body
        )
        nameText.setScrollFactor(0)
        itemContainer.add(nameText)

        // Cost
        const costText = scene.add.text(
            items.startX,
            y + items.costOffsetY,
            `${item.cost} coins`,
            UI_TEXT_STYLES.cost
        )
        costText.setScrollFactor(0)
        itemContainer.add(costText)

        // Stock indicator (if limited quantity)
        if (item.quantityLimit !== null && item.available !== null) {
            const isLow = item.available <= 3
            const stockText = scene.add.text(
                items.startX + items.stockOffsetX,
                y + items.stockOffsetY,
                `Left: ${item.available}`,
                UI_TEXT_STYLES.stock(isLow)
            )
            stockText.setOrigin(0, 0.5)
            stockText.setScrollFactor(0)
            itemContainer.add(stockText)
        }

        // Purchase button logic
        const canAfford = playerCoins >= item.cost
        const inStock = item.available === null || item.available > 0
        const canBuy = canAfford && inStock

        let buttonText = 'BUY'
        if (!inStock) {
            buttonText = 'SOLD OUT'
        } else if (!canAfford) {
            buttonText = 'NOT ENOUGH'
        }

        const buyBtn = scene.add.text(
            items.startX + items.buyButtonOffsetX,
            y,
            buttonText,
            UI_TEXT_STYLES.buyButton(canBuy)
        )
        buyBtn.setOrigin(0.5)
        buyBtn.setScrollFactor(0)

        if (canBuy) {
            buyBtn.setInteractive({useHandCursor: true})
            buyBtn.on('pointerdown', () => onPurchase(item))
            buyBtn.on('pointerover', () => {
                buyBtn.setStyle({backgroundColor: UI_COLORS.buyButtonHover})
                onHover(globalIndex)
            })
            buyBtn.on('pointerout', () => {
                buyBtn.setStyle({backgroundColor: UI_COLORS.buyButtonBg})
            })
        }
        itemContainer.add(buyBtn)

        itemContainers.push(itemContainer)
        container.add(itemContainer)
    })

    return itemContainers
}
