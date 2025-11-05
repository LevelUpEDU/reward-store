'use server'
import {db} from '../index'
import {reward, redemption} from '../schema'

import type {Reward} from '@/types/db'

import {and, count, eq, inArray} from 'drizzle-orm'

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

export async function getRewardIfAvailable(
    rewardId: number
): Promise<Reward | null> {
    const rewardData = await getRewardById(rewardId)
    if (!rewardData || !rewardData.active) return null

    if (rewardData.quantityLimit !== null) {
        const redeemed = await db
            .select({count: count()})
            .from(redemption)
            .where(
                and(
                    eq(redemption.rewardId, rewardId),
                    inArray(redemption.status, ['pending', 'fulfilled'])
                )
            )

        if (Number(redeemed[0].count) >= rewardData.quantityLimit) {
            return null
        }
    }
    return rewardData
}

export async function getAvailableRewards(courseId: number): Promise<Reward[]> {
    return db
        .select()
        .from(reward)
        .where(and(eq(reward.courseId, courseId), eq(reward.active, true)))
}

export async function getRewardsByCourse(courseId: number): Promise<Reward[]> {
    return db.select().from(reward).where(eq(reward.courseId, courseId))
}

export async function getRewardStatsById(rewardId: number): Promise<{
    reward: Reward
    limit: number | null
    redeemed: number
    available: number | null
    isAvailable: boolean
}> {
    const rewardData = await db
        .select()
        .from(reward)
        .where(eq(reward.id, rewardId))
        .limit(1)

    if (!rewardData[0]) throw new Error('Reward not found')

    const redeemed = await db
        .select({count: count()})
        .from(redemption)
        .where(
            and(
                eq(redemption.rewardId, rewardId),
                inArray(redemption.status, ['pending', 'fulfilled'])
            )
        )

    const limit = rewardData[0].quantityLimit
    const redeemedCount = Number(redeemed[0].count)

    return {
        reward: rewardData[0],
        limit,
        redeemed: redeemedCount,
        available: limit === null ? null : limit - redeemedCount,
        isAvailable:
            rewardData[0].active && (limit === null || redeemedCount < limit),
    }
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

export async function getRewardById(rewardId: number): Promise<Reward | null> {
    const result = await db
        .select()
        .from(reward)
        .where(eq(reward.id, rewardId))
        .limit(1)

    return result[0] ?? null
}
