'use server'
import {db} from '../index'
import {registration} from '../schema'
import type {Registration} from '@/types/db'

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
