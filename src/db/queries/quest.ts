'use server'
import {db} from '../index'
import {quest, course} from '../schema'

import type {Quest} from '@/types/db'

import {eq} from 'drizzle-orm'

export async function createQuest(data: {
    courseId: number
    createdBy: string
    title: string
    points: number
    expirationDate?: Date
}): Promise<Quest> {
    const result = await db
        .insert(quest)
        .values({
            courseId: data.courseId,
            createdBy: data.createdBy,
            title: data.title,
            points: data.points,
            createdDate: new Date(),
            expirationDate: data.expirationDate ?? null,
        })
        .returning()

    return result[0]
}

export async function getQuestsByCourse(courseId: number): Promise<Quest[]> {
    return db.select().from(quest).where(eq(quest.courseId, courseId))
}

export async function getQuestById(questId: number): Promise<Quest | null> {
    const result = await db
        .select()
        .from(quest)
        .where(eq(quest.id, questId))
        .limit(1)

    return result[0] ?? null
}

export async function getQuestsByInstructor(instructorEmail: string): Promise<
    Array<
        Quest & {
            course: {
                title: string
                courseCode: string
            }
        }
    >
> {
    const results = await db
        .select({
            id: quest.id,
            courseId: quest.courseId,
            createdBy: quest.createdBy,
            title: quest.title,
            points: quest.points,
            createdDate: quest.createdDate,
            expirationDate: quest.expirationDate,
            courseTitle: course.title,
            courseCode: course.courseCode,
        })
        .from(quest)
        .innerJoin(course, eq(quest.courseId, course.id))
        .where(eq(course.instructorEmail, instructorEmail))

    return results.map((r) => ({
        id: r.id,
        courseId: r.courseId,
        createdBy: r.createdBy,
        title: r.title,
        points: r.points,
        createdDate: r.createdDate,
        expirationDate: r.expirationDate,
        course: {
            title: r.courseTitle,
            courseCode: r.courseCode,
        },
    }))
}
