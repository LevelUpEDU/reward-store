import {interactionRegistry} from './interactionRegistry'
import {chalkboardStyles as styles} from './styles/chalkboardStyles'
import {loadQuests} from './utils/questData'
import {
    createOverlay,
    createBorder,
    createBackground,
    createTitle,
    createEmptyMessage,
    createLoadingAnimation,
} from './utils/chalkboardUIHelpers'
// board UI extracted to utils/chalkboardBoards
import {mountBoards} from './utils/chalkboardBoards'

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

    // Create loading text in the center of the chalkboard
    const loadingText = scene.add
        .text(centerX, centerY, 'Loading', {
            fontSize: styles.typography.titleSize,
            color: styles.colors.titleText,
            fontFamily: styles.typography.fontFamily,
        })
        .setOrigin(0.5)
        .setDepth(styles.depths.text + 1)
    elements.push(loadingText)

    // Hide title during loading
    title.setAlpha(0)

    // Start loading animation
    const stopLoadingAnimation = createLoadingAnimation(scene, loadingText)

    // Get courseId and userEmail from scene or use defaults
    interface SceneWithCourseData extends Phaser.Scene {
        courseId?: number
        userEmail?: string
        getUserEmail?: () => string | undefined
    }

    const sceneWithData = scene as SceneWithCourseData

    // Get courseId from scene or default to 3
    const courseId = sceneWithData.courseId ?? 3

    // Get user email from scene or getUserEmail method
    let studentEmail = sceneWithData.userEmail
    if (!studentEmail && sceneWithData.getUserEmail) {
        studentEmail = sceneWithData.getUserEmail()
    }

    // Fallback to default email if still not found
    if (!studentEmail) {
        studentEmail = 'zion_li@my.bcit.ca'
        try {
            if (typeof process !== 'undefined') {
                const proc = process as unknown as
                    | {env?: Record<string, string | undefined>}
                    | undefined
                const envEmail = proc?.env?.DEV_STUDENT_EMAIL
                if (typeof envEmail === 'string' && envEmail.length > 0)
                    studentEmail = envEmail
            }
        } catch {
            // ignore
        }
    }

    console.log('Chalkboard loading quests for:', {courseId, studentEmail})
    const {course, quests} = await loadQuests(courseId, studentEmail)
    const _doneStates: boolean[] = quests.map((q) => Boolean(q.done))

    // Stop loading animation and remove loading text
    stopLoadingAnimation()
    try {
        loadingText.destroy()
    } catch {
        /* ignore */
    }

    // Show and update title with course name
    title.setAlpha(1)
    if (course?.title) {
        title.setText(`Quests for ${course.title}`)
    } else {
        title.setText('Quests')
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

    let _cleaned = false
    let cleanup = (nav?: {cleanup?: () => void}) => {
        if (_cleaned) return
        _cleaned = true
        // Stop loading animation if still running
        try {
            stopLoadingAnimation()
        } catch {
            /* ignore */
        }
        try {
            console.warn('[chalkboard] cleanup called', {
                navProvided: Boolean(nav),
            })
        } catch {}
        try {
            if (nav && typeof nav.cleanup === 'function') {
                try {
                    nav.cleanup()
                } catch {
                    /* ignore */
                }
            }
        } catch {
            /* ignore */
        }
        try {
            elements.forEach((el) => {
                try {
                    el.destroy()
                } catch {
                    /* ignore */
                }
            })
            elements.length = 0
        } catch {
            /* ignore */
        }
        try {
            scene.interactionHandler.unblockMovement()
        } catch {
            /* ignore */
        }
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
        const originalCleanup = cleanup

        // Refresh callback: re-fetch quests and rebuild boards
        const refreshQuests = async () => {
            try {
                const {course: freshCourse, quests: freshQuests} =
                    await loadQuests(3, devStudent)

                // Update title if course changed
                if (freshCourse?.title) {
                    title.setText(`Quests for ${freshCourse.title}`)
                }

                // Rebuild boards with fresh data
                const freshBoards: {
                    name: string
                    quests: typeof freshQuests
                }[] = [
                    {
                        name: 'Available',
                        quests: freshQuests.filter(
                            (q) => !q.submissionId
                        ) as typeof freshQuests,
                    },
                    {
                        name: 'Submitted',
                        quests: freshQuests.filter(
                            (q) =>
                                q.submissionId &&
                                q.submissionStatus === 'pending'
                        ) as typeof freshQuests,
                    },
                    {
                        name: 'Approved',
                        quests: freshQuests.filter(
                            (q) =>
                                q.submissionId &&
                                q.submissionStatus === 'approved'
                        ) as typeof freshQuests,
                    },
                ]

                return freshBoards
            } catch (err) {
                console.error('[chalkboard] refreshQuests error', err)
                return null
            }
        }

        const boardsMount = mountBoards({
            scene,
            elements,
            overlay,
            border,
            title,
            boards,
            listStartX,
            listStartY,
            doneX,
            originalCleanup,
            refreshQuests,
        })
        // reassign cleanup so callers perform extended cleanup from the mount
        cleanup = () => boardsMount.cleanup()
    }
})
