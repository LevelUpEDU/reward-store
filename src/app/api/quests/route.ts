import {auth0} from '@/lib/auth0'
import {NextResponse, type NextRequest} from 'next/server'
import {getQuestsByCourse} from '@/db/queries/quest'
import {getCourseById} from '@/db/queries/course'
import {
    createSubmission,
    deleteSubmission,
    getSubmissionsByStudent,
} from '@/db/queries/submission'

/**
 * GET /api/quests
 * Fetch quests for a course with optional student submission status
 *
 * Query params:
 * - courseId (required): Course ID to fetch quests for
 * - studentEmail (optional): Student email to get personalized quest status
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const courseIdParam = req.nextUrl.searchParams.get('courseId')
        const studentEmail = req.nextUrl.searchParams.get('studentEmail')

        if (!courseIdParam) {
            return NextResponse.json({error: 'Missing courseId'}, {status: 400})
        }

        const courseId = Number(courseIdParam)

        // Parallel fetch: course data, quests, and student submissions
        const [course, courseQuests, studentSubmissions] = await Promise.all([
            getCourseById(courseId),
            getQuestsByCourse(courseId),
            studentEmail ? getSubmissionsByStudent(studentEmail) : [],
        ])

        if (!course) {
            return NextResponse.json({error: 'Course not found'}, {status: 404})
        }

        // Merge quest data with submission status
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

        return NextResponse.json({
            course: {
                id: course.id,
                title: course.title,
                courseCode: course.courseCode,
            },
            quests: formattedQuests,
        })
    } catch (err) {
        console.error('Failed to fetch quests:', err)
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}

/**
 * POST /api/quests
 * Create a new quest (instructor only)
 *
 * Body:
 * - title: Quest title
 * - points: Points awarded for completion
 * - courseId: Course ID
 * - expirationDate (optional): Quest expiration date
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const {title, points, courseId, expirationDate} = await req.json()

        if (!title || !points || !courseId) {
            return NextResponse.json(
                {error: 'Title, points, and courseId are required'},
                {status: 400}
            )
        }

        // Note: You might want to add instructor verification here
        // to ensure the user is actually an instructor for this course

        const {createQuest} = await import('@/db/queries/quest')
        const newQuest = await createQuest({
            courseId: Number(courseId),
            createdBy: session.user.email,
            title,
            points: Number(points),
            expirationDate:
                expirationDate ? new Date(expirationDate) : undefined,
        })

        return NextResponse.json(
            {
                message: 'Quest created successfully',
                quest: newQuest,
            },
            {status: 201}
        )
    } catch (err) {
        console.error('Failed to create quest:', err)
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}

/**
 * PATCH /api/quests
 * Mark a quest as done/undone (creates/deletes submission)
 *
 * Body:
 * - questId: Quest ID
 * - done: true to mark done, false to unmark
 * - studentEmail: Student email
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const {done, questId, studentEmail} = await req.json()

        if (
            !studentEmail ||
            typeof questId !== 'number' ||
            typeof done !== 'boolean'
        ) {
            return NextResponse.json({error: 'Invalid payload'}, {status: 400})
        }

        // Security: Ensure user can only modify their own submissions
        // (or is an instructor for the course)
        if (session.user.email !== studentEmail) {
            // TODO: Add instructor verification here
            return NextResponse.json({error: 'Unauthorized'}, {status: 403})
        }

        if (done) {
            // Mark as done: Create submission
            try {
                await createSubmission({
                    email: studentEmail,
                    questId,
                })
            } catch (e) {
                // Ignore duplicate submission errors
                console.warn(`Duplicate submission ignored: ${e}`)
            }
        } else {
            // Unmark: Delete submission
            await deleteSubmission(studentEmail, questId)
        }

        return NextResponse.json({ok: true})
    } catch (err) {
        console.error('Failed to update quest status:', err)
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}
