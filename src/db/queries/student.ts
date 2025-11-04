import {db} from '../index'
import {student, transaction} from '../schema'

import type {Student} from '@/types/db'

import {eq, sum} from 'drizzle-orm'

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
