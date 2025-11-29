import {auth0} from '@/lib/auth0'
import {NextResponse, type NextRequest} from 'next/server'
import {db} from '@/db'
import {redemption, transaction} from '@/db/schema'
import {getStudentPoints} from '@/db/queries/student'
import {getRewardIfAvailableForUpdate} from '@/db/queries/reward'

export async function POST(req: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const studentEmail = session.user.email
        const body = await req.json()
        const {rewardId} = body

        if (!rewardId || typeof rewardId !== 'number') {
            return NextResponse.json(
                {error: 'Missing or invalid rewardId'},
                {status: 400}
            )
        }

        // track the students points before the transaction (we'll check again to be safe)
        const currentPoints = await getStudentPoints(studentEmail)

        // create a transaction to avoid race conditions
        const result = await db.transaction(async (tx) => {
            const rewardData = await getRewardIfAvailableForUpdate(tx, rewardId)
            if (!rewardData) {
                throw new Error('REWARD_NOT_AVAILABLE')
            }

            const {reward} = rewardData

            // verify points again
            if (currentPoints < reward.cost) {
                throw new Error('INSUFFICIENT_POINTS')
            }

            // create a new redemption
            // this will be required for the student to "redeem"
            // their award in the future since the instructor needs
            // some sort of notification
            const [newRedemption] = await tx
                .insert(redemption)
                .values({
                    studentId: studentEmail,
                    rewardId: rewardId,
                    redemptionDate: new Date(),
                    status: 'pending',
                })
                .returning()

            // create a transaction
            const [newTransaction] = await tx
                .insert(transaction)
                .values({
                    studentId: studentEmail,
                    points: -reward.cost,
                    transactionDate: new Date(),
                    redemptionId: newRedemption.id,
                })
                .returning()

            return {
                redemption: newRedemption,
                transaction: newTransaction,
                cost: reward.cost,
            }
        })

        return NextResponse.json({
            success: true,
            redemptionId: result.redemption.id,
            newBalance: currentPoints - result.cost,
        })
    } catch (err) {
        const message = (err as Error).message

        if (message === 'REWARD_NOT_AVAILABLE') {
            return NextResponse.json(
                {error: 'Reward is no longer available'},
                {status: 409}
            )
        }

        if (message === 'INSUFFICIENT_POINTS') {
            return NextResponse.json(
                {error: 'Insufficient points'},
                {status: 400}
            )
        }

        console.error('Purchase failed:', err)
        return NextResponse.json({error: 'Purchase failed'}, {status: 500})
    }
}
