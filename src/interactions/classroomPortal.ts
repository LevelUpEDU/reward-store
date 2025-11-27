import {interactionRegistry} from './interactionRegistry'
import type {Scene} from '@/scenes/Scene'
import {
    ClassroomSelector,
    type ClassroomOption,
} from './portal/classroomSelector'

const selectors = new WeakMap<Scene, ClassroomSelector>()

function getSelector(scene: Scene): ClassroomSelector {
    if (!selectors.has(scene)) {
        selectors.set(scene, new ClassroomSelector(scene))
    }
    return selectors.get(scene)!
}

interactionRegistry.register('classroomPortal', async (scene: Scene) => {
    const selector = getSelector(scene)
    const email = scene.getUserEmail()

    try {
        const response = await fetch(
            `/api/student/courses?email=${encodeURIComponent(email)}`
        )
        if (!response.ok) throw new Error('Failed to fetch courses')

        const courses = await response.json()

        const options: ClassroomOption[] = courses.map((course: any) => ({
            label: course.name,
            sceneKey: 'ClassroomScene',
            courseId: course.id,
        }))

        selector.show(options)
    } catch (error) {
        console.error('Failed to load courses:', error)
        selector.show([{label: 'Error loading courses', action: () => {}}])
    }
})
