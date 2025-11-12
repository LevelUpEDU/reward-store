import {auth0} from '@/lib/auth0'
import {NextResponse, type NextRequest} from 'next/server'

export async function GET(req: NextRequest) {
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
            sub: session.user.sub, // Auth0 unique ID (use this as the identifier)
        })
    } catch (error) {
        return NextResponse.json(
            {error: (error as Error).message},
            {status: 500}
        )
    }
}
