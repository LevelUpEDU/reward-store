import {auth0} from '@/lib/auth0'
import {NextResponse, type NextRequest} from 'next/server'
import {registerStudent} from '@/db/queries/registration'
import {and, eq} from 'drizzle-orm'
import {registration, student} from '@/db/schema'
import {db} from '@/db'

export async function POST(req: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.sub) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const body = await req.json()
        const {courseId} = body

        if (!courseId || typeof courseId !== 'number') {
            return NextResponse.json(
                {error: 'Course ID is required'},
                {status: 400}
            )
        }

        // Use Auth0 ID (sub) to find student email
        const auth0Id = session.user.sub
        const studentRecord = await db
            .select()
            .from(student)
            .where(eq(student.auth0Id, auth0Id))
            .limit(1)

        if (studentRecord.length === 0) {
            return NextResponse.json(
                {error: 'Student not found. Please register first.'},
                {status: 404}
            )
        }

        const studentEmail = studentRecord[0].email

        // Check if already registered
        const existing = await db
            .select()
            .from(registration)
            .where(
                and(
                    eq(registration.studentId, studentEmail),
                    eq(registration.courseId, courseId)
                )
            )
            .limit(1)

        if (existing.length > 0) {
            return NextResponse.json(
                {error: 'Already registered for this course'},
                {status: 409}
            )
        }

        // Register student for course
        await registerStudent(studentEmail, courseId)

        return NextResponse.json({
            success: true,
            message: 'Successfully registered for course',
        })
    } catch (error: any) {
        // Handle duplicate registration error (composite primary key violation)
        if (error?.code === '23505') {
            return NextResponse.json(
                {error: 'Already registered for this course'},
                {status: 409}
            )
        }
        return NextResponse.json(
            {error: (error as Error).message},
            {status: 500}
        )
    }
}
