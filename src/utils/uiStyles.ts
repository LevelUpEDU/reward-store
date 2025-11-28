// hex strings: text colours
// hex numbers: Phaser elements
export const UI_COLORS = {
    gold: '#ffd700',
    white: '#ffffff',
    cyan: '#00ffff',
    yellow: '#ffff00',
    green: '#00ff00',
    red: '#ff0000',
    dimOverlay: 0x000000,
    dimOverlayAlpha: 0.3,
    selectedBg: '#00000088',
    hoverBgGold: '#ffd70044',
    hoverBgCyan: '#00ffff44',
    itemBg: 0x222222,
    itemBgSelected: 0x444444,
    itemBorder: 0x444444,
    buyButtonBg: '#00ff0088',
    cantAffordBg: '#ff444488',
    stockHigh: '#88ff88',
    stockLow: '#ff8888',
}

export const UI_FONTS = {
    primary: 'CyberPunkFont, Arial',
    fallback: 'Arial',
}

export const UI_FONT_SIZES = {
    title: '48px',
    menuItem: '36px',
    body: '32px',
    subtext: '28px',
    cost: '24px',
    stock: '20px',
    feedbackLarge: '56px',
    feedbackMedium: '40px',
}

const baseTextStyle = {
    fontFamily: UI_FONTS.primary,
}

// context dependent text styling (such as different styles for items that can be afforded in the store)
export const UI_TEXT_STYLES = {
    title: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.title,
        color: UI_COLORS.gold,
        fontStyle: 'bold' as const,
    },

    menuItem: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.menuItem,
        color: UI_COLORS.gold,
        fontStyle: 'bold' as const,
    },

    menuItemSelected: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.menuItem,
        color: UI_COLORS.white,
        backgroundColor: UI_COLORS.selectedBg,
        padding: {left: 12, right: 12, top: 4, bottom: 4},
    },

    body: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.body,
        color: UI_COLORS.white,
    },

    bodyWithWrap: (width: number) => ({
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.subtext,
        color: UI_COLORS.white,
        wordWrap: {width},
    }),

    coins: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.body,
        color: UI_COLORS.gold,
    },

    cost: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.cost,
        color: UI_COLORS.yellow,
    },

    backButton: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.title,
        color: UI_COLORS.gold,
    },

    backButtonCyan: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.title,
        color: UI_COLORS.cyan,
    },

    buyButton: (canAfford: boolean) => ({
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.subtext,
        color: UI_COLORS.white,
        backgroundColor:
            canAfford ? UI_COLORS.buyButtonBg : UI_COLORS.cantAffordBg,
        padding: {left: 20, right: 20, top: 10, bottom: 10},
    }),

    stock: (isLow: boolean) => ({
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.stock,
        color: isLow ? UI_COLORS.stockLow : UI_COLORS.stockHigh,
    }),

    purchaseSuccess: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.feedbackLarge,
        color: UI_COLORS.green,
        stroke: UI_COLORS.green,
        strokeThickness: 8,
    },

    purchaseError: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.feedbackMedium,
        color: UI_COLORS.red,
    },

    logoutFeedback: {
        fontFamily: UI_FONTS.fallback,
        fontSize: UI_FONT_SIZES.menuItem,
        color: '#ff4800',
        backgroundColor: '#000000dd',
        padding: {left: 20, right: 20, top: 10, bottom: 10},
    },
}

export const UI_DEPTH = {
    dimOverlay: 998,
    menuBackground: 999,
    subScreenBackground: 1000,
    menuContent: 1001,
    shopBackground: 1099,
    shopContent: 1100,
    feedback: 2000,
}

export const UI_BUTTON_PADDING = {
    normal: {left: 12, right: 12, top: 4, bottom: 4},
    large: {left: 20, right: 20, top: 10, bottom: 10},
}

export function createHoverHandlers(
    target: Phaser.GameObjects.Text,
    normalColor: string,
    hoverColor: string,
    hoverBgColor?: string
) {
    target.on('pointerover', () => {
        target.setColor(hoverColor)
        if (hoverBgColor) {
            target.setStyle({
                backgroundColor: hoverBgColor,
                padding: UI_BUTTON_PADDING.normal,
            })
        }
    })

    target.on('pointerout', () => {
        target.setColor(normalColor)
        target.setStyle({backgroundColor: undefined, padding: undefined})
    })
}

export function clearTextStyle(
    text: Phaser.GameObjects.Text,
    baseStyle: object
) {
    text.setStyle({
        ...baseStyle,
        backgroundColor: undefined,
        padding: undefined,
    })
}
