import {auth0} from '@/lib/auth0'
import {type NextRequest, NextResponse} from 'next/server'

export async function GET(_request: NextRequest) {
    try {
        const session = await auth0.getSession()

        if (!session?.user) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        return NextResponse.json({
            email: session.user.email,
            name: session.user.name,
            sub: session.user.sub,
        })
    } catch (error) {
        console.error('Auth error:', error)
        return NextResponse.json({error: 'Failed to get user'}, {status: 500})
    }
}
