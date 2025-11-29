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
import {mountBoards} from './utils/chalkboardBoards'
import type {Scene} from '@/scenes/Scene'

interactionRegistry.register(
    'chalkboard',
    async (worldScene: Scene, _data?) => {
        // swap the scene out to the UIScene (where the chalkboard gets rendered)
        const uiScene = worldScene.scene.get('UIScene')

        // required cast since we are "borrowing" Scene's methods from UIScene
        const scene = uiScene as any

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

        // 3. GET DATA (Using Polyfills)
        // No default fallback! If it's undefined, we want to know.
        const courseId = scene.courseId

        // Get user email from scene or getUserEmail method
        let studentEmail = scene.userEmail
        if (!studentEmail && scene.getUserEmail) {
            studentEmail = scene.getUserEmail()
        }

        // Fallback only for email (dev environment safety)
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

        // 4. CLEANUP UTILITY
        let _cleaned = false
        let cleanup = (nav?: {cleanup?: () => void}) => {
            if (_cleaned) return
            _cleaned = true
            try {
                stopLoadingAnimation()
            } catch {
                /* ignore */
            }

            try {
                if (nav && typeof nav.cleanup === 'function') {
                    nav.cleanup()
                }
            } catch {
                /* ignore */
            }

            try {
                elements.forEach((el) => {
                    if (el && el.scene) el.destroy()
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

        // 5. SAFETY CHECK: Abort if no Course ID
        if (!courseId) {
            stopLoadingAnimation()
            loadingText.destroy()

            title.setAlpha(1)
            title.setText('No Course Selected')
            elements.push(createEmptyMessage(scene, centerX, centerY + 40))

            // Allow closing the board
            overlay.setInteractive()
            overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (!border.getBounds().contains(pointer.x, pointer.y)) {
                    cleanup()
                }
            })
            return
        }

        // 6. LOAD QUESTS
        try {
            const {course, quests} = await loadQuests(courseId, studentEmail)

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

            const listStartX =
                centerX - interfaceWidth / 2 + styles.layout.padding
            const listStartY =
                centerY - interfaceHeight / 2 + styles.layout.listStartY
            const doneX =
                centerX +
                interfaceWidth / 2 -
                styles.layout.padding -
                styles.layout.doneColumnOffsetX

            // Group quests
            const boards: {name: string; quests: typeof quests}[] = [
                {
                    name: 'Available',
                    quests: quests.filter(
                        (q) => !q.submissionId
                    ) as typeof quests,
                },
                {
                    name: 'Submitted',
                    quests: quests.filter(
                        (q) =>
                            q.submissionId && q.submissionStatus === 'pending'
                    ) as typeof quests,
                },
                {
                    name: 'Approved',
                    quests: quests.filter(
                        (q) =>
                            q.submissionId && q.submissionStatus === 'approved'
                    ) as typeof quests,
                },
            ]

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

                // Refresh callback
                const refreshQuests = async () => {
                    try {
                        const {course: freshCourse, quests: freshQuests} =
                            await loadQuests(courseId, studentEmail)

                        if (freshCourse?.title) {
                            title.setText(`Quests for ${freshCourse.title}`)
                        }

                        return [
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
        } catch (err) {
            console.error('[Chalkboard] Critical error loading quests:', err)
            stopLoadingAnimation()
            loadingText.setText('Error Loading Data')

            overlay.setInteractive()
            overlay.on('pointerdown', cleanup)
        }
    }
)
