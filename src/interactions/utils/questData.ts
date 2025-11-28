export interface Quest {
    id?: number
    title: string
    points: number
    done?: boolean
    submissionId?: number | null
    submissionStatus?: string | null
}

interface QuestResponse {
    title?: string
    points?: number
    done?: boolean
    submissionId?: number | null
    submissionStatus?: string | null
    id?: number
}

export interface Course {
    id?: number
    title?: string
}

// module-level inflight map to avoid using function property with any
let persistToggleInflight: Map<string, Promise<boolean>> | null = null

/**
 * Load quests and course metadata. `courseId` defaults to 3 (classroom scene)
 * Returns an object { course, quests } for robust handling of both DB and JSON fallback.
 */
export async function loadQuests(
    courseId: number,
    studentEmail?: string
): Promise<{course: Course; quests: Quest[]}> {
    try {
        const qs = new URLSearchParams({courseId: String(courseId)})
        if (studentEmail) qs.set('studentEmail', studentEmail)
        const res = await fetch(`/api/quests?${qs.toString()}`)
        if (!res.ok) return {course: {}, quests: []}
        const data = await res.json()

        const rawQuests =
            Array.isArray(data?.quests) ? (data.quests as QuestResponse[])
            : Array.isArray(data) ? (data as QuestResponse[])
            : []

        const mapped: Quest[] = rawQuests.map(
            (q: QuestResponse, i: number) => ({
                id: q.id,
                title: q.title ?? `Quest ${i + 1}`,
                points: typeof q.points === 'number' ? q.points : 0,
                done: Boolean(q.done),
                submissionId: q.submissionId ?? null,
                submissionStatus: q.submissionStatus ?? null,
            })
        )

        const course: Course = data?.course ?? {}
        return {course, quests: mapped}
    } catch {
        return {course: {}, quests: []}
    }
}

export async function persistToggle(
    index: number,
    value: boolean,
    questId: number | undefined,
    courseId: number,
    studentEmail: string
): Promise<boolean> {
    try {
        const key = typeof questId === 'number' ? `q:${questId}` : `i:${index}`
        if (!persistToggleInflight) persistToggleInflight = new Map()
        const inflight = persistToggleInflight
        if (inflight.has(key)) {
            return inflight.get(key) as Promise<boolean>
        }

        const p = (async () => {
            if (!courseId) {
                console.error('[persistToggle] Missing courseId')
                return false
            }

            const url = `/api/quests?courseId=${courseId}`

            const res = await fetch(url, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    index,
                    done: value,
                    questId,
                    studentEmail,
                }),
            })
            return res.ok
        })()

        inflight.set(key, p)
        try {
            return await p
        } finally {
            inflight.delete(key)
        }
    } catch {
        return false
    }
}
