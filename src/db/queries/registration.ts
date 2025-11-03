import {db} from '../index'
import {registration, student} from '../schema'
import type {Registration, Student} from '@/types/db'
import {eq} from 'drizzle-orm'

export async function registerStudent(
    email: string,
    courseId: number
): Promise<Registration> {
    const result = await db
        .insert(registration)
        .values({
            studentId: email,
            courseId: courseId,
        })
        .returning()

    return result[0]
}

export async function getStudentsInCourse(
    courseId: number
): Promise<Student[]> {
    return db
        .select({
            email: student.email,
            name: student.name,
            auth0Id: student.auth0Id,
            lastSignin: student.lastSignin,
        })
        .from(registration)
        .innerJoin(student, eq(registration.studentId, student.email))
        .where(eq(registration.courseId, courseId))
}
