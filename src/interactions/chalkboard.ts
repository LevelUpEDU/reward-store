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

    // Create title
    const title = createTitle(
        scene,
        centerX,
        centerY,
        interfaceWidth,
        interfaceHeight
    )
    elements.push(title)

    // Load and display quests
    const quests = await loadQuests()
    const doneStates: boolean[] = quests.map((q) => Boolean(q.done))

    const listStartX = centerX - interfaceWidth / 2 + styles.layout.padding
    const listStartY = centerY - interfaceHeight / 2 + styles.layout.listStartY
    const doneX =
        centerX +
        interfaceWidth / 2 -
        styles.layout.padding -
        styles.layout.doneColumnOffsetX

    const cleanup = (nav?: any) => {
        if (nav) nav.cleanup()
        elements.forEach((el) => el.destroy())
        scene.interactionHandler.unblockMovement()
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
        const questUI = createQuestUI(
            scene,
            quests,
            doneStates,
            listStartX,
            listStartY,
            doneX
        )
        elements.push(...questUI.elements)

        const navigation = createMenuNavigation({
            scene,
            itemCount: quests.length,
            onSelectionChange: (idx) => questUI.updateVisuals(idx),
            onSelect: (idx) => questUI.toggleDone(idx),
            onClose: () => cleanup(navigation),
        })

        overlay.setInteractive()
        overlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (!border.getBounds().contains(pointer.x, pointer.y)) {
                cleanup(navigation)
            }
        })

        questUI.updateVisuals(0)
    }
})
