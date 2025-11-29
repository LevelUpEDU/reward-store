import {auth0} from '@/lib/auth0'
import {NextResponse, type NextRequest} from 'next/server'
import {getStudentRedemptionsAggregated} from '@/db/queries/redemption'

export async function GET(req: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.email) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const {searchParams} = new URL(req.url)
        const courseId = searchParams.get('courseId')

        if (!courseId) {
            return NextResponse.json(
                {error: 'Course ID is required'},
                {status: 400}
            )
        }

        const redemptions = await getStudentRedemptionsAggregated(
            session.user.email,
            Number(courseId)
        )

        return NextResponse.json(redemptions)
    } catch (error) {
        console.error('Failed to fetch student redemptions:', error)
        return NextResponse.json(
            {error: 'Internal Server Error'},
            {status: 500}
        )
    }
}
