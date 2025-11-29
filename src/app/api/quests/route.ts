import {NextResponse} from 'next/server'
import {quest} from '@/db/schema'
import {
    createSubmission,
    deleteSubmission,
    getSubmissionsByStudent,
} from '@/db/queries/submission'
import {db, getQuestsByCourse} from '@/db'

// We will use the project's existing Drizzle/Neon helpers when DATABASE_URL is set.
// The project exposes queries in src/db/queries; import the helper to read quests.
const useDb = Boolean(process.env.DATABASE_URL)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

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
        return NextResponse.json(
            {message: `Internal Server Error: ${error}`},
            {status: 500}
        )
    }
}

// GET: return quests from DB when available, otherwise from the local JSON
export async function GET(request: Request) {
    try {
        const {searchParams} = new URL(request.url)
        const courseIdParam = searchParams.get('courseId')
        const studentEmail = searchParams.get('studentEmail')

        if (!courseIdParam)
            return NextResponse.json({error: 'Missing courseId'}, {status: 400})
        const courseId = parseInt(courseIdParam)

        if (!useDb)
            return NextResponse.json(
                {error: 'DB not configured'},
                {status: 500}
            )

        // 2. PARALLEL FETCH
        // We get the definitions from the Quest table...
        // ...and the status from the Submission table.
        const [courseQuests, studentSubmissions] = await Promise.all([
            getQuestsByCourse(courseId),
            studentEmail ? getSubmissionsByStudent(studentEmail) : [],
        ])

        // 3. MERGE
        const formattedQuests = courseQuests.map((q) => {
            const matchedSubmission = studentSubmissions.find(
                (s) => s.questId === q.id
            )
            return {
                ...q,
                done: Boolean(matchedSubmission),
                submissionId: matchedSubmission?.id || null,
                submissionStatus: matchedSubmission?.status || null,
            }
        })

        // (Optional) You can fetch the real course title here if you have a getCourseById query
        const courseData = {id: courseId, title: 'Course'}

        return NextResponse.json({
            course: courseData,
            quests: formattedQuests,
        })
    } catch (err) {
        return NextResponse.json(
            {error: `Internal Server Error: ${err}`},
            {status: 500}
        )
    }
}

// PATCH: marking done/confirmed requires student/instructor context and transactions.
// For now we keep the file-based PATCH behavior as a fallback; if DATABASE_URL is set
// you should implement server-side logic that maps student -> submission rows.
export async function PATCH(request: Request) {
    try {
        if (!useDb)
            return NextResponse.json(
                {error: 'Database not configured'},
                {status: 500}
            )

        const body = await request.json()
        const {done, questId, studentEmail} = body

        if (
            !studentEmail ||
            typeof questId !== 'number' ||
            typeof done !== 'boolean'
        ) {
            return NextResponse.json({error: 'Invalid payload'}, {status: 400})
        }

        if (done) {
            // MARK DONE: Create row
            try {
                await createSubmission({email: studentEmail, questId})
            } catch (e) {
                console.warn(`[API] Duplicate submission ignored: ${e}`)
            }
        } else {
            // UNMARK: Delete row
            await deleteSubmission(studentEmail, questId)
        }

        return NextResponse.json({ok: true})
    } catch (err) {
        return NextResponse.json(
            {error: `Internal Server Error: ${err}`},
            {status: 500}
        )
    }
}
