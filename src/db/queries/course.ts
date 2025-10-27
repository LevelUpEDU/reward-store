import {db} from '../index'
import {course, registration} from '../schema'
import type {Course} from '@/types/db'
import {eq} from 'drizzle-orm'

export async function createCourse(data: {
    email: string
    title: string
    description?: string
}): Promise<Course> {
    const result = await db
        .insert(course)
        .values({
            instructorEmail: data.email,
            title: data.title,
            description: data.description ?? null,
        })
        .returning()

    return result[0]
}

export async function getCourseById(id: number): Promise<Course | null> {
    const result = await db
        .select()
        .from(course)
        .where(eq(course.id, id))
        .limit(1)

    return result[0] ?? null
}

export async function getCoursesByInstructor(email: string): Promise<Course[]> {
    return db.select().from(course).where(eq(course.instructorEmail, email))
}

export async function getStudentCourses(email: string): Promise<Course[]> {
    return db
        .select({
            id: course.id,
            courseCode: course.courseCode,
            instructorEmail: course.instructorEmail,
            title: course.title,
            description: course.description,
        })
        .from(registration)
        .innerJoin(course, eq(registration.courseId, course.id))
        .where(eq(registration.studentId, email))
}
