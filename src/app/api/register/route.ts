import {auth0} from '@/lib/auth0'
import {type NextRequest, NextResponse} from 'next/server'
import {db} from '@/db'
import {student, instructor} from '@/db/schema'
import {eq} from 'drizzle-orm'

type UserRole = 'student' | 'instructor'

interface RegisterBody {
    email: string
    name: string
    auth0Id: string
    role: UserRole
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth0.getSession()

        if (!session?.user) {
            return NextResponse.json(
                {error: 'Not authenticated'},
                {status: 401}
            )
        }

        const body: RegisterBody = await request.json()
        const {email, auth0Id, role} = body

        if (!['student', 'instructor'].includes(role)) {
            return NextResponse.json({error: 'Invalid role'}, {status: 400})
        }

        // check auth0_id and session match
        if (session.user.sub !== auth0Id) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 403})
        }

        // check if user already exists
        const table = role === 'student' ? student : instructor
        const existingUser = await db
            .select()
            .from(table)
            .where(eq(table.auth0Id, auth0Id))
            .limit(1)

        if (existingUser.length > 0) {
            return NextResponse.json(
                {error: 'User already registered'},
                {status: 409}
            )
        }

        // Check if email already exists
        const existingEmail = await db
            .select()
            .from(table)
            .where(eq(table.email, email))
            .limit(1)

        if (existingEmail.length > 0) {
            return NextResponse.json({error: 'Email in use'}, {status: 409})
        }

        // TODO: add back logic to create student
        //
        return NextResponse.json({success: true})
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json({error: 'Registration failed'}, {status: 500})
    }
}
