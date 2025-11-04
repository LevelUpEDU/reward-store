import {NextResponse} from 'next/server'
import {db} from '@/db'
import {registration, course, instructor} from '@/db/schema'
import {eq} from 'drizzle-orm'

export async function GET() {
    try {
        const studentEmail = 'student@bcit.ca'

        // Get all courses the student is registered for
        const studentRegistrations = await db.query.registration.findMany({
            where: eq(registration.studentId, studentEmail),
            columns: {courseId: true},
        })

        const registeredCourseIds = studentRegistrations.map(
            (reg) => reg.courseId
        )

        if (registeredCourseIds.length === 0) {
            return NextResponse.json([], {status: 200})
        }

        // Get course details and instructor information manually
        const coursesWithInstructor = await Promise.all(
            registeredCourseIds.map(async (courseId) => {
                const courseDetails = await db.query.course.findFirst({
                    where: eq(course.id, courseId),
                    columns: {
                        id: true,
                        title: true,
                        courseCode: true,
                        description: true,
                        instructorEmail: true,
                    },
                })

                if (!courseDetails) return null

                const instructorDetails = await db.query.instructor.findFirst({
                    where: eq(instructor.email, courseDetails.instructorEmail),
                    columns: {name: true},
                })

                return {
                    id: courseDetails.id,
                    title: courseDetails.title,
                    courseCode: courseDetails.courseCode,
                    description: courseDetails.description,
                    instructorName:
                        instructorDetails?.name || 'Unknown Instructor',
                }
            })
        )

        // Filter out null values
        const validCourses = coursesWithInstructor.filter(
            (course) => course !== null
        )

        return NextResponse.json(validCourses, {status: 200})
    } catch (error) {
        console.error('Failed to fetch student courses:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
