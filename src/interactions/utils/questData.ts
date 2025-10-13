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
}

export interface Course {
    id?: number
    title?: string
}

/**
 * Load quests and course metadata. `courseId` defaults to 3 (classroom scene)
 * Returns an object { course, quests } for robust handling of both DB and JSON fallback.
 */
export async function loadQuests(
    courseId: number = 3,
    studentEmail?: string
): Promise<{course: Course; quests: Quest[]}> {
    try {
        const qs = new URLSearchParams({courseId: String(courseId)})
        if (studentEmail) qs.set('studentEmail', studentEmail)
        const res = await fetch(`/api/quests?${qs.toString()}`)
        if (!res.ok) return {course: {}, quests: []}
        const data = await res.json()

        const rawQuests =
            Array.isArray(data?.quests) ? data.quests
            : Array.isArray(data) ? data
            : []

        const mapped: Quest[] = rawQuests.map(
            (q: QuestResponse, i: number) => ({
                id: (q as any).id,
                title: q.title ?? `Quest ${i + 1}`,
                points: typeof q.points === 'number' ? q.points : 0,
                done: Boolean(q.done),
                submissionId: (q as any).submissionId ?? null,
                submissionStatus: (q as any).submissionStatus ?? null,
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
    questId?: number
): Promise<boolean> {
    try {
        // prevent concurrent requests for the same quest/index
        const key = typeof questId === 'number' ? `q:${questId}` : `i:${index}`
        if (!(persistToggle as any)._inflight)
            (persistToggle as any)._inflight = new Map<
                string,
                Promise<boolean>
            >()
        const inflight: Map<string, Promise<boolean>> = (persistToggle as any)
            ._inflight
        if (inflight.has(key)) {
            // wait for existing request to complete, then return its result
            return inflight.get(key) as Promise<boolean>
        }

        const p = (async () => {
            // include courseId=3 so server maps against the classroom course
            const url = `/api/quests?courseId=3`
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({index, done: value, questId}),
            })
            return res.ok
        })()

        inflight.set(key, p)
        try {
            const ok = await p
            return ok
        } finally {
            inflight.delete(key)
        }
    } catch {
        return false
    }
}
