import {interactionRegistry} from './interactionRegistry'
import type {Scene} from '@/scenes/Scene'

interactionRegistry.register(
    'roomTransition',
    (scene: Scene, data?: unknown) => {
        const target = data as string
        if (!target) {
            console.error('roomTransition: missing target scene')
            return
        }

        scene.interactionHandler.blockMovement()

        scene.cameras.main.fadeOut(500, 0, 0, 0)
        scene.cameras.main.once('camerafadeoutcomplete', () => {
            scene.scene.start(target)
        })
    }
)
