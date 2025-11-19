'use server'
import {db} from '../index'
import {course, registration, instructor} from '../schema'
import type {Course} from '@/types/db'
import {eq} from 'drizzle-orm'

// times to retry generating a unique course code
const maxAttempts = 100

export async function createCourse(data: {
    email: string
    title: string
    description?: string
}): Promise<Course> {
    let attempts = 0

    while (attempts < 10) {
        try {
            const [result] = await db
                .insert(course)
                .values({
                    instructorEmail: data.email,
                    title: data.title,
                    description: data.description ?? null,
                })
                .returning()
            return result
        } catch (error: unknown) {
            const isCodeCollision =
                error &&
                typeof error === 'object' &&
                'code' in error &&
                // 23505 is the postgres code for violating the unique constraint
                error.code === '23505'

            if (!isCodeCollision || ++attempts >= maxAttempts) throw error
        }
    }

    throw new Error('Failed to generate unique course code')
}

export async function getCourseById(id: number): Promise<Course | null> {
    const result = await db
        .select()
        .from(course)
        .where(eq(course.id, id))
        .limit(1)

    return result[0] ?? null
}

// Get course by course code with instructor name
export async function getCourseByCode(
    courseCode: string
): Promise<(Course & {instructorName: string}) | null> {
    const result = await db
        .select({
            id: course.id,
            courseCode: course.courseCode,
            instructorEmail: course.instructorEmail,
            title: course.title,
            description: course.description,
            instructorName: instructor.name,
        })
        .from(course)
        .innerJoin(instructor, eq(course.instructorEmail, instructor.email))
        .where(eq(course.courseCode, courseCode))
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

// Get all courses with instructor name
export async function getAllCourses(): Promise<
    Array<Course & {instructorName: string}>
> {
    return db
        .select({
            id: course.id,
            courseCode: course.courseCode,
            instructorEmail: course.instructorEmail,
            title: course.title,
            description: course.description,
            instructorName: instructor.name,
        })
        .from(course)
        .innerJoin(instructor, eq(course.instructorEmail, instructor.email))
}

// Get student courses with instructor name
export async function getStudentCoursesWithInstructor(
    email: string
): Promise<Array<Course & {instructorName: string}>> {
    return db
        .select({
            id: course.id,
            courseCode: course.courseCode,
            instructorEmail: course.instructorEmail,
            title: course.title,
            description: course.description,
            instructorName: instructor.name,
        })
        .from(registration)
        .innerJoin(course, eq(registration.courseId, course.id))
        .innerJoin(instructor, eq(course.instructorEmail, instructor.email))
        .where(eq(registration.studentId, email))
}
