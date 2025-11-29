// interactions/styles/chalkboardStyles.ts

export const chalkboardStyles = {
    // Screen dimensions
    interfaceWidthRatio: 0.8,
    interfaceHeightRatio: 0.8,

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
    },

    // Layout
    layout: {
        borderWidth: 16,
        padding: 36,
        titleOffsetX: 24,
        titleOffsetY: 40,
        listStartY: 140, // offset from top
        rowSpacing: 70,
        doneColumnOffsetX: 20, // offset from right edge
        doneLabelOffsetY: 35, // offset above first row (rowSpacing / 2)
        maxTextMargin: 40, // space between text and Done column
    },

    // Typography
    typography: {
        titleSize: '36px',
        questSize: '28px',
        doneLabelSize: '28px',
        emptyMessageSize: '28px',
        fontFamily: 'Arial, sans-serif',
    },

    // Selector
    selector: {
        size: 28,
        strokeWidth: 3,
        fillAlpha: 0,
    },

    // Animations
    animations: {
        tickScale: {
            from: 0.6,
            to: 1,
        },
        tickDuration: 220,
        tickEase: 'Back.Out',
    },

    // Depths (z-index equivalents)
    depths: {
        overlay: 3000,
        border: 3000,
        background: 3001,
        text: 3002,
        selector: 3003,
        tickMark: 3004,
    },
} as const
