import {auth0} from '@/lib/auth0'
import {NextResponse, type NextRequest} from 'next/server'
import {getRewardsByCourseWithStats} from '@/db/queries/reward'

export async function GET(req: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const courseId = req.nextUrl.searchParams.get('courseId')
        if (!courseId) {
            return NextResponse.json({error: 'Missing courseId'}, {status: 400})
        }

        const rewards = await getRewardsByCourseWithStats(Number(courseId))

        return NextResponse.json(rewards)
    } catch (err) {
        console.error('Failed to fetch rewards:', err)
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}
