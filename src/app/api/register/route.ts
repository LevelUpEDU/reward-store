import {auth0} from '@/lib/auth0'
import {type NextRequest, NextResponse} from 'next/server'
import {student, instructor} from '@/db/schema'
import {eq} from 'drizzle-orm'
import {db, createStudent, createInstructor} from '@/db'

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
        const {email, name, auth0Id, role} = body

        if (!['student', 'instructor'].includes(role)) {
            return NextResponse.json({error: 'Invalid role'}, {status: 400})
        }

        if (session.user.sub !== auth0Id) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 403})
        }

        if (role === 'student') {
            const existingUser = await db
                .select()
                .from(student)
                .where(eq(student.auth0Id, auth0Id))
                .limit(1)

            if (existingUser.length > 0) {
                return NextResponse.json(
                    {error: 'User already registered'},
                    {status: 409}
                )
            }

            const existingEmail = await db
                .select()
                .from(student)
                .where(eq(student.email, email))
                .limit(1)

            if (existingEmail.length > 0) {
                return NextResponse.json({error: 'Email in use'}, {status: 409})
            }

            await createStudent(email, name, auth0Id)
        } else {
            const existingUser = await db
                .select()
                .from(instructor)
                .where(eq(instructor.auth0Id, auth0Id))
                .limit(1)

            if (existingUser.length > 0) {
                return NextResponse.json(
                    {error: 'User already registered'},
                    {status: 409}
                )
            }

            const existingEmail = await db
                .select()
                .from(instructor)
                .where(eq(instructor.email, email))
                .limit(1)

            if (existingEmail.length > 0) {
                return NextResponse.json({error: 'Email in use'}, {status: 409})
            }

            await createInstructor(email, name, auth0Id)
        }

        return NextResponse.json({success: true})
    } catch (error) {
        return NextResponse.json(
            {error: `Registration failed: ${error}`},
            {status: 500}
        )
    }
}
