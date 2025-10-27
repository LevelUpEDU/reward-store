import {NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '../auth/[...nextauth]/route'
import {db} from '@/db'
import {quest} from '@/db/schema'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'src', 'data', 'quests.json')

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const {index, done} = body
        if (typeof index !== 'number' || typeof done !== 'boolean') {
            return NextResponse.json({error: 'Invalid payload'}, {status: 400})
        }

        let data = {quests: [] as any[]}
        if (fs.existsSync(dataPath)) {
            const raw = fs.readFileSync(dataPath, 'utf8')
            data = JSON.parse(raw)
        }

        if (!Array.isArray(data.quests)) data.quests = []

        // ensure index exists
        if (!data.quests[index]) {
            data.quests[index] = data.quests[index] || {
                title: `Quest ${index + 1}`,
                points: 0,
                done: false,
            }
        }

        data.quests[index].done = done

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')

        return NextResponse.json({ok: true, quests: data.quests})
    } catch (err) {
        return NextResponse.json({error: String(err)}, {status: 500})
    }
}

export async function POST(request: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                {message: 'Not authenticated'},
                {status: 401}
            )
        }

        const {title, points, courseId, expirationDate} = await request.json()

        if (!title || !points || !courseId) {
            return NextResponse.json(
                {message: 'Title, points, and courseId are required'},
                {status: 400}
            )
        }

        // Create quest in database
        const newQuest = await db
            .insert(quest)
            .values({
                title,
                points: parseInt(points),
                courseId: parseInt(courseId),
                createdBy: session.user.email,
                createdDate: new Date(),
                expirationDate:
                    expirationDate ? new Date(expirationDate) : null,
            })
            .returning()

        return NextResponse.json(
            {
                message: 'Quest created successfully',
                quest: newQuest[0],
            },
            {status: 201}
        )
    } catch (error) {
        console.error('Failed to create quest:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}

export async function GET() {
    try {
        if (!fs.existsSync(dataPath)) {
            return NextResponse.json({quests: []})
        }
        const raw = fs.readFileSync(dataPath, 'utf8')
        const data = JSON.parse(raw)
        return NextResponse.json(data)
    } catch (err) {
        return NextResponse.json({error: String(err)}, {status: 500})
    }
}
