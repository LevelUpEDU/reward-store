import {interactionRegistry} from './interactionRegistry'
import {chalkboardStyles as styles} from './styles/chalkboardStyles'
import {createMenuNavigation} from '@/utils/menuNavigation'
import {loadQuests} from './utils/questData'
import {
    createOverlay,
    createBorder,
    createBackground,
    createTitle,
    createEmptyMessage,
    createQuestUI,
} from './utils/chalkboardUIHelpers'

interactionRegistry.register('chalkboard', async (scene, _data?) => {
    scene.interactionHandler.blockMovement()

    const {width: screenWidth, height: screenHeight} = scene.scale
    const interfaceWidth = screenWidth * styles.interfaceWidthRatio
    const interfaceHeight = screenHeight * styles.interfaceHeightRatio
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    const elements: Phaser.GameObjects.GameObject[] = []

    // Create base UI layers
    const overlay = createOverlay(
        scene,
        centerX,
        centerY,
        screenWidth,
        screenHeight
    )
    const border = createBorder(
        scene,
        centerX,
        centerY,
        interfaceWidth,
        interfaceHeight
    )
    const background = createBackground(
        scene,
        centerX,
        centerY,
        interfaceWidth,
        interfaceHeight
    )
    elements.push(overlay, border, background)

    // Create title (will update with course title after load)
    const title = createTitle(
        scene,
        centerX,
        centerY,
        interfaceWidth,
        interfaceHeight
    )
    elements.push(title)

    // Load and display quests (default courseId = 3)
    // Prefer passing a student identity from env for dev flow
    const devStudent =
        (process.env as any).DEV_STUDENT_EMAIL ?? 'zion_li@my.bcit.ca'
    const {course, quests} = await loadQuests(3, devStudent)
    const doneStates: boolean[] = quests.map((q) => Boolean(q.done))

    // If backend returned a course title, update the heading text
    if (course?.title) {
        title.setText(`Quests for ${course.title}`)
    }

    const listStartX = centerX - interfaceWidth / 2 + styles.layout.padding
    const listStartY = centerY - interfaceHeight / 2 + styles.layout.listStartY
    const doneX =
        centerX +
        interfaceWidth / 2 -
        styles.layout.padding -
        styles.layout.doneColumnOffsetX

    // Group quests into three boards using server-provided submission metadata:
    // Available = no submission, Submitted = submission exists and status === 'pending',
    // Approved = submission exists and status === 'approved'
    const boards: {name: string; quests: typeof quests}[] = [
        {
            name: 'Available',
            quests: quests.filter((q) => !q.submissionId) as typeof quests,
        },
        {
            name: 'Submitted',
            quests: quests.filter(
                (q) => q.submissionId && q.submissionStatus === 'pending'
            ) as typeof quests,
        },
        {
            name: 'Approved',
            quests: quests.filter(
                (q) => q.submissionId && q.submissionStatus === 'approved'
            ) as typeof quests,
        },
    ]

    let isClosed = false
    let cleanup = (nav?: any) => {
        if (nav) nav.cleanup()
        elements.forEach((el) => el.destroy())
        scene.interactionHandler.unblockMovement()
        isClosed = true
    }

    if (quests.length === 0) {
        elements.push(createEmptyMessage(scene, centerX, centerY))
        overlay.setInteractive()
        overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (!border.getBounds().contains(pointer.x, pointer.y)) {
                cleanup()
            }
        })
    } else {
        // current active board index
        let activeBoard = 0

        // container for current board UI elements & navigation
        let boardElements: Phaser.GameObjects.GameObject[] = []
        let boardNav: ReturnType<typeof createMenuNavigation> | null = null
        let boardQuestUI: ReturnType<typeof createQuestUI> | null = null

        // subtitle to show current board name (place below the main title)
        const titleSizeNum =
            parseFloat(String(styles.typography.titleSize)) || 24
        // compute Y based on title bounds so subtitle sits just below the heading
        let subtitleY = centerY - interfaceHeight / 2 + 24
        try {
            const tb = title.getBounds()
            subtitleY = tb.y + tb.height + 12 // small gap under title
        } catch (e) {
            /* fallback to previous position */
        }

        const subtitle = scene.add
            .text(centerX, subtitleY, '', {
                fontSize: `${Math.round(titleSizeNum * 0.6)}px`,
                color: styles.colors.titleText,
                fontFamily: styles.typography.fontFamily,
            })
            .setOrigin(0.5)
            .setDepth(styles.depths.text + 1)
        elements.push(subtitle)

        // clickable side arrows to switch boards with the mouse
        const arrowSize = Math.max(32, Math.round(titleSizeNum * 0.8))
        const arrowLeftX =
            centerX - interfaceWidth / 2 + styles.layout.padding / 2
        const arrowRightX =
            centerX + interfaceWidth / 2 - styles.layout.padding / 2
        const arrowY = centerY

        const leftArrow = scene.add
            .text(arrowLeftX, arrowY, '◀', {
                fontSize: `${arrowSize}px`,
                color: styles.colors.questText,
                fontFamily: styles.typography.fontFamily,
            })
            .setOrigin(0.5)
            .setDepth(styles.depths.selector + 2)
            .setInteractive({cursor: 'pointer'})

        const rightArrow = scene.add
            .text(arrowRightX, arrowY, '▶', {
                fontSize: `${arrowSize}px`,
                color: styles.colors.questText,
                fontFamily: styles.typography.fontFamily,
            })
            .setOrigin(0.5)
            .setDepth(styles.depths.selector + 2)
            .setInteractive({cursor: 'pointer'})

        // Hover effects
        leftArrow.on('pointerover', () => leftArrow.setScale(1.08))
        leftArrow.on('pointerout', () => leftArrow.setScale(1))
        rightArrow.on('pointerover', () => rightArrow.setScale(1.08))
        rightArrow.on('pointerout', () => rightArrow.setScale(1))

        // Click handlers respect dialog gating
        leftArrow.on(
            'pointerdown',
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData
            ) => {
                // prevent clicks from bubbling to the overlay which would close/cleanup the UI
                try {
                    event.stopPropagation()
                } catch (e) {
                    /* ignore */
                }
                if (boardQuestUI?.isDialogActive?.()) return
                switchBoard(activeBoard - 1)
            }
        )
        rightArrow.on(
            'pointerdown',
            (
                _pointer: Phaser.Input.Pointer,
                _localX: number,
                _localY: number,
                event: Phaser.Types.Input.EventData
            ) => {
                try {
                    event.stopPropagation()
                } catch (e) {
                    /* ignore */
                }
                if (boardQuestUI?.isDialogActive?.()) return
                switchBoard(activeBoard + 1)
            }
        )

        // Add to main elements so they are cleaned up with the overlay/border/title
        elements.push(leftArrow, rightArrow)

        const cleanupBoard = () => {
            if (boardNav) {
                try {
                    boardNav.cleanup()
                } catch (e) {
                    /* ignore */
                }
                boardNav = null
            }
            if (boardQuestUI) {
                // if questUI created elements are tracked in boardElements, destroy them
                boardQuestUI = null
            }
            boardElements.forEach((el) => el.destroy())
            boardElements = []
        }

        const showBoard = (index: number, fadeIn = false) => {
            // If the UI has been closed/cleaned up, avoid manipulating destroyed objects
            if (isClosed) return
            // wrap index
            const idx =
                ((index % boards.length) + boards.length) % boards.length
            activeBoard = idx

            cleanupBoard()

            const b = boards[activeBoard]
            subtitle.setText(`${b.name} (${b.quests.length})`)

            // prepare doneStates for this board
            const localDoneStates = b.quests.map((q) =>
                Boolean((q as any).done)
            )
            // Show Done column only when the active board is "Available" (index 0)
            // and there are available quests to act on.
            const showDone =
                activeBoard === 0 && (boards[0]?.quests?.length ?? 0) > 0

            // If Available board is empty, render a localized empty message inside the board
            if (activeBoard === 0 && b.quests.length === 0) {
                const emptyText = scene.add
                    .text(centerX, listStartY + 60, 'No quests available', {
                        fontSize: styles.typography.emptyMessageSize,
                        color: styles.colors.titleText,
                        fontFamily: styles.typography.fontFamily,
                    })
                    .setOrigin(0.5)
                    .setDepth(styles.depths.text + 1)
                boardElements.push(emptyText)
                elements.push(emptyText)
                // no navigation or quest UI in this case
            } else {
                boardQuestUI = createQuestUI(
                    scene,
                    b.quests,
                    localDoneStates,
                    listStartX,
                    listStartY,
                    doneX,
                    showDone
                )
                boardElements.push(...boardQuestUI.elements)
                elements.push(...boardQuestUI.elements)

                boardNav = createMenuNavigation({
                    scene,
                    itemCount: b.quests.length,
                    onSelectionChange: (idx) =>
                        boardQuestUI && boardQuestUI.updateVisuals(idx),
                    onSelect: (idx) =>
                        boardQuestUI && boardQuestUI.toggleDone(idx),
                    onClose: () => cleanup(boardNav || undefined),
                })

                if (typeof boardQuestUI.navigationSetter === 'function') {
                    boardQuestUI.navigationSetter(boardNav!)
                }
            }

            // make sure overlay closing cleans up boardNav as well
            overlay.setInteractive()
            try {
                // remove any previous pointerdown listeners to avoid duplicates while switching boards
                // GameObjects are EventEmitters so removeAllListeners is safe to call in Phaser
                // (wrapped in try/catch in case environment differs)
                ;(overlay as any).removeAllListeners &&
                    (overlay as any).removeAllListeners('pointerdown')
            } catch (e) {
                /* ignore */
            }
            overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (!border.getBounds().contains(pointer.x, pointer.y)) {
                    cleanup(boardNav || undefined)
                }
            })

            if (boardQuestUI) boardQuestUI.updateVisuals(0)

            // If requested, start new board at alpha 0 and fade it in
            if (fadeIn && boardElements.length > 0) {
                try {
                    boardElements.forEach((el) => {
                        try {
                            // some game objects support setAlpha
                            ;(el as any).setAlpha && (el as any).setAlpha(0)
                        } catch (e) {
                            /* ignore */
                        }
                    })
                    scene.tweens.add({
                        targets: boardElements,
                        alpha: 1,
                        duration: 240,
                        ease: 'Quad.Out',
                    })
                } catch (e) {
                    /* ignore */
                }
            }
        }

        // helper to perform a smooth switch between boards: fade out current then show next with fade-in
        const switchBoard = (targetIndex: number) => {
            // if a dialog is active, don't switch
            if (boardQuestUI?.isDialogActive?.()) return

            // normalize index
            const idx =
                ((targetIndex % boards.length) + boards.length) % boards.length

            // if nothing to fade (first render or no existing board elements), just show immediately
            if (!boardElements || boardElements.length === 0) {
                showBoard(idx, true)
                return
            }

            try {
                // fade out current board elements, then destroy and show the next board with fade-in
                scene.tweens.add({
                    targets: boardElements,
                    alpha: 0,
                    duration: 200,
                    ease: 'Quad.Out',
                    onComplete: () => {
                        try {
                            cleanupBoard()
                        } catch (e) {
                            /* ignore */
                        }
                        showBoard(idx, true)
                    },
                })
            } catch (e) {
                // fallback to immediate switch if tweens fail
                showBoard(idx, true)
            }
        }

        // board switching keys
        const leftKey = scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.LEFT
        )
        const rightKey = scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.RIGHT
        )
        const aKey = scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.A
        )
        const dKey = scene.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.D
        )

        // left = previous board, right = next board
        const nextBoard = () => switchBoard(activeBoard + 1)
        const prevBoard = () => switchBoard(activeBoard - 1)

        // Add both per-key listeners and a global fallback handler for robustness
        leftKey.on('down', prevBoard)
        rightKey.on('down', nextBoard)
        aKey.on('down', prevBoard)
        dKey.on('down', nextBoard)

        // Note: we rely on the per-key Phaser Key listeners (leftKey/rightKey/aKey/dKey)
        // and intentionally avoid registering a global 'keydown' handler to prevent
        // duplicate firings which caused double board-step behavior.

        // keep refs so cleanup can remove them
        elements
            .push
            // dummy placeholders to track keys for cleanup removal
            // we remove listeners directly in final cleanup
            ()

        // show initial board (pending)
        showBoard(0)

        // final cleanup should remove keys and board UI
        const originalCleanup = cleanup
        const extendedCleanup = (nav?: any) => {
            try {
                leftKey.off('down', prevBoard)
            } catch (e) {
                /* ignore */
            }
            try {
                rightKey.off('down', nextBoard)
            } catch (e) {
                /* ignore */
            }
            try {
                aKey.off('down', prevBoard)
            } catch (e) {
                /* ignore */
            }
            try {
                dKey.off('down', nextBoard)
            } catch (e) {
                /* ignore */
            }
            // no global keyboard handler to remove (we use per-key listeners only)
            cleanupBoard()
            originalCleanup(nav)

            // Defensive rebind: ensure player movement A/D keys are bound.
            // Some dialog/key cleanup paths may remove keyboard listeners used for player movement.
            // Rebind once per scene to avoid duplicate handlers.
            try {
                const KEY_REBOUND_FLAG = '__movementKeysRebound__'
                if (!(scene as any)[KEY_REBOUND_FLAG]) {
                    const ih = (scene as any).inputHandler
                    if (ih && typeof ih.handleMovement === 'function') {
                        const kb = scene.input.keyboard!
                        kb.on('keydown-A', () =>
                            ih.handleMovement('left', true)
                        )
                        kb.on('keyup-A', () => ih.handleMovement('left', false))
                        kb.on('keydown-D', () =>
                            ih.handleMovement('right', true)
                        )
                        kb.on('keyup-D', () =>
                            ih.handleMovement('right', false)
                        )
                        ;(scene as any)[KEY_REBOUND_FLAG] = true
                    }
                }
            } catch (e) {
                /* ignore - this is a defensive restoration and non-critical */
            }
        }

        // replace cleanup used in overlay pointerdown with extendedCleanup
        // and ensure caller uses extendedCleanup when closing
        // we reassign cleanup variable in this scope
        // @ts-ignore - reassign outer cleanup
        let icleanup = extendedCleanup
    }
})
