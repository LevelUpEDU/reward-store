import {NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '../../auth/[...nextauth]/route'
import {db} from '@/db'
import {course, instructor, registration} from '@/db/schema'
import {eq, notInArray} from 'drizzle-orm'

export async function GET() {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                {message: 'Not authenticated'},
                {status: 401}
            )
        }

        // Get all courses the student is already registered for
        const studentRegistrations = await db.query.registration.findMany({
            where: eq(registration.studentId, session.user.email),
            columns: {courseId: true},
        })

        const registeredCourseIds = studentRegistrations.map(
            (reg) => reg.courseId
        )

        // Get all courses
        const allCourses = await db.query.course.findMany({
            columns: {
                id: true,
                title: true,
                courseCode: true,
                description: true,
                instructorEmail: true,
            },
        })

        // Get instructor information for each course
        const coursesWithInstructor = await Promise.all(
            allCourses.map(async (course) => {
                const instructorDetails = await db.query.instructor.findFirst({
                    where: eq(instructor.email, course.instructorEmail),
                    columns: {name: true},
                })

                return {
                    id: course.id,
                    title: course.title,
                    courseCode: course.courseCode,
                    description: course.description,
                    instructorName:
                        instructorDetails?.name || 'Unknown Instructor',
                    isRegistered: registeredCourseIds.includes(course.id),
                }
            })
        )

        return NextResponse.json(coursesWithInstructor, {status: 200})
    } catch (error) {
        console.error('Failed to fetch available courses:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
