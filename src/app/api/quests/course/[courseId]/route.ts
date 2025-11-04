import {NextResponse} from 'next/server'
import {db} from '@/db'
import {quest} from '@/db/schema'
import {eq} from 'drizzle-orm'

export async function GET(_request: Request) {
    try {
        const courseId = 6
        if (isNaN(courseId)) {
            return NextResponse.json(
                {message: 'Invalid course ID'},
                {status: 400}
            )
        }

        // Fetch quests for the specific course
        const quests = await db.query.quest.findMany({
            where: eq(quest.courseId, courseId),
            orderBy: (quests, {desc}) => [desc(quests.createdDate)],
        })

        return NextResponse.json(quests, {status: 200})
    } catch (error) {
        console.error('Failed to fetch quests:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
