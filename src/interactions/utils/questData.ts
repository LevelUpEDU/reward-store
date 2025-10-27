export interface Quest {
    title: string
    points: number
    done?: boolean
}

interface QuestResponse {
    title?: string
    points?: number
    done?: boolean
}

export async function loadQuests(): Promise<Quest[]> {
    try {
        const res = await fetch('/api/quests')
        if (!res.ok) return []
        const data = await res.json()
        if (!Array.isArray(data.quests)) return []
        return data.quests.map((q: QuestResponse, i: number) => ({
            title: q.title ?? `Quest ${i + 1}`,
            points: typeof q.points === 'number' ? q.points : 0,
            done: Boolean(q.done),
        }))
    } catch {
        return []
    }
}

export async function persistToggle(
    index: number,
    value: boolean
): Promise<boolean> {
    try {
        const res = await fetch('/api/quests', {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({index, done: value}),
        })
        return res.ok
    } catch {
        return false
    }
}
