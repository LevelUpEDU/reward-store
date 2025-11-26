'use server'
import {db} from '../index'
import {instructor} from '../schema'

import type {Instructor} from '@/types/db'

import {eq} from 'drizzle-orm'

export async function createInstructor(
    email: string,
    name: string,
    auth0Id?: string
): Promise<Instructor> {
    const result = await db
        .insert(instructor)
        .values({email, name, auth0Id: auth0Id ?? null})
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

type InstructorUpdate = {
    name?: string
    lastSignin?: Date | null
}

export async function updateInstructorProfile(
    email: string,
    updates: InstructorUpdate
): Promise<Instructor | null> {
    const data: Partial<Instructor> = {}

    if (typeof updates.name === 'string') {
        data.name = updates.name
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'lastSignin')) {
        data.lastSignin = updates.lastSignin ?? null
    }

    if (Object.keys(data).length === 0) {
        return getInstructorByEmail(email)
    }

    const result = await db
        .update(instructor)
        .set(data)
        .where(eq(instructor.email, email))
        .returning()

    return result[0] ?? null
}
