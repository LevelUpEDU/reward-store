import {getClaimedSubmissionIds} from '@/db/queries/transaction'

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email')
    if (!email) {
        return NextResponse.json({error: 'Missing email'}, {status: 400})
    }
    try {
        const claimedIds = await getClaimedSubmissionIds(email)
        return NextResponse.json({claimedSubmissionIds: claimedIds})
    } catch (err) {
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}

import {NextRequest, NextResponse} from 'next/server'
import {createTransaction} from '@/db/queries/transaction'

export async function POST(req: NextRequest) {
    try {
        const {email, points, submissionId} = await req.json()
        if (!email || !points || !submissionId) {
            return NextResponse.json(
                {error: 'Missing required fields'},
                {status: 400}
            )
        }

        // Call the actual DB logic
        const result = await createTransaction({email, points, submissionId})
        if (!result) throw new Error('Transaction failed')
        return NextResponse.json({success: true, transaction: result})
    } catch (err) {
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}
