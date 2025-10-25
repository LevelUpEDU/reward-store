import {NextResponse} from 'next/server'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'src', 'data', 'quests.json')

// We will use the project's existing Drizzle/Neon helpers when DATABASE_URL is set.
// The project exposes queries in src/db/queries; import the helper to read quests.
let useDb = false
let importError: unknown = null
try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const {getQuestsByCourse} = await import('@/db/queries/quest')
    if (typeof getQuestsByCourse === 'function' && process.env.DATABASE_URL) {
        useDb = true
    }
} catch (e) {
    // capture the import error for debugging — we'll still gracefully fall back to file
    importError = e
}

// Log the DB decision at module load. This will appear in the Next dev server console.
// Don't log full DATABASE_URL; only its presence to avoid leaking secrets.
try {
    // eslint-disable-next-line no-console
    console.log(
        '[api/quests] module load: useDb=',
        useDb,
        'DATABASE_URL=',
        process.env.DATABASE_URL ? 'SET' : 'UNSET'
    )
    if (importError) {
        // eslint-disable-next-line no-console
        console.error(
            '[api/quests] import error (query helper):',
            String(importError)
        )
    }
} catch {
    /* ignore logging failures */
}

// GET: return quests from DB when available, otherwise from the local JSON
export async function GET(request: Request) {
    try {
        if (useDb) {
            const {dbGetQuests} = await import('./helpers')
            return await dbGetQuests(request)
        }

        // Fallback to file-based data
        // eslint-disable-next-line no-console
        console.log('[api/quests] falling back to JSON file at', dataPath)
        if (!fs.existsSync(dataPath)) {
            return NextResponse.json({quests: []})
        }
        const raw = fs.readFileSync(dataPath, 'utf8')
        const data = JSON.parse(raw)
        return NextResponse.json(data)
    } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error('[api/quests] GET error', err)
        const payload: Record<string, unknown> = {error: String(err)}
        if (process.env.NODE_ENV !== 'production' && err instanceof Error)
            payload.stack = err.stack
        return NextResponse.json(payload, {status: 500})
    }
}

// PATCH: marking done/confirmed requires student/instructor context and transactions.
// For now we keep the file-based PATCH behavior as a fallback; if DATABASE_URL is set
// you should implement server-side logic that maps student -> submission rows.
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        // eslint-disable-next-line no-console
        console.log('[api/quests] PATCH received body=', JSON.stringify(body))
        const {index, done, confirmed, questId} = body
        if (
            (typeof index !== 'number' && typeof questId !== 'number') ||
            (typeof done !== 'boolean' && typeof confirmed !== 'boolean')
        ) {
            return NextResponse.json(
                {
                    error: 'Invalid payload: require index or questId and done/confirmed',
                },
                {status: 400}
            )
        }

        // If DB is configured, operate against DB: map index -> quest id and create a submission for the student.
        if (useDb) {
            const {dbPatchHandler} = await import('./helpers')
            return await dbPatchHandler(body, request)
        }

        // fallback: file-based behavior
        type FileQuest = {
            title?: string
            points?: number
            done?: boolean
            confirmed?: boolean
        }
        let data: {quests: FileQuest[]} = {quests: []}
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, 'utf8')
            const parsed = JSON.parse(raw) as
                | {quests?: FileQuest[] | undefined}
                | undefined
            data = {quests: parsed?.quests ?? []}
        }
        if (!Array.isArray(data.quests)) data.quests = []
        if (!data.quests[index])
            data.quests[index] = {
                title: `Quest ${index + 1}`,
                points: 0,
                done: false,
            }
        if (typeof done === 'boolean') data.quests[index].done = done
        if (typeof confirmed === 'boolean')
            data.quests[index].confirmed = confirmed
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')
        // eslint-disable-next-line no-console
        console.log(
            '[api/quests] file-fallback PATCH successful, responding ok'
        )
        return NextResponse.json({ok: true, quests: data.quests})
    } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error('[api/quests] PATCH error', err)
        const payload: Record<string, unknown> = {error: String(err)}
        if (process.env.NODE_ENV !== 'production' && err instanceof Error)
            payload.stack = err.stack
        return NextResponse.json(payload, {status: 500})
    }
}
