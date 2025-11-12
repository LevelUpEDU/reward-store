import {auth0} from '@/lib/auth0'
import {NextResponse, type NextRequest} from 'next/server'
import {getStudentCoursesWithInstructor} from '@/db/queries/course'

export async function GET(_req: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const courses = await getStudentCoursesWithInstructor(
            session.user.email
        )
        return NextResponse.json(courses)
    } catch (err) {
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}
