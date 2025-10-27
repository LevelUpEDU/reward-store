import {NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '../../auth/[...nextauth]/route'
import {db} from '@/db'
import {submission, quest, registration} from '@/db/schema'
import {eq, and} from 'drizzle-orm'

export async function POST(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                {message: 'Not authenticated'},
                {status: 401}
            )
        }

        const {questId} = await request.json()

        if (!questId) {
            return NextResponse.json(
                {message: 'Quest ID is required'},
                {status: 400}
            )
        }

        // Get quest details to verify the course
        const questDetails = await db.query.quest.findFirst({
            where: eq(quest.id, parseInt(questId)),
            columns: {courseId: true},
        })

        if (!questDetails) {
            return NextResponse.json(
                {message: 'Quest not found'},
                {status: 404}
            )
        }

        // Check if student is registered for the course
        const studentRegistration = await db.query.registration.findFirst({
            where: and(
                eq(registration.studentId, session.user.email),
                eq(registration.courseId, questDetails.courseId)
            ),
        })

        if (!studentRegistration) {
            return NextResponse.json(
                {message: 'Not registered for this course'},
                {status: 403}
            )
        }

        // Check if student has already attended this quest
        const existingSubmission = await db.query.submission.findFirst({
            where: and(
                eq(submission.studentId, session.user.email),
                eq(submission.questId, parseInt(questId))
            ),
        })

        if (existingSubmission) {
            return NextResponse.json(
                {message: 'Already attended this quest'},
                {status: 400}
            )
        }

        // Create submission record
        await db.insert(submission).values({
            studentId: session.user.email,
            questId: parseInt(questId),
            submissionDate: new Date(),
            status: 'pending',
        })

        return NextResponse.json(
            {message: 'Quest attended successfully'},
            {status: 201}
        )
    } catch (error) {
        console.error('Failed to attend quest:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
