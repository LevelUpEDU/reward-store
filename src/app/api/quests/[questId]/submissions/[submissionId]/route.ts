import {NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '../../../../auth/[...nextauth]/route'
import {db} from '@/db'
import {submission, quest, transaction} from '@/db/schema'
import {eq, and} from 'drizzle-orm'

export async function PATCH(
    request: Request,
    {params}: {params: {questId: string; submissionId: string}}
) {
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
        const submissionId = parseInt(params.submissionId)

        if (isNaN(questId) || isNaN(submissionId)) {
            return NextResponse.json(
                {message: 'Invalid quest or submission ID'},
                {status: 400}
            )
        }

        const {action} = await request.json()

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                {message: 'Invalid action. Must be "approve" or "reject"'},
                {status: 400}
            )
        }

        // Verify the instructor owns this quest
        const questDetails = await db.query.quest.findFirst({
            where: and(
                eq(quest.id, questId),
                eq(quest.createdBy, session.user.email)
            ),
            columns: {id: true, points: true},
        })

        if (!questDetails) {
            return NextResponse.json(
                {message: 'Quest not found or access denied'},
                {status: 404}
            )
        }

        // Get the submission details
        const submissionDetails = await db.query.submission.findFirst({
            where: and(
                eq(submission.id, submissionId),
                eq(submission.questId, questId)
            ),
            columns: {id: true, studentId: true, status: true},
        })

        if (!submissionDetails) {
            return NextResponse.json(
                {message: 'Submission not found'},
                {status: 404}
            )
        }

        if (submissionDetails.status !== 'pending') {
            return NextResponse.json(
                {message: 'Submission has already been processed'},
                {status: 400}
            )
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected'

        // Update the submission status
        await db
            .update(submission)
            .set({
                status: newStatus,
                verifiedBy: session.user.email,
                verifiedDate: new Date(),
            })
            .where(eq(submission.id, submissionId))

        // If approved, create a transaction to award points
        if (action === 'approve') {
            await db.insert(transaction).values({
                studentId: submissionDetails.studentId,
                points: questDetails.points,
                transactionDate: new Date(),
                submissionId: submissionId,
            })
        }

        return NextResponse.json(
            {
                message: `Submission ${action}d successfully`,
                status: newStatus,
            },
            {status: 200}
        )
    } catch (error) {
        console.error('Failed to process submission:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
