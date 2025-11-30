import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'
import {auth0} from './lib/auth0'

export async function middleware(request: NextRequest) {
    // let the session be available first
    const response = await auth0.middleware(request)

    if (request.nextUrl.pathname.startsWith('/instructor/dashboard')) {
        const session = await auth0.getSession(request)

        if (!session || !session.user) {
            return NextResponse.redirect(
                new URL('/api/auth/login', request.url)
            )
        }

        // check the role
        const roles =
            // use a fake
            session.user['https://my-learning-app.com/roles'] || []

        // kick the student back to the game
        if (!roles.includes('Instructor')) {
            return NextResponse.redirect(new URL('/game', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
}
