/**
 * API functions for chalkboard quest operations
 * Handles fetching quests, marking done, and fetching claimed submissions
 */

import type {Quest, Course} from './types'

/**
 * Load quests for a course, optionally filtered by student
 * @param courseId - Course ID to load quests for
 * @param studentEmail - Optional student email to get personalized quest status
 * @returns Course info and list of quests with submission status
 */
export async function loadQuests(
    courseId: number,
    studentEmail?: string
): Promise<{course: Course; quests: Quest[]}> {
    const url =
        studentEmail ?
            `/api/quests?courseId=${courseId}&studentEmail=${encodeURIComponent(studentEmail)}`
        :   `/api/quests?courseId=${courseId}`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to load quests')

    return await res.json()
}

/**
 * Mark a quest as done or undone
 * @param index - Quest index in the list
 * @param value - True to mark done, false to unmark
 * @param questId - Quest ID
 * @param courseId - Course ID
 * @param studentEmail - Student email
 * @returns True if successful
 */
export async function persistToggle(
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

/**
 * Fetch list of submission IDs that the user has already claimed rewards for
 * @param userEmail - User email
 * @returns Array of submission IDs
 */
export async function fetchClaimedSubmissions(
    userEmail: string
): Promise<number[]> {
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
