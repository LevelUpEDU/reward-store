import {getStudentCourses} from '@/db/queries/course'
import {NextResponse, type NextRequest} from 'next/server'

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email')
    if (!email) {
        return NextResponse.json({error: 'Missing email'}, {status: 400})
    }

    try {
        const courses = await getStudentCourses(email)
        return NextResponse.json({courses})
    } catch (err) {
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}
