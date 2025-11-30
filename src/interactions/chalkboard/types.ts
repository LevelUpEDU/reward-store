/**
 * Type definitions for the chalkboard quest system
 */

export interface Quest {
    id?: number
    title?: string
    points?: number
    done?: boolean
    submissionId?: number | null
    submissionStatus?: string | null
}

export interface Course {
    id?: number
    title?: string
}

export interface Board {
    name: string
    quests: Quest[]
}
