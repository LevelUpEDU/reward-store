import {interactionRegistry} from './interactionRegistry'
import type {Scene} from '@/scenes/Scene'
import {
    ClassroomSelector,
    type ClassroomOption,
} from './portal/classroomSelector'

const selectors = new WeakMap<Phaser.Scene, ClassroomSelector>()

function getSelector(scene: Phaser.Scene): ClassroomSelector {
    if (!selectors.has(scene)) {
        // Cast scene to any to satisfy the constructor requirement
        selectors.set(scene, new ClassroomSelector(scene as any))
    }
    return selectors.get(scene)!
}

interactionRegistry.register('classroomPortal', async (worldScene: Scene) => {
    const uiScene = worldScene.scene.get('UIScene') as any
    const selector = getSelector(uiScene)

    const email = uiScene.getUserEmail()

    try {
        const response = await fetch(
            `/api/student/courses?email=${encodeURIComponent(email)}`
        )
        if (!response.ok) throw new Error('Failed to fetch courses')

        const courses = await response.json()

        const options: ClassroomOption[] = courses.map((course: any) => ({
            label: course.title,
            courseId: course.id,
            action: () => {
                const s = selector as any
                if (typeof s.hide === 'function') s.hide()
                else if (typeof s.close === 'function') s.close()
                else if (typeof s.destroy === 'function') s.destroy()
                worldScene.registry.set('courseId', course.id)

                // transition to the world scene
                // this is crucial otherwise the new map will load in the UI layer
                worldScene.scene.start('ClassroomScene', {
                    courseId: course.id,
                })
            },
        }))

        selector.show(options)
    } catch (error) {
        console.error('Failed to load courses:', error)
        selector.show([{label: 'Error loading courses', action: () => {}}])
    }
})
