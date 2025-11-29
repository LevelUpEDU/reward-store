export const UI_SCREEN = {
    width: 1920,
    height: 1080,
    centerX: 960,
    centerY: 540,
}

export const UI_POSITIONS = {
    dimOverlay: {
        x: UI_SCREEN.centerX,
        y: UI_SCREEN.centerY,
        width: UI_SCREEN.width,
        height: UI_SCREEN.height,
    },

    menu: {
        background: {x: 700, y: 100, scale: 2.5},
        items: [
            {x: 870, y: 315}, // REWARDS
            {x: 870, y: 425}, // ACHIEVEMENTS
            {x: 870, y: 540}, // BADGES
            {x: 870, y: 650}, // SHOP
            {x: 870, y: 760}, // LOGOUT
        ],
    },

    subScreen: {
        container: {x: 700, y: 80},
        background: {x: 700, y: 100, scale: 2.5},
        title: {
            default: {x: 200, y: 60},
            achievements: {x: 130, y: 60},
        },
        content: {
            startX: 70,
            startY: 150,
            lineHeight: 60,
            wrapWidth: 400,
        },
        backButton: {x: 310, y: 760},
    },

    shop: {
        background: {x: 460, y: 100, scale: 2.5},
        title: {x: 630, y: 170},
        coins: {x: 645, y: 230},
        items: {
            startX: 553,
            startY: 360,
            height: 100,
            bgWidth: 890,
            bgHeight: 70,
            bgCenterX: 940,
            nameOffsetY: -25,
            costOffsetY: 5,
            stockOffsetX: 400,
            buyButtonOffsetX: 680,
        },
        backButton: {x: 940, y: 850},
        loading: {x: 630, y: 450},
        noItems: {x: 630, y: 450},
    },

    feedback: {
        x: UI_SCREEN.centerX,
        y: UI_SCREEN.centerY,
        animateOffsetY: -50,
        fadeOffsetY: -100,
    },
}
