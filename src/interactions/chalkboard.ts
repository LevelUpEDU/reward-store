/**
 * Chalkboard quest interface
 * Main entry point for the chalkboard interaction system
 */

import {interactionRegistry} from './interactionRegistry'
import {chalkboardStyles as styles} from '@/ui/styles/chalkboardStyles'
import {
    createInteractionInput,
    type InteractionInputControls,
} from '@/ui/input/interactionInputHandler'
import {
    createHorizontalSelector,
    type HorizontalSelectorControls,
} from '@/ui/components/horizontalSelector'
import {
    createScrollWindow,
    type ScrollWindowControls,
} from '@/ui/components/scrollWindow'
import type {Quest, Board} from './chalkboard/types'
import {loadQuests, fetchClaimedSubmissions} from './chalkboard/api'
import {createQuestList, type QuestListControls} from './chalkboard/questList'

// ============================================================================
// CONSTANTS
// ============================================================================

const VISIBLE_QUEST_COUNT = 5

// ============================================================================
// MAIN CHALKBOARD INTERACTION
// ============================================================================

interactionRegistry.register('chalkboard', async (worldScene, _data?) => {
    const scene = worldScene.scene.get('UIScene') as Phaser.Scene & {
        interactionHandler: {
            blockMovement: () => void
            unblockMovement: () => void
        }
    }

    scene.interactionHandler.blockMovement()

    const {width: screenWidth, height: screenHeight} = scene.scale
    const interfaceWidth = screenWidth * styles.interfaceWidthRatio
    const interfaceHeight = screenHeight * styles.interfaceHeightRatio
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const elements: Phaser.GameObjects.GameObject[] = []
    let inputControls: InteractionInputControls | null = null
    let questList: QuestListControls | null = null
    let boardSelector: HorizontalSelectorControls | null = null
    let scrollWindow: ScrollWindowControls<Quest> | null = null
    let boardElements: Phaser.GameObjects.GameObject[] = [] // Track board-specific elements
    let selectedQuestIndex = 0
    let activeBoard = 0
    let boards: Board[] = []
    let cleaned = false
    let loadingBoard = false // Prevent concurrent board switches

    // Get data
    const courseId = scene.registry.get('courseId')
    const studentEmail = scene.registry.get('userEmail') || ''

    const cleanup = () => {
        if (cleaned) return
        cleaned = true
        inputControls?.cleanup()
        questList?.destroy()
        boardSelector?.destroy()
        boardElements.forEach((el) => el.destroy())
        elements.forEach((el) => el.destroy())
        scene.interactionHandler.unblockMovement()
    }

    // Create UI layers
    const overlay = scene.add
        .rectangle(
            centerX,
            centerY,
            screenWidth,
            screenHeight,
            styles.colors.overlay,
            styles.colors.overlayAlpha
        )
        .setDepth(styles.depths.overlay)
        .setInteractive()

    overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (!border.getBounds().contains(pointer.x, pointer.y)) {
            cleanup()
        }
    })

    const border = scene.add
        .rectangle(
            centerX,
            centerY,
            interfaceWidth + styles.layout.borderWidth,
            interfaceHeight + styles.layout.borderWidth,
            styles.colors.border
        )
        .setDepth(styles.depths.border)

    const background = scene.add
        .rectangle(
            centerX,
            centerY,
            interfaceWidth,
            interfaceHeight,
            styles.colors.background
        )
        .setDepth(styles.depths.background)
        .setInteractive()

    const title = scene.add
        .text(
            centerX - interfaceWidth / 2 + styles.layout.titleOffsetX,
            centerY - interfaceHeight / 2 + styles.layout.titleOffsetY,
            'Loading...',
            {
                fontSize: styles.typography.titleSize,
                color: styles.colors.titleText,
                fontFamily: styles.typography.fontFamily,
            }
        )
        .setOrigin(0, 0.5)
        .setDepth(styles.depths.text)

    const subtitle = scene.add
        .text(
            centerX,
            centerY - interfaceHeight / 2 + styles.layout.subtitleOffsetY,
            '',
            {
                fontSize: styles.typography.subtitleSize,
                color: styles.colors.titleText,
                fontFamily: styles.typography.fontFamily,
            }
        )
        .setOrigin(0.5)
        .setDepth(styles.depths.text)

    elements.push(overlay, border, background, title, subtitle)

    // Layout positions
    const listStartX = centerX - interfaceWidth / 2 + styles.layout.padding
    const listStartY = centerY - interfaceHeight / 2 + styles.layout.listStartY
    const doneX =
        centerX +
        interfaceWidth / 2 -
        styles.layout.padding -
        styles.layout.doneColumnOffsetX

    // No course ID - show error
    if (!courseId) {
        title.setText('No Course Selected')
        const msg = scene.add
            .text(centerX, centerY, 'Please enter through the portal first.', {
                fontSize: styles.typography.emptyMessageSize,
                color: styles.colors.titleText,
                fontFamily: styles.typography.fontFamily,
            })
            .setOrigin(0.5)
            .setDepth(styles.depths.text)
        elements.push(msg)
        return
    }

    // Load quests
    const {course, quests} = await loadQuests(courseId, studentEmail)

    // Set title with fallback
    const courseTitle = course?.title || `Course ${courseId}`
    title.setText(`Quests for ${courseTitle}`)

    // Group into boards
    boards = [
        {name: 'Available', quests: quests.filter((q) => !q.submissionId)},
        {
            name: 'Submitted',
            quests: quests.filter(
                (q) => q.submissionId && q.submissionStatus === 'pending'
            ),
        },
        {
            name: 'Approved',
            quests: quests.filter(
                (q) => q.submissionId && q.submissionStatus === 'approved'
            ),
        },
    ]

    /**
     * Refresh boards from server (after quest submission)
     */
    const refreshBoards = async () => {
        const {course: freshCourse, quests: freshQuests} = await loadQuests(
            courseId,
            studentEmail
        )
        const courseTitle = freshCourse?.title || `Course ${courseId}`
        title.setText(`Quests for ${courseTitle}`)

        boards = [
            {
                name: 'Available',
                quests: freshQuests.filter((q) => !q.submissionId),
            },
            {
                name: 'Submitted',
                quests: freshQuests.filter(
                    (q) => q.submissionId && q.submissionStatus === 'pending'
                ),
            },
            {
                name: 'Approved',
                quests: freshQuests.filter(
                    (q) => q.submissionId && q.submissionStatus === 'approved'
                ),
            },
        ]
        showBoard(activeBoard)
    }

    // Create board selector (horizontal arrows)
    boardSelector = createHorizontalSelector({
        scene,
        centerX,
        centerY,
        arrowOffset: styles.boardSelector.arrowOffset,
        items: boards.map((b) => b.name),
        initialIndex: 0,
        depth: styles.depths.selector + 2,
        onIndexChange: (index) => {
            showBoard(index)
        },
        arrowStyle: {
            fontSize: styles.boardSelector.arrowSize,
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        },
        labelStyle: {
            fontSize: styles.boardSelector.labelSize,
            color: styles.colors.titleText,
            fontFamily: styles.typography.fontFamily,
        },
        adjacentLabelStyle: {
            fontSize: styles.boardSelector.adjacentLabelSize,
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        },
    })

    elements.push(boardSelector.container)

    /**
     * Show a specific board (Available, Submitted, or Approved)
     */
    const showBoard = async (index: number) => {
        // Prevent concurrent board switches
        if (loadingBoard) return
        loadingBoard = true

        try {
            activeBoard =
                ((index % boards.length) + boards.length) % boards.length
            selectedQuestIndex = 0

            // Update selector
            boardSelector?.setIndex(activeBoard)

            // Clean up previous board elements
            boardElements.forEach((el) => el.destroy())
            boardElements = []

            // Destroy old quest list
            questList?.destroy()
            questList = null

            const board = boards[activeBoard]
            subtitle.setText(`${board.name} (${board.quests.length})`)

            if (board.quests.length === 0) {
                const msg = scene.add
                    .text(
                        centerX,
                        listStartY + styles.layout.emptyMessageOffsetY,
                        'No quests available',
                        {
                            fontSize: styles.typography.emptyMessageSize,
                            color: styles.colors.titleText,
                            fontFamily: styles.typography.fontFamily,
                        }
                    )
                    .setOrigin(0.5)
                    .setDepth(styles.depths.text)
                boardElements.push(msg) // Add to boardElements instead of elements
                return
            }

            // Get claimed IDs for Approved board
            const claimedIds =
                board.name === 'Approved' ?
                    await fetchClaimedSubmissions(studentEmail)
                :   []

            // Done label for Available board ONLY
            if (board.name === 'Available') {
                const doneLabel = scene.add
                    .text(
                        doneX,
                        listStartY - (styles.layout.doneLabelOffsetY || 0),
                        'Done',
                        {
                            fontSize: styles.typography.doneLabelSize,
                            color: styles.colors.doneLabel,
                            fontFamily: styles.typography.fontFamily,
                        }
                    )
                    .setOrigin(0.5)
                    .setDepth(styles.depths.text)
                boardElements.push(doneLabel) // Add to boardElements instead of elements
            }

            // Create scroll window
            scrollWindow = createScrollWindow({
                items: board.quests,
                maxVisible: VISIBLE_QUEST_COUNT,
                onScrollChange: () => {
                    questList?.renderWindow()
                },
            })

            questList = createQuestList({
                scene,
                quests: board.quests,
                startX: listStartX,
                startY: listStartY,
                doneX,
                boardName: board.name,
                userEmail: studentEmail,
                claimedIds,
                scrollWindow,
                onQuestSubmitted: async () => {
                    await refreshBoards()
                },
            })

            questList.updateVisuals(0)
        } finally {
            loadingBoard = false
        }
    }

    // Input handling
    inputControls = createInteractionInput({
        scene,
        initialMode: 'navigation',
        handlers: {
            onNavigateUp: () => {
                if (!questList || questList.isDialogActive()) return
                const count = questList.getVisibleCount()
                if (count === 0) return

                if (selectedQuestIndex === 0 && scrollWindow?.canScrollUp()) {
                    scrollWindow.scrollUp()
                    questList.updateVisuals(0) // Keep highlight on first item
                    return
                }

                selectedQuestIndex = Math.max(0, selectedQuestIndex - 1)
                questList.updateVisuals(selectedQuestIndex)
            },
            onNavigateDown: () => {
                if (!questList || questList.isDialogActive()) return
                const count = questList.getVisibleCount()
                if (count === 0) return

                if (
                    selectedQuestIndex === count - 1 &&
                    scrollWindow?.canScrollDown()
                ) {
                    scrollWindow.scrollDown()
                    questList.updateVisuals(count - 1) // Keep highlight on last item
                    return
                }

                selectedQuestIndex = Math.min(count - 1, selectedQuestIndex + 1)
                questList.updateVisuals(selectedQuestIndex)
            },
            onNavigateLeft: () => {
                if (questList?.isDialogActive()) return
                boardSelector?.highlightArrow('left')
                boardSelector?.navigateLeft()
            },
            onNavigateRight: () => {
                if (questList?.isDialogActive()) return
                boardSelector?.highlightArrow('right')
                boardSelector?.navigateRight()
            },
            onSelect: () => {
                if (!questList || questList.isDialogActive()) return
                questList.toggleDone(selectedQuestIndex)
            },
            onClose: cleanup,
        },
    })

    // Show first board
    await showBoard(0)
})
