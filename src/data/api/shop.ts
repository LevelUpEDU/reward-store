/**
 * Client-side API wrapper for shop/rewards functionality
 * Used by UI components to fetch shop data and make purchases
 */

export interface ShopItem {
    id: number
    name: string
    cost: number
    quantityLimit: number | null
    available: number | null
}

export interface Course {
    id: number
    title: string
    courseCode: string
}

export interface StudentPoints {
    points: number
}

export interface PurchaseResult {
    newBalance: number
    redemption: {
        id: number
        rewardId: number
        studentId: string
    }
}

/**
 * Fetch student's current point balance
 */
export async function getStudentPoints(email: string): Promise<number> {
    const response = await fetch(
        `/api/student/points?email=${encodeURIComponent(email)}`
    )

    if (!response.ok) {
        throw new Error('Failed to fetch points')
    }

    const data: StudentPoints = await response.json()
    return data.points ?? 0
}

/**
 * Fetch all courses the student is registered for
 */
export async function getStudentCourses(): Promise<Course[]> {
    const response = await fetch('/api/student/available-courses')

    if (!response.ok) {
        throw new Error('Failed to fetch courses')
    }

    const allCourses = await response.json()

    return allCourses
        .filter((c: {isRegistered: boolean}) => c.isRegistered)
        .map((c: {id: number; title: string; courseCode: string}) => ({
            id: c.id,
            title: c.title,
            courseCode: c.courseCode,
        }))
}

/**
 * Fetch available shop items (rewards) for a specific course
 */
export async function getShopItems(courseId: number): Promise<ShopItem[]> {
    const response = await fetch(`/api/rewards?courseId=${courseId}`)

    if (!response.ok) {
        throw new Error('Failed to fetch shop items')
    }

    const rewards = await response.json()
    const visibleRewards = rewards.filter((r: any) => r.reward.active)

    return visibleRewards.map(
        (entry: {
            reward: {
                id: number
                name: string
                cost: number
                quantityLimit: number | null
            }
            available: number | null
        }) => ({
            id: entry.reward.id,
            name: entry.reward.name,
            cost: entry.reward.cost,
            quantityLimit: entry.reward.quantityLimit,
            available: entry.available,
        })
    )
}

/**
 * Purchase a reward from the shop
 * Returns the new point balance after purchase
 */
export async function purchaseReward(
    rewardId: number
): Promise<PurchaseResult> {
    const response = await fetch('/api/rewards/purchase', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({rewardId}),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Purchase failed')
    }

    return await response.json()
}
