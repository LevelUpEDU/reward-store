import {db} from '../index'
import {instructor} from '../schema'

import type {Instructor} from '@/types/db'

import {eq} from 'drizzle-orm'

export async function createInstructor(
    email: string,
    name: string,
    password: string
): Promise<Instructor> {
    const result = await db
        .insert(instructor)
        .values({email, name, password})
        .returning()

    return result[0]
}

export async function getInstructorByEmail(
    email: string
): Promise<Instructor | null> {
    const result = await db
        .select()
        .from(instructor)
        .where(eq(instructor.email, email))
        .limit(1)

    return result[0] ?? null
}
