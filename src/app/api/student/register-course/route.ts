import {NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '../../auth/[...nextauth]/route'
import {db} from '@/db'
import {registration} from '@/db/schema'

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

        const {courseId} = await request.json()

        if (!courseId) {
            return NextResponse.json(
                {message: 'Course ID is required'},
                {status: 400}
            )
        }

        // Check if student is already registered for this course
        const existingRegistration = await db.query.registration.findFirst({
            where: (registrations, {and, eq}) =>
                and(
                    eq(registrations.studentId, session.user.email),
                    eq(registrations.courseId, parseInt(courseId))
                ),
        })

        if (existingRegistration) {
            return NextResponse.json(
                {message: 'Already registered for this course'},
                {status: 400}
            )
        }

        // Register the student for the course
        await db.insert(registration).values({
            studentId: session.user.email,
            courseId: parseInt(courseId),
        })

        return NextResponse.json(
            {message: 'Successfully registered for course'},
            {status: 201}
        )
    } catch (error) {
        console.error('Failed to register for course:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
