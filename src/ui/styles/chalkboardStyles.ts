// ui/styles/chalkboardStyles.ts

export const chalkboardStyles = {
    // Screen dimensions
    interfaceWidthRatio: 0.6,
    interfaceHeightRatio: 0.7,

    // Colors
    colors: {
        overlay: 0x000000,
        overlayAlpha: 0.7,
        border: 0x8b4513,
        background: 0x2d5016,
        titleText: '#ffffff',
        questText: '#ffffff',
        questTextSelected: '#ffff00',
        doneLabel: '#ffffff',
        tickMark: '#ffff00',
        selector: 0xffff00,
        selectorStroke: 0xffff00,
        claimedText: '#bdbdbd',
        claimButtonText: '#fff',
        claimButtonBg: '#2e7d32',
        confirmDialogBg: 0x222222,
        confirmDialogBorder: 0xffffff,
    },

    // Layout
    layout: {
        borderWidth: 16,
        padding: 120,
        titleOffsetX: 300, // Distance from left edge to title
        titleOffsetY: 60,
        subtitleOffsetY: 120, // Distance from top to subtitle
        listStartY: 220, // offset from top
        rowSpacing: 70,
        doneColumnOffsetX: 70, // offset from right edge
        doneLabelOffsetY: 35, // offset above first row (rowSpacing / 2)
        maxTextMargin: 40, // space between text and Done column
        emptyMessageOffsetY: 60, // Offset for "No quests available" message
        claimButtonOffsetX: 72, // Offset from doneX for claim button
        scrollArrowTopOffset: 12, // Distance above first quest for up arrow
        scrollArrowBottomOffset: 0.6, // Multiplier for bottom arrow position
    },

    // Board selector (arrows)
    boardSelector: {
        arrowOffset: 530, // Distance from center to arrows
        arrowSize: '72px',
        labelSize: '18px',
        adjacentLabelSize: '20px',
    },

    // Typography
    typography: {
        titleSize: '54px',
        subtitleSize: '36px',
        questSize: '28px',
        doneLabelSize: '28px',
        emptyMessageSize: '28px',
        scrollArrowSize: '32px',
        fontFamily: 'Arial, sans-serif',
    },

    // Selector
    selector: {
        size: 28,
        strokeWidth: 3,
        fillAlpha: 0,
    },

    // Confirm Dialog
    confirmDialog: {
        width: 360,
        height: 120,
        titleOffsetY: 20, // Distance above center for title
        buttonOffsetY: 24, // Distance below center for buttons
        buttonSpacing: 60, // Distance from center to each button
        selectedScale: 1.06,
        normalScale: 1,
    },

    // Claim Button
    claimButton: {
        padding: {left: 12, right: 12, top: 2, bottom: 2},
    },

    // Animations
    animations: {
        // Quest selection
        questScale: {
            selected: 1.06,
            normal: 1,
        },
        questScaleDuration: 120,
        questScaleEase: 'Quad.Out',

        // Tick mark appearance
        tickScale: {
            from: 0.5,
            to: 1,
        },
        tickDuration: 200,
        tickEase: 'Back.Out',

        // Arrow highlight
        arrowScale: {
            highlighted: 1.18,
            normal: 1,
        },
        arrowScaleDuration: 80,
        arrowScaleEase: 'Quad.Out',
    },

    // Depths (z-index equivalents)
    depths: {
        overlay: 3000,
        border: 3000,
        background: 3001,
        text: 3002,
        selector: 3003,
        tickMark: 3004,
        confirmDialog: 3010, // Above selector
        confirmDialogText: 3011,
    },
} as const
