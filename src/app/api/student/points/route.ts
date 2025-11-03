import {getStudentPoints} from '@/db/queries/student'
import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email')
    if (!email) {
        return NextResponse.json({error: 'Missing email'}, {status: 400})
    }

    try {
        const points = await getStudentPoints(email)
        return NextResponse.json({points})
    } catch (err) {
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}
