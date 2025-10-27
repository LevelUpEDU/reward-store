import {NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '../../auth/[...nextauth]/route'
import {db} from '@/db'
import {quest, course} from '@/db/schema'
import {eq} from 'drizzle-orm'

export async function GET() {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                {message: 'Not authenticated'},
                {status: 401}
            )
        }

        // Fetch all quests created by the instructor
        const instructorQuests = await db.query.quest.findMany({
            where: eq(quest.createdBy, session.user.email),
            orderBy: (quests, {desc}) => [desc(quests.createdDate)],
        })

        // Fetch course information for each quest
        const questsWithCourses = await Promise.all(
            instructorQuests.map(async (q) => {
                const courseInfo = await db.query.course.findFirst({
                    where: eq(course.id, q.courseId),
                    columns: {
                        title: true,
                        courseCode: true,
                    },
                })

                return {
                    ...q,
                    course: courseInfo,
                }
            })
        )

        return NextResponse.json(questsWithCourses, {status: 200})
    } catch (error) {
        console.error('Failed to fetch instructor quests:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
