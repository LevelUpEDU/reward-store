import {NextResponse} from 'next/server'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'src', 'data', 'quests.json')

// We will use the project's existing Drizzle/Neon helpers when DATABASE_URL is set.
// The project exposes queries in src/db/queries; import the helper to read quests.
let useDb = false
let importError: any = null
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
} catch (e) {
    /* ignore logging failures */
}

// GET: return quests from DB when available, otherwise from the local JSON
export async function GET(request: Request) {
    try {
        if (useDb) {
            // dynamic import to avoid loading DB during local dev without env
            const {getQuestsByCourse} = await import('@/db/queries/quest')
            const {getCourseById} = await import('@/db/queries/course')
            // Always use courseId 3 for the classroom scene (simplified)
            const cid = 3
            // Debug log: entering DB branch
            // eslint-disable-next-line no-console
            console.log('[api/quests] GET using DB branch (forced courseId=3)')
            const rows = await getQuestsByCourse(cid)
            // eslint-disable-next-line no-console
            console.log(
                '[api/quests] DB rows returned=',
                Array.isArray(rows) ? rows.length : typeof rows
            )
            const url = new URL(request.url)
            // determine student identity (optional query param) — fall back to dev email
            const studentEmail =
                url.searchParams.get('studentEmail') ??
                process.env.DEV_STUDENT_EMAIL ??
                'zion_li@my.bcit.ca'

            // If caller requested debug output, include raw rows for local debugging only
            if (url.searchParams.get('debug') === '1') {
                // also include submissions for the student
                const {getSubmissionsByStudent} = await import(
                    '@/db/queries/submission'
                )
                const submissions = await getSubmissionsByStudent(studentEmail)
                return NextResponse.json({
                    course: (await getCourseById(cid)) ?? null,
                    rows,
                    submissions,
                })
            }

            const course = await getCourseById(cid)
            // determine which quests the student already submitted
            const {getSubmissionsByStudent} = await import(
                '@/db/queries/submission'
            )
            const submissions = await getSubmissionsByStudent(studentEmail)
            const submissionByQuest = new Map<number, any>()
            submissions.forEach((s: any) => {
                if (s.questId) submissionByQuest.set(s.questId, s)
            })

            // map drizzle Quest type to simple API shape and attach submission info
            const quests = rows.map((r: any) => {
                const sub = submissionByQuest.get(r.id) ?? null
                return {
                    id: r.id,
                    title: r.title,
                    points: r.points,
                    // convenience boolean
                    done: Boolean(sub),
                    // detailed submission info if present
                    submissionId: sub?.id ?? null,
                    submissionStatus: sub?.status ?? null,
                    confirmed: sub?.status === 'approved',
                }
            })
            return NextResponse.json({
                course: course ?? null,
                quests,
                submissions,
            })
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
    } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('[api/quests] GET error', err)
        const payload: any = {error: String(err)}
        if (process.env.NODE_ENV !== 'production') payload.stack = err?.stack
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
            try {
                const {getQuestsByCourse} = await import('@/db/queries/quest')
                const {createSubmission, getSubmissionsByStudent} =
                    await import('@/db/queries/submission')

                // determine courseId (query param or env default)
                const url = new URL(request.url)
                const courseId = Number(
                    url.searchParams.get('courseId') ??
                        process.env.DEFAULT_COURSE_ID ??
                        1
                )

                // eslint-disable-next-line no-console
                console.log(
                    '[api/quests] PATCH using DB branch, courseId=',
                    courseId
                )

                let resolvedQuestId = questId
                if (typeof resolvedQuestId !== 'number') {
                    const rows = await getQuestsByCourse(courseId)
                    if (!rows[index]) {
                        return NextResponse.json(
                            {error: 'Index out of range'},
                            {status: 400}
                        )
                    }
                    resolvedQuestId = rows[index].id
                }

                const studentEmail =
                    body.studentEmail ??
                    process.env.DEV_STUDENT_EMAIL ??
                    'zion_li@my.bcit.ca'

                // eslint-disable-next-line no-console
                console.log(
                    '[api/quests] resolvedQuestId=',
                    resolvedQuestId,
                    'studentEmail=',
                    studentEmail
                )

                // ensure the student exists in the DB (avoid FK constraint failures)
                try {
                    const {getStudentByEmail, createStudent} = await import(
                        '@/db/queries/student'
                    )
                    const existingStudent =
                        await getStudentByEmail(studentEmail)
                    if (!existingStudent) {
                        // create a lightweight student record for dev/testing
                        // derive a simple name from the email local-part
                        const name =
                            String(studentEmail).split('@')[0] ?? 'Student'
                        // eslint-disable-next-line no-console
                        console.log(
                            '[api/quests] creating missing student record for',
                            studentEmail
                        )
                        await createStudent(studentEmail, name)
                        // eslint-disable-next-line no-console
                        console.log(
                            '[api/quests] created student record for',
                            studentEmail
                        )
                    }
                } catch (studentErr: any) {
                    // if student helper import or creation fails, log and continue — createSubmission will still fail if student missing
                    // eslint-disable-next-line no-console
                    console.error(
                        '[api/quests] student existence check/create failed',
                        studentErr
                    )
                }
                if (typeof done === 'boolean' && done === true) {
                    // avoid duplicate submissions for same quest and student
                    const existing = await getSubmissionsByStudent(studentEmail)
                    const already = existing.find(
                        (s: any) => s.questId === resolvedQuestId
                    )
                    if (!already) {
                        // eslint-disable-next-line no-console
                        console.log(
                            '[api/quests] creating submission in DB for questId=',
                            resolvedQuestId
                        )
                        try {
                            await createSubmission({
                                email: studentEmail,
                                questId: resolvedQuestId,
                            })
                            // eslint-disable-next-line no-console
                            console.log(
                                '[api/quests] createSubmission completed for questId=',
                                resolvedQuestId
                            )
                        } catch (createErr: any) {
                            // Log the error and rethrow so the outer catch returns 500
                            // eslint-disable-next-line no-console
                            console.error(
                                '[api/quests] createSubmission error',
                                createErr
                            )
                            throw createErr
                        }
                    } else {
                        // eslint-disable-next-line no-console
                        console.log(
                            '[api/quests] submission already exists for student/quest',
                            studentEmail,
                            resolvedQuestId
                        )
                    }
                    // eslint-disable-next-line no-console
                    console.log(
                        '[api/quests] DB-branch PATCH successful, responding ok'
                    )
                    return NextResponse.json({ok: true})
                }

                // If client set done=false we currently do not delete/rollback submissions here.
                // That logic requires rules about removing submissions; return ok for now.
                return NextResponse.json({ok: true})
            } catch (err: any) {
                // Log the error so we can see the stack in server logs
                // eslint-disable-next-line no-console
                console.error('[api/quests] DB-branch PATCH error', err)
                const payload: any = {error: String(err)}
                if (process.env.NODE_ENV !== 'production')
                    payload.stack = err?.stack
                return NextResponse.json(payload, {status: 500})
            }
        }

        // fallback: file-based behavior
        let data = {quests: [] as any[]}
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, 'utf8')
            data = JSON.parse(raw)
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
    } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('[api/quests] PATCH error', err)
        const payload: any = {error: String(err)}
        if (process.env.NODE_ENV !== 'production') payload.stack = err?.stack
        return NextResponse.json(payload, {status: 500})
    }
}
