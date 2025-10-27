import {db} from '../index'
import {transaction} from '../schema'

import type {Transaction} from '@/types/db'

export async function createTransaction(data: {
    email: string
    points: number
    submissionId?: number
    redemptionId?: number
}): Promise<Transaction> {
    const result = await db
        .insert(transaction)
        .values({
            studentId: data.email,
            points: data.points,
            transactionDate: new Date(),
            submissionId: data.submissionId ?? null,
            redemptionId: data.redemptionId ?? null,
        })
        .returning()

    return result[0]
}
