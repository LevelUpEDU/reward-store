import {NextResponse} from 'next/server'
import {db} from '@/db'
import {student, course} from '@/db/schema'
import {eq} from 'drizzle-orm'

export async function GET() {
    try {
        // placeholder
        const instructorEmail = 'awei@bcit.ca'
        // Get all courses created by the instructor
        const instructorCourses = await db.query.course.findMany({
            where: eq(course.instructorEmail, instructorEmail),
            columns: {id: true},
        })

        const courseIds = instructorCourses.map((c) => c.id)

        if (courseIds.length === 0) {
            return NextResponse.json([], {status: 200})
        }

        // Get all students registered for instructor's courses
        const studentRegistrations = await db.query.registration.findMany({
            where: (registrations, {inArray}) =>
                inArray(registrations.courseId, courseIds),
            columns: {
                studentId: true,
            },
        })

        // Get unique student IDs
        const uniqueStudentIds = [
            ...new Set(studentRegistrations.map((reg) => reg.studentId)),
        ]

        // Get student details
        const studentsWithDetails = await Promise.all(
            uniqueStudentIds.map(async (studentId) => {
                const studentDetails = await db.query.student.findFirst({
                    where: eq(student.email, studentId),
                    columns: {
                        email: true,
                        name: true,
                        lastSignin: true,
                    },
                })

                if (!studentDetails) return null

                // Count courses for this student
                const courseCount = studentRegistrations.filter(
                    (reg) => reg.studentId === studentId
                ).length

                return {
                    email: studentDetails.email,
                    name: studentDetails.name,
                    lastSignin: studentDetails.lastSignin,
                    courseCount: courseCount,
                }
            })
        )

        // Filter out null values
        const validStudents = studentsWithDetails.filter(
            (student) => student !== null
        )

        return NextResponse.json(validStudents, {status: 200})
    } catch (error) {
        console.error('Failed to fetch instructor students:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
