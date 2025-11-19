import {auth0} from '@/lib/auth0'
import {NextResponse, type NextRequest} from 'next/server'
import {getAllCourses, getStudentCourses} from '@/db/queries/course'

export async function GET(_req: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const studentEmail = session.user.email

        // Get all courses with instructor names
        const allCourses = await getAllCourses()

        // Get courses the student is registered for
        const registeredCourses = await getStudentCourses(studentEmail)
        const registeredCourseIds = new Set(registeredCourses.map((c) => c.id))

        // Mark which courses the student is registered for
        const availableCourses = allCourses.map((course) => ({
            id: course.id,
            title: course.title,
            courseCode: course.courseCode,
            description: course.description,
            instructorName: course.instructorName,
            isRegistered: registeredCourseIds.has(course.id),
        }))

        return NextResponse.json(availableCourses)
    } catch (err) {
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}
