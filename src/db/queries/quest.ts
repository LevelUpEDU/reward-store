'use server'
import {db} from '../index'
import {quest, course} from '../schema'

import type {Quest} from '@/types/db'

import {and, eq} from 'drizzle-orm'

type QuestUpdate = typeof quest.$inferInsert

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

export async function updateQuest(
    questId: number,
    instructorEmail: string,
    updates: {
        title?: string
        points?: number
        courseId?: number
        expirationDate?: Date | null
    }
): Promise<Quest | null> {
    const updateData: Partial<QuestUpdate> = {}

    if (typeof updates.title === 'string') {
        updateData.title = updates.title
    }

    if (typeof updates.points === 'number') {
        updateData.points = updates.points
    }

    if (typeof updates.courseId === 'number') {
        updateData.courseId = updates.courseId
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'expirationDate')) {
        updateData.expirationDate = updates.expirationDate ?? null
    }

    if (Object.keys(updateData).length === 0) {
        return getQuestById(questId)
    }

    const result = await db
        .update(quest)
        .set(updateData)
        .where(and(eq(quest.id, questId), eq(quest.createdBy, instructorEmail)))
        .returning()

    return result[0] ?? null
}

export async function deleteQuest(
    questId: number,
    instructorEmail: string
): Promise<boolean> {
    const result = await db
        .delete(quest)
        .where(and(eq(quest.id, questId), eq(quest.createdBy, instructorEmail)))
        .returning({id: quest.id})

    return result.length > 0
}
