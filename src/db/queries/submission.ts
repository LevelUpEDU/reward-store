'use server'
import {db} from '../index'
import {submission, student} from '../schema'

import type {Quest, Submission, Transaction} from '@/types/db'

import {getQuestsByCourse, getQuestById} from './quest'
import {createTransaction} from './transaction'

import {eq} from 'drizzle-orm'

export async function createSubmission(data: {
    email: string
    questId: number
}): Promise<Submission> {
    const result = await db
        .insert(submission)
        .values({
            studentId: data.email,
            questId: data.questId,
            submissionDate: new Date(),
            status: 'pending',
        })
        .returning()

    return result[0]
}

export async function getSubmissionById(
    submissionId: number
): Promise<Submission | null> {
    const result = await db
        .select()
        .from(submission)
        .where(eq(submission.id, submissionId))
        .limit(1)

    return result[0] ?? null
}

export async function getPendingSubmissions(): Promise<Submission[]> {
    return db.select().from(submission).where(eq(submission.status, 'pending'))
}

export async function getSubmissionsByStudent(
    email: string
): Promise<Submission[]> {
    return db.select().from(submission).where(eq(submission.studentId, email))
}

export async function getSubmissionsByQuest(questId: number): Promise<
    Array<
        Submission & {
            student: {
                name: string
                email: string
            }
        }
    >
> {
    const results = await db
        .select({
            id: submission.id,
            studentId: submission.studentId,
            questId: submission.questId,
            submissionDate: submission.submissionDate,
            status: submission.status,
            verifiedBy: submission.verifiedBy,
            verifiedDate: submission.verifiedDate,
            studentName: student.name,
            studentEmail: student.email,
        })
        .from(submission)
        .innerJoin(student, eq(submission.studentId, student.email))
        .where(eq(submission.questId, questId))

    // typescript complains that "studentName" and "studentEmail" don't exist on this type
    // since SQL returns "student.name" and "student.email"
    //
    // this reshapes the structure to account for this
    return results.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        questId: r.questId,
        submissionDate: r.submissionDate,
        status: r.status,
        verifiedBy: r.verifiedBy,
        verifiedDate: r.verifiedDate,
        student: {
            name: r.studentName,
            email: r.studentEmail,
        },
    }))
}

export async function verifySubmission(
    submissionId: number,
    instructorEmail: string,
    approved: boolean
): Promise<{
    submission: Submission
    transaction: Transaction | null
}> {
    const currentSubmission = await getSubmissionById(submissionId)
    if (!currentSubmission) {
        throw new Error('Submission not found')
    }
    const questData = await getQuestById(currentSubmission.questId)
    if (!questData) throw new Error('Quest not found')

    const updatedSubmission = await db
        .update(submission)
        .set({
            status: approved ? 'approved' : 'rejected',
            verifiedBy: instructorEmail,
            verifiedDate: new Date(),
        })
        .where(eq(submission.id, submissionId))
        .returning()

    let transactionResult = null
    if (approved) {
        transactionResult = await createTransaction({
            email: currentSubmission.studentId,
            points: questData.points,
            submissionId: submissionId,
        })
    }

    return {
        submission: updatedSubmission[0],
        transaction: transactionResult,
    }
}

export async function getQuestsForStudent(
    studentEmail: string,
    courseId: number
): Promise<Quest[]> {
    const allQuests = await getQuestsByCourse(courseId)

    const submissions = await db
        .select()
        .from(submission)
        .where(eq(submission.studentId, studentEmail))

    const submittedQuestIds = new Set(submissions.map((s) => s.questId))

    return allQuests.filter((q: Quest) => !submittedQuestIds.has(q.id))
}
