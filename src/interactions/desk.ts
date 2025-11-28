import {interactionRegistry} from './interactionRegistry'
import type {Scene} from '@/scenes/Scene'

interactionRegistry.register('desk', (worldScene: Scene) => {
    const scene = worldScene.scene.get('UIScene') as any
    const message = scene.add
        .text(
            scene.scale.width / 2,
            scene.scale.height - 60,
            "You found lesson plans on the teacher's desk!",
            {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: {x: 12, y: 8},
            }
        )
        .setOrigin(0.5)
        .setDepth(2000)

    scene.time.delayedCall(3000, () => {
        message.destroy()
    })
})
