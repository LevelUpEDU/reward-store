import {NextResponse} from 'next/server'
import {db} from '@/db'
import {instructor, registration} from '@/db/schema'
import {eq} from 'drizzle-orm'

export async function GET() {
    // placeholder until oauth is working
    let studentEmail = 'student@bcit.ca'

    // Get all courses the student is already registered for
    const studentRegistrations = await db.query.registration.findMany({
        where: eq(registration.studentId, studentEmail),
        columns: {courseId: true},
    })

    const registeredCourseIds = studentRegistrations.map((reg) => reg.courseId)

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
                instructorName: instructorDetails?.name || 'Unknown Instructor',
                isRegistered: registeredCourseIds.includes(course.id),
            }
        })
    )

    return NextResponse.json(coursesWithInstructor, {status: 200})
}
