import type {Scene} from '@/scenes/Scene'
import {ClassroomSelector, type ClassroomOption} from './classroomSelector'

export interface PortalConfig {
    x: number
    y: number
    width: number
    height: number
    color?: number
    alpha?: number
    classroomOptions?: ClassroomOption[]
    classroomOptionsLoader?: () => Promise<ClassroomOption[]>
}

export class PortalManager {
    private scene: Scene
    private classroomSelector: ClassroomSelector
    private portalStates: Map<Phaser.GameObjects.Rectangle, boolean> = new Map()

    constructor(scene: Scene) {
        this.scene = scene
        this.classroomSelector = new ClassroomSelector(scene)
    }

    public createPortal(config: PortalConfig): void {
        const rect = this.scene.add.rectangle(
            config.x,
            config.y,
            config.width,
            config.height,
            config.color ?? 0x00ff00,
            config.alpha ?? 0.3
        )

        this.scene.physics.add.existing(rect, true)

        // Track if player is currently inside the portal
        this.portalStates.set(rect, false)

        // Called while player is overlapping with portal
        const overlapCollider = this.scene.physics.add.overlap(
            this.scene.player,
            rect,
            () => {
                // Mark that player entered the portal
                this.portalStates.set(rect, true)
            },
            undefined,
            this.scene
        )

        // Check every frame if player has exited the portal
        this.scene.events.on('update', () => {
            const wasInside = this.portalStates.get(rect)
            const isOverlapping = this.scene.physics.overlap(
                this.scene.player,
                rect
            )

            // If player was inside and is now outside, they passed through
            if (wasInside && !isOverlapping) {
                this.portalStates.set(rect, false)
                if (!this.classroomSelector.isVisible()) {
                    this.showClassroomSelection(config)
                }
            }

            // Reset state if player is not overlapping
            if (!isOverlapping) {
                this.portalStates.set(rect, false)
            }
        })
    }

    private async showClassroomSelection(config: PortalConfig): Promise<void> {
        let options: ClassroomOption[] = []

        if (config.classroomOptions) {
            options = config.classroomOptions
        } else if (config.classroomOptionsLoader) {
            try {
                options = await config.classroomOptionsLoader()
            } catch (error) {
                console.error('Failed to load classroom options:', error)
                // Show error message or fallback
                options = [
                    {
                        label: 'Error loading courses',
                        action: () => console.error('Could not load courses'),
                    },
                ]
            }
        }

        this.classroomSelector.show(options)
    }

    public getClassroomSelector(): ClassroomSelector {
        return this.classroomSelector
    }
}

export {ClassroomSelector, type ClassroomOption}
