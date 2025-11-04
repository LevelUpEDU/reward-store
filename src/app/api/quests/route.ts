import {NextResponse} from 'next/server'
import {db} from '@/db'
import {quest} from '@/db/schema'
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

export async function POST(request: Request) {
    try {
        // placeholder until auth0 is integrated
        const userEmail = 'awei@bcit.ca'

        const {title, points, courseId, expirationDate} = await request.json()

        if (!title || !points || !courseId) {
            return NextResponse.json(
                {message: 'Title, points, and courseId are required'},
                {status: 400}
            )
        }

        // Create quest in database
        const newQuest = await db
            .insert(quest)
            .values({
                title,
                points: parseInt(points),
                courseId: parseInt(courseId),
                createdBy: userEmail,
                createdDate: new Date(),
                expirationDate:
                    expirationDate ? new Date(expirationDate) : null,
            })
            .returning()

        return NextResponse.json(
            {
                message: 'Quest created successfully',
                quest: newQuest[0],
            },
            {status: 201}
        )
    } catch (error) {
        console.error('Failed to create quest:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}

export async function GET() {
    try {
        // Fallback to file-based data
        // eslint-disable-next-line no-console
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
        return NextResponse.json({ok: true, quests: data.quests})
    } catch (err: unknown) {
        const payload: Record<string, unknown> = {error: String(err)}
        if (process.env.NODE_ENV !== 'production' && err instanceof Error)
            payload.stack = err.stack
        return NextResponse.json(payload, {status: 500})
    }
}
