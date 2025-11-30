'use server'
import {db} from '../index'
import {reward, redemption} from '../schema'

import type {Reward} from '@/types/db'

import {and, count, eq, inArray, sql} from 'drizzle-orm'

export async function createReward(data: {
    courseId: number
    name: string
    description?: string
    cost: number
    quantityLimit?: number
    type?: 'unspecified'
    active?: boolean
}): Promise<Reward> {
    const result = await db
        .insert(reward)
        .values({
            courseId: data.courseId,
            createdDate: new Date(),
            name: data.name,
            description: data.description ?? null,
            cost: data.cost,
            quantityLimit: data.quantityLimit ?? null,
            type: data.type ?? 'unspecified',
            active: data.active ?? true,
        })
        .returning()

    return result[0]
}

export async function getRewardsByCourse(courseId: number): Promise<Reward[]> {
    return db.select().from(reward).where(eq(reward.courseId, courseId))
}

export async function getRewardsByCourseWithStats(courseId: number): Promise<
    Array<{
        reward: Reward
        redeemed: number
        available: number | null
        isAvailable: boolean
    }>
> {
    const results = await db
        .select({
            reward: reward,
            redemptionCount: count(redemption.id),
        })
        .from(reward)
        .leftJoin(
            redemption,
            and(
                eq(redemption.rewardId, reward.id),
                inArray(redemption.status, ['pending', 'fulfilled'])
            )
        )
        .where(eq(reward.courseId, courseId))
        .groupBy(reward.id)

    return results.map((r) => ({
        reward: r.reward,
        redeemed: Number(r.redemptionCount),
        available:
            r.reward.quantityLimit === null ?
                null
            :   r.reward.quantityLimit - Number(r.redemptionCount),
        isAvailable:
            r.reward.active &&
            (r.reward.quantityLimit === null ||
                Number(r.redemptionCount) < r.reward.quantityLimit),
    }))
}

// for use in updating rewards to avoid race conditions
// uses a transaction to ensure the correct value is returned
export async function getRewardIfAvailableForUpdate(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    rewardId: number
): Promise<{reward: Reward; available: number | null} | null> {
    // create a transaction to lock the reward while updating
    const rewardData = await tx.execute(
        sql`SELECT * FROM reward WHERE id = ${rewardId} FOR UPDATE`
    )

    if (!rewardData.rows[0]) return null

    const rewardRow = rewardData.rows[0] as Reward
    if (!rewardRow.active) return null

    // count the current redemptions first
    const redeemed = await tx
        .select({count: count()})
        .from(redemption)
        .where(
            and(
                eq(redemption.rewardId, rewardId),
                inArray(redemption.status, ['pending', 'fulfilled'])
            )
        )

    const redeemedCount = Number(redeemed[0].count)

    if (
        rewardRow.quantityLimit !== null &&
        redeemedCount >= rewardRow.quantityLimit
    ) {
        return null
    }

    return {
        reward: rewardRow,
        available:
            rewardRow.quantityLimit === null ?
                null
            :   rewardRow.quantityLimit - redeemedCount,
    }
}
