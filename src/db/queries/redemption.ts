import {db} from '..'
import {reward, redemption} from '../schema'
import {and, eq, count} from 'drizzle-orm'

export async function getStudentRedemptionsAggregated(
    studentEmail: string,
    courseId: number
) {
    return await db
        .select({
            id: reward.id,
            rewardName: reward.name,
            status: redemption.status,
            quantity: count(),
        })
        .from(redemption)
        .innerJoin(reward, eq(redemption.rewardId, reward.id))
        .where(
            and(
                eq(redemption.studentId, studentEmail),
                eq(reward.courseId, courseId)
            )
        )
        .groupBy(reward.id, reward.name, redemption.status)
}
