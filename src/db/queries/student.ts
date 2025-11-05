'use server'
import {db} from '../index'
import {student, transaction, registration, course} from '../schema'

import type {Student} from '@/types/db'

import {count, eq, sum} from 'drizzle-orm'

export async function createStudent(
    email: string,
    name: string,
    password: string
): Promise<Student> {
    const result = await db
        .insert(student)
        .values({email, name, password})
        .returning()

    return result[0]
}

export async function getStudentByEmail(
    email: string
): Promise<Student | null> {
    const result = await db
        .select()
        .from(student)
        .where(eq(student.email, email))
        .limit(1)

    return result[0] ?? null
}

export async function getStudentPoints(email: string): Promise<number> {
    const result = await db
        .select({total: sum(transaction.points)})
        .from(transaction)
        .where(eq(transaction.studentId, email))

    return Number(result[0]?.total ?? 0)
}

// Note: this returns a "course count" which is specific to the instructor dashboard
export async function getStudentsByInstructor(instructorEmail: string): Promise<
    Array<{
        email: string
        name: string
        courseCount: number
        lastSignin: Date | null
    }>
> {
    const results = await db
        .select({
            email: student.email,
            name: student.name,
            lastSignin: student.lastSignin,
            courseCount: count(registration.courseId),
        })
        .from(student)
        .innerJoin(registration, eq(student.email, registration.studentId))
        .innerJoin(course, eq(registration.courseId, course.id))
        .where(eq(course.instructorEmail, instructorEmail))
        .groupBy(student.email, student.name, student.lastSignin)

    return results.map((r) => ({
        email: r.email,
        name: r.name,
        courseCount: Number(r.courseCount),
        lastSignin: r.lastSignin,
    }))
}
