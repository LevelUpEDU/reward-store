'use client'

import React, {useState, useEffect} from 'react'
import {useSession} from 'next-auth/react'

type Course = {
    id: number
    title: string
    courseCode: string
    description: string | null
    instructorName: string
}

type Quest = {
    id: number
    title: string
    points: number
    createdDate: string
    expirationDate?: string
    courseId: number
    course: {
        title: string
        courseCode: string
    }
}

type StudentHomePageProps = {
    setActiveTab: (tab: string) => void
}

const StudentHomePage = ({setActiveTab}: StudentHomePageProps) => {
    const {data: session} = useSession()
    const [courses, setCourses] = useState<Course[]>([])
    const [quests, setQuests] = useState<Quest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesResponse, questsResponse] = await Promise.all([
                    fetch('/api/student/courses'),
                    fetch('/api/student/quests'),
                ])

                if (!coursesResponse.ok || !questsResponse.ok) {
                    throw new Error('Failed to fetch data')
                }

                const [coursesData, questsData] = await Promise.all([
                    coursesResponse.json(),
                    questsResponse.json(),
                ])

                setCourses(coursesData)
                setQuests(questsData.slice(0, 5))
            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const copyQuestId = (questId: number) => {
        navigator.clipboard
            .writeText(questId.toString())
            .then(() => {
                alert('Quest ID copied to clipboard!')
            })
            .catch(() => {
                alert('Failed to copy Quest ID')
            })
    }

    if (isLoading) {
        return (
            <div className="student-page-content">
                <div className="welcome-banner">
                    <h1>Welcome, {session?.user?.name}!</h1>
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="student-page-content">
            <div className="welcome-banner">
                <h1>Welcome, {session?.user?.name}!</h1>
                <p>Here's your learning overview</p>
            </div>

            <div className="section-header">
                <h2 className="section-title">My Courses ({courses.length})</h2>
                <button
                    onClick={() => setActiveTab('courses')}
                    className="view-all-btn">
                    View All
                </button>
            </div>

            {courses.length > 0 ?
                <div className="courses-grid">
                    {courses.slice(0, 3).map((course) => (
                        <div key={course.id} className="course-card">
                            <div className="course-info">
                                <h3>{course.title}</h3>
                                <p className="course-code">
                                    {course.courseCode}
                                </p>
                                <p className="instructor">
                                    Instructor: {course.instructorName}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            :   <div className="empty-state">
                    <p>
                        No courses registered yet.{' '}
                        <button
                            onClick={() => setActiveTab('courses')}
                            className="link-btn">
                            Register for courses
                        </button>
                    </p>
                </div>
            }

            <div className="section-header">
                <h2 className="section-title">
                    Available Quests ({quests.length})
                </h2>
                <button
                    onClick={() => setActiveTab('quests')}
                    className="view-all-btn">
                    View All
                </button>
            </div>

            {quests.length > 0 ?
                <div className="quests-list">
                    {quests.map((quest) => (
                        <div key={quest.id} className="quest-card">
                            <div className="quest-info">
                                <div className="quest-header">
                                    <h4>{quest.title}</h4>
                                    <div className="quest-id-section">
                                        <span className="quest-id">
                                            ID: {quest.id}
                                        </span>
                                        <button
                                            onClick={() =>
                                                copyQuestId(quest.id)
                                            }
                                            className="copy-btn"
                                            title="Copy Quest ID">
                                            Copy
                                        </button>
                                    </div>
                                </div>
                                <p className="quest-meta">
                                    {quest.course.title} • {quest.points} points
                                    {quest.expirationDate && (
                                        <span className="expiration">
                                            • Expires:{' '}
                                            {new Date(
                                                quest.expirationDate
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            :   <div className="empty-state">
                    <p>
                        No quests available.{' '}
                        <button
                            onClick={() => setActiveTab('quests')}
                            className="link-btn">
                            Browse quests
                        </button>
                    </p>
                </div>
            }
        </div>
    )
}

export default StudentHomePage
