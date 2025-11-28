import {auth0} from '@/lib/auth0'
import {NextResponse, type NextRequest} from 'next/server'
import {getStudentByEmail} from '@/db/queries/student'
import {getInstructorByEmail} from '@/db/queries/instructor'

export async function GET(_req: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const email = session.user.email

        // return early if email can't be found
        if (!email) {
            return NextResponse.json({
                email: null,
                name: 'User',
                sub: session.user.sub,
            })
        }

        // find user name given an email (works for students or instructors)
        let name: string | null = null

        const student = await getStudentByEmail(email)
        if (student) {
            name = student.name
        } else {
            const instructor = await getInstructorByEmail(email)
            if (instructor) {
                name = instructor.name
            }
        }

        return NextResponse.json({
            email,
            name: name || email.split('@')[0] || 'User',
            sub: session.user.sub,
        })
    } catch (error) {
        return NextResponse.json(
            {error: (error as Error).message},
            {status: 500}
        )
    }
}
