import {interactionRegistry} from './interactionRegistry'
import {chalkboardStyles as styles} from '@/ui/styles/chalkboardStyles'
import {
    createInteractionInput,
    type InteractionInputControls,
} from '@/ui/input/interactionInputHandler'

// ============================================================================
// TYPES
// ============================================================================

interface Quest {
    id?: number
    title?: string
    points?: number
    done?: boolean
    submissionId?: number | null
    submissionStatus?: string | null
}

interface Course {
    id?: number
    title?: string
}

interface Board {
    name: string
    quests: Quest[]
}

// ============================================================================
// API
// ============================================================================

async function loadQuests(
    courseId: number,
    studentEmail?: string
): Promise<{course: Course; quests: Quest[]}> {
    try {
        const qs = new URLSearchParams({courseId: String(courseId)})
        if (studentEmail) qs.set('studentEmail', studentEmail)
        const res = await fetch(`/api/quests?${qs.toString()}`)
        if (!res.ok) return {course: {}, quests: []}
        const data = await res.json()

        const rawQuests =
            Array.isArray(data?.quests) ? data.quests
            : Array.isArray(data) ? data
            : []

        const mapped: Quest[] = rawQuests.map((q: Quest, i: number) => ({
            id: q.id,
            title: q.title ?? `Quest ${i + 1}`,
            points: typeof q.points === 'number' ? q.points : 0,
            done: Boolean(q.done),
            submissionId: q.submissionId ?? null,
            submissionStatus: q.submissionStatus ?? null,
        }))

        return {course: data?.course ?? {}, quests: mapped}
    } catch {
        return {course: {}, quests: []}
    }
}

async function persistToggle(
    index: number,
    value: boolean,
    questId: number | undefined,
    courseId: number,
    studentEmail: string
): Promise<boolean> {
    try {
        const res = await fetch(`/api/quests?courseId=${courseId}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({index, done: value, questId, studentEmail}),
        })
        return res.ok
    } catch {
        return false
    }
}

async function fetchClaimedSubmissions(userEmail: string): Promise<number[]> {
    if (!userEmail) return []
    try {
        const res = await fetch(
            `/api/transactions?email=${encodeURIComponent(userEmail)}`
        )
        if (!res.ok) return []
        const data = await res.json()
        return (data.claimedSubmissionIds || [])
            .map(Number)
            .filter((n: number) => !isNaN(n))
    } catch {
        return []
    }
}

// ============================================================================
// CONFIRM DIALOG
// ============================================================================

interface ConfirmDialogOptions {
    scene: Phaser.Scene
    title: string
    x: number
    y: number
    onConfirm: () => void
    onCancel: () => void
}

function createConfirmDialog(opts: ConfirmDialogOptions) {
    const {scene, title, x, y, onConfirm, onCancel} = opts

    let selectionIndex = 0
    let onKeyDown: ((e: KeyboardEvent) => void) | null = null

    const bg = scene.add
        .rectangle(x, y, 360, 120, 0x222222)
        .setDepth(styles.depths.selector + 10)
        .setStrokeStyle(2, 0xffffff)
        .setInteractive()

    const txt = scene.add
        .text(x, y - 20, title, {
            fontSize: styles.typography.questSize,
            color: '#ffffff',
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.selector + 11)

    const btnYes = scene.add
        .text(x - 60, y + 24, 'Yes', {
            fontSize: styles.typography.questSize,
            color: styles.colors.tickMark,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.selector + 11)
        .setInteractive({cursor: 'pointer'})

    const btnNo = scene.add
        .text(x + 60, y + 24, 'No', {
            fontSize: styles.typography.questSize,
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.selector + 11)
        .setInteractive({cursor: 'pointer'})

    const updateVisual = () => {
        if (selectionIndex === 0) {
            btnYes.setColor(styles.colors.tickMark).setScale(1.06)
            btnNo.setColor(styles.colors.questText).setScale(1)
        } else {
            btnNo.setColor(styles.colors.tickMark).setScale(1.06)
            btnYes.setColor(styles.colors.questText).setScale(1)
        }
    }

    const close = () => {
        if (onKeyDown) {
            document.removeEventListener('keydown', onKeyDown)
            onKeyDown = null
        }
        scene.data.set('__dialogActive__', false)
        bg.destroy()
        txt.destroy()
        btnYes.destroy()
        btnNo.destroy()
    }

    const confirm = () => {
        close()
        onConfirm()
    }

    const cancel = () => {
        close()
        onCancel()
    }

    btnYes.on('pointerdown', confirm)
    btnNo.on('pointerdown', cancel)

    onKeyDown = (e: KeyboardEvent) => {
        if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
            e.preventDefault()
            selectionIndex = (selectionIndex + 1) % 2
            updateVisual()
        } else if (['Enter', 'e'].includes(e.key)) {
            e.preventDefault()
            selectionIndex === 0 ? confirm() : cancel()
        } else if (['Escape', 'q'].includes(e.key)) {
            e.preventDefault()
            cancel()
        }
    }

    scene.data.set('__dialogActive__', true)
    document.addEventListener('keydown', onKeyDown)
    updateVisual()

    return {close}
}

// ============================================================================
// QUEST LIST
// ============================================================================

interface QuestListOptions {
    scene: Phaser.Scene
    quests: Quest[]
    startX: number
    startY: number
    doneX: number
    boardName: string
    userEmail: string
    claimedIds: number[]
    onQuestSubmitted?: () => Promise<void>
}

function createQuestList(opts: QuestListOptions) {
    const {
        scene,
        quests,
        startX,
        startY,
        doneX,
        boardName,
        userEmail,
        claimedIds,
        onQuestSubmitted,
    } = opts

    const elements: Phaser.GameObjects.GameObject[] = []
    const doneStates = quests.map((q) => Boolean(q.done))
    const isAvailable = boardName === 'Available'
    const isApproved = boardName === 'Approved'

    let _selectedIndex = 0
    let dialogActive = false
    const windowStart = 0
    const VISIBLE_COUNT = 5

    const questTexts: Phaser.GameObjects.Text[] = []
    const doneMarks: Phaser.GameObjects.Text[] = []

    // Selector for Available board
    let selector: Phaser.GameObjects.Rectangle | null = null
    if (isAvailable) {
        selector = scene.add
            .rectangle(
                doneX,
                startY,
                styles.selector.size,
                styles.selector.size,
                styles.colors.selector
            )
            .setFillStyle(styles.colors.selector, styles.selector.fillAlpha)
            .setStrokeStyle(
                styles.selector.strokeWidth,
                styles.colors.selectorStroke
            )
            .setDepth(styles.depths.selector)
        elements.push(selector)
    }

    const updateVisuals = (index: number) => {
        _selectedIndex = index
        questTexts.forEach((qt, i) => {
            const isSelected = i === index
            qt.setColor(
                isSelected ?
                    styles.colors.questTextSelected
                :   styles.colors.questText
            )
            scene.tweens.killTweensOf(qt)
            scene.tweens.add({
                targets: qt,
                scale: isSelected ? 1.06 : 1,
                duration: 120,
                ease: 'Quad.Out',
            })
        })
        if (selector) {
            selector.setY(startY + index * styles.layout.rowSpacing)
        }
    }

    const toggleDone = (relativeIndex: number) => {
        if (!isAvailable || dialogActive) return

        const absoluteIndex = windowStart + relativeIndex
        const quest = quests[absoluteIndex]
        const mark = doneMarks[relativeIndex]
        if (!mark) return

        const courseId = scene.registry.get('courseId')
        const email = scene.registry.get('userEmail')
        if (typeof courseId !== 'number') return

        dialogActive = true
        const cy = startY + relativeIndex * styles.layout.rowSpacing

        createConfirmDialog({
            scene,
            title: 'Mark quest as done?',
            x: startX + (doneX - startX) / 2,
            y: cy,
            onConfirm: async () => {
                doneStates[absoluteIndex] = true
                mark.setVisible(true)
                scene.tweens.add({
                    targets: mark,
                    scale: {from: 0.5, to: 1},
                    duration: 200,
                    ease: 'Back.Out',
                })

                const ok = await persistToggle(
                    absoluteIndex,
                    true,
                    quest.id,
                    courseId,
                    email
                )
                if (!ok) {
                    doneStates[absoluteIndex] = false
                    mark.setVisible(false)
                } else {
                    await onQuestSubmitted?.()
                }
                dialogActive = false
            },
            onCancel: () => {
                dialogActive = false
            },
        })
    }

    const claimReward = async (
        quest: Quest,
        index: number,
        btn: Phaser.GameObjects.Text
    ) => {
        btn.setText('...')
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: userEmail,
                    points: quest.points,
                    submissionId: quest.submissionId,
                }),
            })
            if (res.ok) {
                btn.destroy()
                const label = scene.add
                    .text(
                        doneX - 72,
                        startY + index * styles.layout.rowSpacing,
                        'Claimed',
                        {
                            fontSize: styles.typography.questSize,
                            color: '#bdbdbd',
                            fontFamily: styles.typography.fontFamily,
                        }
                    )
                    .setOrigin(0, 0.5)
                    .setDepth(styles.depths.text + 2)
                elements.push(label)
            } else {
                btn.setText('Claim')
            }
        } catch {
            btn.setText('Claim')
        }
    }

    const renderWindow = () => {
        // Clear existing
        questTexts.forEach((t) => t.destroy())
        doneMarks.forEach((m) => m.destroy())
        questTexts.length = 0
        doneMarks.length = 0

        const endIndex = Math.min(windowStart + VISIBLE_COUNT, quests.length)

        for (let i = 0; i < endIndex - windowStart; i++) {
            const questIndex = windowStart + i
            const quest = quests[questIndex]
            const y = startY + i * styles.layout.rowSpacing

            // Quest text
            const text = `${questIndex + 1}. ${quest.title}   (${quest.points}pts)`
            const qt = scene.add
                .text(startX, y, text, {
                    fontSize: styles.typography.questSize,
                    color: styles.colors.questText,
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0, 0.5)
                .setDepth(styles.depths.text)
                .setInteractive({cursor: 'pointer'})

            qt.on('pointerover', () => !dialogActive && updateVisuals(i))
            qt.on('pointerdown', () => toggleDone(i))

            questTexts.push(qt)
            elements.push(qt)

            // Done mark for Available board
            if (isAvailable) {
                const tick = scene.add
                    .text(doneX, y, '✓', {
                        fontSize: `${Math.round(styles.selector.size * 1.6)}px`,
                        color: styles.colors.tickMark,
                        fontFamily: styles.typography.fontFamily,
                    })
                    .setOrigin(0.5)
                    .setDepth(styles.depths.tickMark)
                    .setVisible(doneStates[questIndex])

                doneMarks.push(tick)
                elements.push(tick)
            }

            // Claim button for Approved board
            if (isApproved && quest.submissionId && userEmail) {
                const isClaimed = claimedIds.includes(quest.submissionId)
                if (isClaimed) {
                    const label = scene.add
                        .text(doneX - 72, y, 'Claimed', {
                            fontSize: styles.typography.questSize,
                            color: '#bdbdbd',
                            fontFamily: styles.typography.fontFamily,
                        })
                        .setOrigin(0, 0.5)
                        .setDepth(styles.depths.text + 2)
                    elements.push(label)
                } else {
                    const btn = scene.add
                        .text(doneX - 72, y, 'Claim', {
                            fontSize: styles.typography.questSize,
                            color: '#fff',
                            backgroundColor: '#2e7d32',
                            fontFamily: styles.typography.fontFamily,
                            padding: {left: 12, right: 12, top: 2, bottom: 2},
                        })
                        .setOrigin(0, 0.5)
                        .setDepth(styles.depths.text + 2)
                        .setInteractive({cursor: 'pointer'})

                    btn.on('pointerdown', () => claimReward(quest, i, btn))
                    elements.push(btn)
                }
            }
        }

        // Scroll arrows
        if (windowStart > 0) {
            const arrow = scene.add
                .text(startX + (doneX - startX) / 2, startY - 12, '▲', {
                    fontSize: '32px',
                    color: '#fff',
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5, 1)
                .setDepth(styles.depths.text + 3)
            elements.push(arrow)
        }

        if (windowStart + VISIBLE_COUNT < quests.length) {
            const arrow = scene.add
                .text(
                    startX + (doneX - startX) / 2,
                    startY + (VISIBLE_COUNT - 0.6) * styles.layout.rowSpacing,
                    '▼',
                    {
                        fontSize: '32px',
                        color: '#fff',
                        fontFamily: styles.typography.fontFamily,
                    }
                )
                .setOrigin(0.5, 0)
                .setDepth(styles.depths.text + 3)
            elements.push(arrow)
        }
    }

    renderWindow()

    return {
        elements,
        updateVisuals,
        toggleDone,
        getVisibleCount: () =>
            Math.min(VISIBLE_COUNT, quests.length - windowStart),
        isDialogActive: () => dialogActive,
        destroy: () => elements.forEach((el) => el.destroy()),
    }
}

// ============================================================================
// ARROWS
// ============================================================================

interface ArrowsOptions {
    scene: Phaser.Scene
    centerX: number
    centerY: number
    onLeft: () => void
    onRight: () => void
    boardNames: string[]
}

function createArrows(opts: ArrowsOptions) {
    const {scene, centerX, centerY, onLeft, onRight, boardNames} = opts

    const arrowOffset =
        (scene.scale.width * styles.interfaceWidthRatio) / 2 -
        styles.layout.padding / 2 +
        24
    const elements: Phaser.GameObjects.GameObject[] = []

    const leftArrow = scene.add
        .text(centerX - arrowOffset, centerY, '◀', {
            fontSize: '48px',
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.selector + 2)
        .setInteractive({cursor: 'pointer'})

    const rightArrow = scene.add
        .text(centerX + arrowOffset, centerY, '▶', {
            fontSize: '48px',
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.selector + 2)
        .setInteractive({cursor: 'pointer'})

    const leftLabel = scene.add
        .text(centerX - arrowOffset, centerY + 34, '', {
            fontSize: '14px',
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5, 0)
        .setDepth(styles.depths.selector + 2)

    const rightLabel = scene.add
        .text(centerX + arrowOffset, centerY + 34, '', {
            fontSize: '14px',
            color: styles.colors.questText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5, 0)
        .setDepth(styles.depths.selector + 2)

    elements.push(leftArrow, rightArrow, leftLabel, rightLabel)

    leftArrow.on('pointerover', () => leftArrow.setScale(1.08))
    leftArrow.on('pointerout', () => leftArrow.setScale(1))
    leftArrow.on('pointerdown', onLeft)

    rightArrow.on('pointerover', () => rightArrow.setScale(1.08))
    rightArrow.on('pointerout', () => rightArrow.setScale(1))
    rightArrow.on('pointerdown', onRight)

    const updateLabels = (activeIndex: number) => {
        const leftIndex =
            (activeIndex - 1 + boardNames.length) % boardNames.length
        const rightIndex = (activeIndex + 1) % boardNames.length
        leftLabel.setText(boardNames[leftIndex])
        rightLabel.setText(boardNames[rightIndex])
    }

    const highlight = (which: 'left' | 'right') => {
        const arrow = which === 'left' ? leftArrow : rightArrow
        scene.tweens.add({
            targets: arrow,
            scale: 1.18,
            duration: 80,
            yoyo: true,
            ease: 'Quad.Out',
        })
    }

    return {elements, updateLabels, highlight}
}

// ============================================================================
// MAIN CHALKBOARD
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
    let questList: ReturnType<typeof createQuestList> | null = null
    let selectedQuestIndex = 0
    let activeBoard = 0
    let boards: Board[] = []
    let cleaned = false

    // Get data
    const courseId = scene.registry.get('courseId')
    const studentEmail = scene.registry.get('userEmail') || ''

    const cleanup = () => {
        if (cleaned) return
        cleaned = true
        inputControls?.cleanup()
        questList?.destroy()
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
        .text(centerX, centerY - interfaceHeight / 2 + 60, '', {
            fontSize: '18px',
            color: styles.colors.titleText,
            fontFamily: styles.typography.fontFamily,
        })
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

    title.setText(course.title ? `Quests for ${course.title}` : 'Quests')

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

    const refreshBoards = async () => {
        const {course: freshCourse, quests: freshQuests} = await loadQuests(
            courseId,
            studentEmail
        )
        if (freshCourse.title) title.setText(`Quests for ${freshCourse.title}`)
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

    const showBoard = async (index: number) => {
        activeBoard = ((index % boards.length) + boards.length) % boards.length
        selectedQuestIndex = 0

        // Destroy old quest list
        questList?.destroy()
        questList = null

        const board = boards[activeBoard]
        subtitle.setText(`${board.name} (${board.quests.length})`)
        arrows.updateLabels(activeBoard)

        if (board.quests.length === 0) {
            const msg = scene.add
                .text(centerX, listStartY + 60, 'No quests available', {
                    fontSize: styles.typography.emptyMessageSize,
                    color: styles.colors.titleText,
                    fontFamily: styles.typography.fontFamily,
                })
                .setOrigin(0.5)
                .setDepth(styles.depths.text)
            elements.push(msg)
            return
        }

        // Get claimed IDs for Approved board
        const claimedIds =
            board.name === 'Approved' ?
                await fetchClaimedSubmissions(studentEmail)
            :   []

        // Done label for Available board
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
            elements.push(doneLabel)
        }

        questList = createQuestList({
            scene,
            quests: board.quests,
            startX: listStartX,
            startY: listStartY,
            doneX,
            boardName: board.name,
            userEmail: studentEmail,
            claimedIds,
            onQuestSubmitted: async () => {
                await refreshBoards()
            },
        })

        questList.updateVisuals(0)
    }

    // Create arrows
    const arrows = createArrows({
        scene,
        centerX,
        centerY,
        onLeft: () => {
            if (questList?.isDialogActive()) return
            arrows.highlight('left')
            showBoard(activeBoard - 1)
        },
        onRight: () => {
            if (questList?.isDialogActive()) return
            arrows.highlight('right')
            showBoard(activeBoard + 1)
        },
        boardNames: boards.map((b) => b.name),
    })

    elements.push(...arrows.elements)

    // Input handling
    inputControls = createInteractionInput({
        scene,
        initialMode: 'navigation',
        handlers: {
            onNavigateUp: () => {
                if (!questList || questList.isDialogActive()) return
                const count = questList.getVisibleCount()
                if (count === 0) return
                selectedQuestIndex = Math.max(0, selectedQuestIndex - 1)
                questList.updateVisuals(selectedQuestIndex)
            },
            onNavigateDown: () => {
                if (!questList || questList.isDialogActive()) return
                const count = questList.getVisibleCount()
                if (count === 0) return
                selectedQuestIndex = Math.min(count - 1, selectedQuestIndex + 1)
                questList.updateVisuals(selectedQuestIndex)
            },
            onNavigateLeft: () => {
                if (questList?.isDialogActive()) return
                arrows.highlight('left')
                showBoard(activeBoard - 1)
            },
            onNavigateRight: () => {
                if (questList?.isDialogActive()) return
                arrows.highlight('right')
                showBoard(activeBoard + 1)
            },
            onSelect: () => {
                if (!questList || questList.isDialogActive()) return
                questList.toggleDone(selectedQuestIndex)
            },
            onClose: cleanup,
        },
    })

    // Show first board
    arrows.updateLabels(0)
    await showBoard(0)
})
