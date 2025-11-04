import {NextResponse} from 'next/server'
import {db} from '@/db'
import {submission, quest, registration} from '@/db/schema'
import {eq, and} from 'drizzle-orm'

export async function POST(request: Request) {
    try {
        const studentEmail = 'student@bcit.ca'

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
                eq(registration.studentId, studentEmail),
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
                eq(submission.studentId, studentEmail),
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
            studentId: studentEmail,
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
