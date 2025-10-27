import {NextResponse} from 'next/server'
import {db} from '@/db'
import {student, instructor} from '@/db/schema'
import {eq} from 'drizzle-orm'
import * as bcrypt from 'bcrypt'

export async function POST(request: Request) {
    try {
        const {name, email, password, userType} = await request.json()

        // Validation
        if (!name || !email || !password || !userType) {
            return NextResponse.json(
                {message: 'All fields are required'},
                {status: 400}
            )
        }

        if (userType !== 'student' && userType !== 'instructor') {
            return NextResponse.json(
                {message: 'Invalid user type'},
                {status: 400}
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                {message: 'Password must be at least 6 characters long'},
                {status: 400}
            )
        }

        // Check if user already exists
        let existingUser = null
        if (userType === 'student') {
            existingUser = await db.query.student.findFirst({
                where: eq(student.email, email),
            })
        } else {
            existingUser = await db.query.instructor.findFirst({
                where: eq(instructor.email, email),
            })
        }

        if (existingUser) {
            return NextResponse.json(
                {message: 'User with this email already exists'},
                {status: 409}
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        if (userType === 'student') {
            await db.insert(student).values({
                email,
                name,
                password: hashedPassword,
            })
        } else {
            await db.insert(instructor).values({
                email,
                name,
                password: hashedPassword,
            })
        }

        return NextResponse.json(
            {message: 'User created successfully'},
            {status: 201}
        )
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
