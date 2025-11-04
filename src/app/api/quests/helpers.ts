import {NextResponse} from 'next/server'

type DBQuestRow = {id: number; title: string; points: number}
type SubmissionRow = {id?: number; questId?: number; status?: string}

export async function dbGetQuests(request: Request) {
    // dynamic imports to avoid loading DB code in environments without DATABASE_URL
    const {getQuestsByCourse} = await import('@/db/queries/quest')
    const {getCourseById} = await import('@/db/queries/course')
    const cid = 3
    const rows = await getQuestsByCourse(cid)
    const url = new URL(request.url)
    const studentEmail =
        url.searchParams.get('studentEmail') ??
        process.env.DEV_STUDENT_EMAIL ??
        'zion_li@my.bcit.ca'

    if (url.searchParams.get('debug') === '1') {
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
    const {getSubmissionsByStudent} = await import('@/db/queries/submission')
    const submissions = await getSubmissionsByStudent(studentEmail)
    const submissionByQuest = new Map<number, SubmissionRow>()
    submissions.forEach((s: SubmissionRow) => {
        if (s.questId) submissionByQuest.set(s.questId, s)
    })

    const quests = (rows as DBQuestRow[]).map((r) => {
        const sub = submissionByQuest.get(r.id) ?? null
        return {
            id: r.id,
            title: r.title,
            points: r.points,
            done: Boolean(sub),
            submissionId: sub?.id ?? null,
            submissionStatus: sub?.status ?? null,
            confirmed: sub?.status === 'approved',
        }
    })

    return NextResponse.json({course: course ?? null, quests, submissions})
}

export async function dbPatchHandler(
    body: {
        index?: number
        done?: boolean
        confirmed?: boolean
        questId?: number
        studentEmail?: string
    },
    request: Request
) {
    const {getQuestsByCourse} = await import('@/db/queries/quest')
    const {createSubmission, getSubmissionsByStudent} = await import(
        '@/db/queries/submission'
    )

    const url = new URL(request.url)
    const courseId = Number(
        url.searchParams.get('courseId') ?? process.env.DEFAULT_COURSE_ID ?? 1
    )

    let resolvedQuestId: number | undefined = body.questId
    if (typeof resolvedQuestId !== 'number') {
        const rows = await getQuestsByCourse(courseId)
        const idx = typeof body.index === 'number' ? body.index : undefined
        if (typeof idx !== 'number' || !rows[idx])
            return NextResponse.json(
                {error: 'Index out of range'},
                {status: 400}
            )
        resolvedQuestId = rows[idx].id
    }

    const studentEmail =
        body.studentEmail ??
        process.env.DEV_STUDENT_EMAIL ??
        'zion_li@my.bcit.ca'

    if (body.done === true) {
        const existing = await getSubmissionsByStudent(studentEmail)
        const already = existing.find(
            (s: SubmissionRow) => s.questId === resolvedQuestId
        )
        if (!already && typeof resolvedQuestId === 'number') {
            await createSubmission({
                email: studentEmail,
                questId: resolvedQuestId,
            })
        }
        return NextResponse.json({ok: true})
    }

    return NextResponse.json({ok: true})
}
