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
            {x: 775, y: 245}, // REWARDS
            {x: 775, y: 355}, // ACHIEVEMENTS
            {x: 775, y: 465}, // BADGES
            {x: 775, y: 575}, // SHOP
            {x: 775, y: 685}, // LOGOUT
        ],
    },

    subScreen: {
        container: {x: 700, y: 80},
        background: {x: 700, y: 100, scale: 2.5},
        title: {
            default: {x: 170, y: 25},
            achievements: {x: 95, y: 25},
            rewards: {x: 170, y: 25},
        },
        // generic content (ie., not rewards or store)
        content: {
            startX: 70,
            startY: 150,
            lineHeight: 60,
            wrapWidth: 400,
        },
        backButton: {x: 300, y: 720},

        rewards: {
            courseSelector: {
                y: 90,
                labelX: 300,
                arrowOffset: 260,
            },
            headers: {
                y: 150,
                nameX: 50,
                qtyX: 300,
                statusX: 400,
            },
            list: {
                startY: 190,
                rowHeight: 50,
                nameX: 50,
                qtyX: 315,
                statusX: 400,
                maxVisible: 8,
            },
            loading: {x: 240, y: 350},
            empty: {x: 240, y: 350},
        },
    },

    shop: {
        background: {
            x: 460,
            y: 100,
            scale: 2.5,
            width: 960,
            height: 800,
        },
        title: {x: 630, y: 170},
        coins: {x: 645, y: 230},
        courseSelector: {
            y: 270,
            arrowOffsetX: 400,
            labelX: 940,
            arrowHitArea: {width: 60, height: 60},
        },
        items: {
            startX: 553,
            startY: 360,
            height: 100,
            bgWidth: 860,
            bgHeight: 70,
            bgCenterX: 940,
            nameOffsetY: -25,
            costOffsetY: 5,
            stockOffsetX: 400,
            stockOffsetY: 15,
            buyButtonOffsetX: 680,
            maxVisible: 4,
        },
        backButton: {x: 940, y: 850},
        backButtonDecor: {
            scale: 2.5,
            totalWidth: 96,
            leftWidth: 64,
        },
        scrollIndicators: {
            x: 940,
            upY: 295,
            downY: 800,
        },
        loading: {x: 745, y: 450},
        noItems: {x: 745, y: 450},
    },

    feedback: {
        x: UI_SCREEN.centerX,
        y: UI_SCREEN.centerY,
        animateOffsetY: -50,
        fadeOffsetY: -100,
    },

    keypad: {
        scale: 1.0,
        padding: {width: 350, height: 570},
        area: {width: 330, height: 550},
        title: {offsetY: -200},
        display: {
            offsetY: -120,
            width: 300,
            height: 60,
        },
        keys: {
            width: 60,
            height: 50,
            spacingX: 80,
            spacingY: 60,
            startOffsetY: -40,
            grid: [
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['✕', '0', '⌫'],
            ],
        },
        actionButtons: {
            offsetY: 200,
            width: 100,
            height: 40,
            spacing: 120,
        },
        popup: {
            small: {width: 800, height: 250},
            large: {width: 900, height: 450},
            textOffsetY: -30,
            buttonOffsetY: 50,
            largeTextOffsetY: -50,
            largeButtonOffsetY: 120,
            buttonWidth: 150,
            buttonHeight: 50,
        },
    },
}
