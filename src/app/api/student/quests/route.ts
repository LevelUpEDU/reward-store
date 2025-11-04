import {NextResponse} from 'next/server'
import {db} from '@/db'
import {quest, course, registration, submission} from '@/db/schema'
import {eq, inArray} from 'drizzle-orm'

export async function GET() {
    try {
        // placeholder until oauth is working
        const studentEmail = 'student@bcit.ca'

        // Get all courses the student is registered for
        const studentRegistrations = await db.query.registration.findMany({
            where: eq(registration.studentId, studentEmail),
            columns: {courseId: true},
        })

        const registeredCourseIds = studentRegistrations.map(
            (reg) => reg.courseId
        )

        if (registeredCourseIds.length === 0) {
            return NextResponse.json([], {status: 200})
        }

        // Get all quests for courses the student is registered for
        const availableQuests = await db.query.quest.findMany({
            where: inArray(quest.courseId, registeredCourseIds),
            columns: {
                id: true,
                title: true,
                points: true,
                createdDate: true,
                expirationDate: true,
                courseId: true,
            },
            orderBy: (quests, {desc}) => [desc(quests.createdDate)],
        })

        // Get course information for each quest
        const questsWithCourses = await Promise.all(
            availableQuests.map(async (q) => {
                const courseDetails = await db.query.course.findFirst({
                    where: eq(course.id, q.courseId),
                    columns: {
                        title: true,
                        courseCode: true,
                    },
                })

                return {
                    ...q,
                    course: courseDetails || {
                        title: 'Unknown Course',
                        courseCode: 'N/A',
                    },
                }
            })
        )

        // Check which quests the student has already attended and their status
        const studentSubmissions = await db.query.submission.findMany({
            where: eq(submission.studentId, studentEmail),
            columns: {
                questId: true,
                status: true,
                submissionDate: true,
                verifiedDate: true,
            },
        })

        const submissionMap = new Map()
        studentSubmissions.forEach((sub) => {
            submissionMap.set(sub.questId, {
                status: sub.status,
                submissionDate: sub.submissionDate,
                verifiedDate: sub.verifiedDate,
            })
        })

        // Add submission status to each quest
        const questsWithAttendance = questsWithCourses.map((quest) => {
            const submission = submissionMap.get(quest.id)
            return {
                ...quest,
                isAttended: Boolean(submission),
                submissionStatus: submission?.status || null,
                submissionDate: submission?.submissionDate || null,
                verifiedDate: submission?.verifiedDate || null,
            }
        })

        return NextResponse.json(questsWithAttendance, {status: 200})
    } catch (error) {
        console.error('Failed to fetch student quests:', error)
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        )
    }
}
