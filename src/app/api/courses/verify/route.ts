import {NextResponse, type NextRequest} from 'next/server'
import {getCourseByCode} from '@/db/queries/course'

export async function GET(req: NextRequest) {
    const courseCode = req.nextUrl.searchParams.get('code')

    if (!courseCode) {
        return NextResponse.json(
            {error: 'Course code is required'},
            {status: 400}
        )
    }

    if (courseCode.length !== 6) {
        return NextResponse.json(
            {error: 'Course code must be 6 digits'},
            {status: 400}
        )
    }

    try {
        const course = await getCourseByCode(courseCode)

        if (!course) {
            return NextResponse.json({error: 'Course not found'}, {status: 404})
        }

        return NextResponse.json({
            id: course.id,
            courseCode: course.courseCode,
            title: course.title,
            description: course.description,
            instructorName: course.instructorName,
        })
    } catch (err) {
        return NextResponse.json({error: (err as Error).message}, {status: 500})
    }
}
