// hex strings: text colours
// hex numbers: Phaser elements
export const UI_COLORS = {
    gold: '#ffd700',
    white: '#ffffff',
    cyan: '#00ffff',
    yellow: '#ffff00',
    green: '#00ff00',
    red: '#ff0000',
    orange: '#ff4800',
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
    buyButtonHover: '#ffffff44',
    stockHigh: '#88ff88',
    stockLow: '#ff8888',
    logoutBg: '#000000dd',
    arrowNormal: '#aaaaaa',
    arrowHover: '#ffffff',
    arrowDisabled: '#444444',
    courseName: '#00ffff',

    // reward status colours
    statusPending: '#ffff00',
    statusFulfilled: '#00ff00',
    headerText: '#aaaaaa',

    // keypad
    keypadBg: 0x3a4556,
    keypadBorder: 0x1a202c,
    keypadPadding: 0xe8e8e8,
    keypadDisplay: 0x3d4a5c,
    keypadDisplayBorder: 0x2d3748,
    keypadKey: 0xffffff,
    keypadKeyBorder: 0x94a3b8,
    keypadKeyText: '#2d3748',
    keypadEnter: 0x10b981,
    keypadEnterBorder: 0x065f46,
    keypadClose: 0xef4444,
    keypadCloseBorder: 0x7f1d1d,
    popupBg: 0x000000,
    popupBgAlpha: 0.9,
    success: '#10b981',
    error: '#ef4444',
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
    small: '18px',
    tiny: '14px',
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

    rewardHeader: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.small,
        color: UI_COLORS.headerText,
    },

    rewardName: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.small,
        color: UI_COLORS.white,
    },

    rewardQty: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.subtext,
        color: UI_COLORS.cyan,
    },

    rewardStatus: (status: string) => ({
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.stock,
        color:
            status === 'fulfilled' ?
                UI_COLORS.statusFulfilled
            :   UI_COLORS.statusPending,
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

    keypadTitle: {
        fontSize: '18px',
        color: UI_COLORS.gold,
        align: 'center' as const,
        fontStyle: 'bold' as const,
    },

    keypadDisplay: {
        fontSize: '32px',
        color: UI_COLORS.gold,
        fontFamily: 'Courier New',
        align: 'center' as const,
    },

    keypadKey: {
        fontSize: '18px',
        color: UI_COLORS.keypadKeyText,
        align: 'center' as const,
        fontStyle: 'bold' as const,
    },

    keypadButton: {
        fontSize: '16px',
        color: UI_COLORS.white,
        align: 'center' as const,
        fontStyle: 'bold' as const,
    },

    popupText: (color: string) => ({
        fontSize: '40px',
        color,
        align: 'center' as const,
    }),

    popupButton: {
        fontSize: '24px',
        color: UI_COLORS.white,
        align: 'center' as const,
        fontStyle: 'bold' as const,
    },
    courseSelector: {
        ...baseTextStyle,
        fontSize: UI_FONT_SIZES.body,
        color: UI_COLORS.cyan,
    },

    scrollIndicator: {
        ...baseTextStyle,
        fontSize: '32px',
        color: UI_COLORS.white,
    },

    scrollIndicatorDisabled: {
        ...baseTextStyle,
        fontSize: '32px',
        color: '#444444',
    },
}

export const UI_DEPTH = {
    dimOverlay: 998,
    menuBackground: 999,
    subScreenBackground: 1000,
    subScreenContent: 1001,
    menuContent: 1001,
    shopBackground: 1099,
    shopContent: 1100,
    feedback: 2000,
    keypad: 20000,
    keypadPopup: 20001,
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
