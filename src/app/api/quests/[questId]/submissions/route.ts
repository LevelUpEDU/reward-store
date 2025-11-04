import {NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '../../../auth/[...nextauth]/route'
import {db} from '@/db'
import {submission, quest, student} from '@/db/schema'
import {eq, and} from 'drizzle-orm'

export async function GET({params}: {params: {questId: string}}) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                {message: 'Not authenticated'},
                {status: 401}
            )
        }

        const questId = parseInt(params.questId)
        if (isNaN(questId)) {
            return NextResponse.json(
                {message: 'Invalid quest ID'},
                {status: 400}
            )
        }

        // Verify the instructor owns this quest
        const questDetails = await db.query.quest.findFirst({
            where: and(
                eq(quest.id, questId),
                eq(quest.createdBy, session.user.email)
            ),
            columns: {id: true, title: true, courseId: true},
        })

        if (!questDetails) {
            return NextResponse.json(
                {message: 'Quest not found or access denied'},
                {status: 404}
            )
        }

        // Get all submissions for this quest
        const submissions = await db.query.submission.findMany({
            where: eq(submission.questId, questId),
            columns: {
                id: true,
                studentId: true,
                submissionDate: true,
                status: true,
                verifiedBy: true,
                verifiedDate: true,
            },
            orderBy: (submissions, {desc}) => [
                desc(submissions.submissionDate),
            ],
        })

        // Get student details for each submission
        const submissionsWithStudents = await Promise.all(
            submissions.map(async (sub) => {
                const studentDetails = await db.query.student.findFirst({
                    where: eq(student.email, sub.studentId),
                    columns: {name: true, email: true},
                })

                return {
                    ...sub,
                    student: studentDetails || {
                        name: 'Unknown Student',
                        email: sub.studentId,
                    },
                }
            })
        )

        return NextResponse.json(
            {
                quest: questDetails,
                submissions: submissionsWithStudents,
            },
            {status: 200}
        )
    } catch (error) {
        console.error('Failed to fetch quest submissions:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
