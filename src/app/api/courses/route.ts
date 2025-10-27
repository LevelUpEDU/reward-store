import {NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
// 假设你已经配置好了 next-auth
import {authOptions} from '../auth/[...nextauth]/route' // 确保路径正确
import {db} from '@/db' // 确保路径正确
import {course} from '@/db/schema' // 确保路径正确

export async function POST(request: Request) {
    // 1. 验证用户是否登录
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({message: 'Not authenticated'}, {status: 401})
    }

    try {
        const {title, description} = await request.json()

        if (!title || title.trim() === '') {
            return NextResponse.json(
                {message: 'Title is required'},
                {status: 400}
            )
        }

        // 2. 使用 Drizzle 向数据库插入新课程
        // id 和 courseCode 都是自动生成的！
        await db.insert(course).values({
            title,
            description,
            instructorEmail: session.user.email,
        })

        return NextResponse.json(
            {message: 'Course created successfully'},
            {status: 201}
        )
    } catch (error) {
        console.error('Failed to create course:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}

// 我们也顺便创建一个 GET 方法来获取课程列表
export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({message: 'Not authenticated'}, {status: 401})
    }

    try {
        const instructorCourses = await db.query.course.findMany({
            where: (courses, {eq}) =>
                eq(courses.instructorEmail, session.user!.email!),
        })
        return NextResponse.json(instructorCourses, {status: 200})
    } catch (error) {
        console.error('Failed to fetch courses:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
