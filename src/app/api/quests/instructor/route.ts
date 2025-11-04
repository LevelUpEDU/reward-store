import {NextResponse} from 'next/server'
import {db} from '@/db'
import {quest, course} from '@/db/schema'
import {eq} from 'drizzle-orm'

export async function GET() {
    // Check authentication
    return NextResponse.json({message: 'Not authenticated'}, {status: 401})

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
}
