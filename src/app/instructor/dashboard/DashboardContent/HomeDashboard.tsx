'use client'

import React, {useState, useEffect} from 'react'
import CourseCard from '../CourseCard/CourseCard'
import {useAuth} from '@/app/hooks/useAuth'
import {getCoursesByInstructor, getQuestsByCourse} from '@/db'

type Course = {
    id: number
    title: string
    courseCode: string
    description: string | null
}

type Quest = {
    id: number
    title: string
    points: number
    createdDate: string
    expirationDate?: string
    courseId: number
    course?: {
        title: string
        courseCode: string
    }
}

type HomeDashboardProps = {
    setActiveTab: (tab: string) => void
}

const HomeDashboard = ({setActiveTab}: HomeDashboardProps) => {
    const {email} = useAuth()
    const [courses, setCourses] = useState<Course[]>([])
    const [quests, setQuests] = useState<Quest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [_error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            // this will never be true since we are always logged in here
            if (!email) return
            const courses = await getCoursesByInstructor(email)

            /*
               returns all quests by course with the structure:
              {
                 "Computer Science": [quest1, quest2, quest3],
                 "Math": [quest1, quest2, quest3]
              }
             */
            const quests = Object.fromEntries(
                await Promise.all(
                    courses.map(async (course) => [
                        course.title,
                        await getQuestsByCourse(course.id),
                    ])
                )
            )

            const allQuestArrays: Quest[][] = Object.values(quests)
            const allQuests = Object.values(quests).flat() as Quest[]
            const mostRecent = allQuests
                .sort(
                    (a, b) =>
                        new Date(b.createdDate).getTime() -
                        new Date(a.createdDate).getTime()
                )
                .slice(0, 4)

            setQuests(mostRecent)
            setCourses(courses)
        }
        fetchData()
    }, [email])

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

    const handleCourseClick = (courseId: number) => {
        setActiveTab(`course_detail_${courseId}`)
    }

    // if (isLoading) {
    //     return (
    //         <div className="dashboard-home">
    //             <div className="welcome-banner">
    //                 <div className="welcome-content">
    //                     <h1 className="welcome-title">Hi, Instructor!</h1>
    //                 </div>
    //                 <div className="welcome-date">
    //                     {new Date().toLocaleDateString('en-US', {
    //                         weekday: 'long',
    //                         year: 'numeric',
    //                         month: 'long',
    //                         day: 'numeric',
    //                     })}
    //                 </div>
    //             </div>
    //             <p>Loading...</p>
    //         </div>
    //     )
    // }

    return (
        <div className="dashboard-home">
            <div className="welcome-banner">
                <div className="welcome-content">
                    <h1 className="welcome-title">Hi, Instructor!</h1>
                </div>
                <div className="welcome-date">
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </div>
            </div>

            <div className="section-header">
                <h2 className="section-title">My Courses</h2>
                <button
                    className="add-course-btn"
                    onClick={() => setActiveTab('create_course')}>
                    + Add Course
                </button>
            </div>

            {courses.length > 0 ?
                <div className="courses-grid">
                    {courses.slice(0, 4).map((course) => (
                        <CourseCard
                            key={course.id}
                            id={course.id}
                            title={course.title}
                            courseCode={course.courseCode}
                            description={course.description}
                            onClick={handleCourseClick}
                        />
                    ))}
                </div>
            :   <div className="empty-state">
                    <p>
                        No courses created yet. Click &ldquo;Add Course&rdquo;
                        to get started!
                    </p>
                </div>
            }

            <div className="section-header">
                <h2 className="section-title">Recent Quests</h2>
                <button
                    className="add-quest-btn"
                    onClick={() => setActiveTab('create_quest')}>
                    + Add Quest
                </button>
            </div>

            {quests.length > 0 ?
                <div className="quests-preview-list">
                    {quests.map((quest) => (
                        <div key={quest.id} className="quest-preview-item">
                            <div className="quest-preview-info">
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
                                <p>
                                    {quest.course?.title ||
                                        `Course ID: ${quest.courseId}`}{' '}
                                    • {quest.points} points
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            :   <div className="quests-preview">
                    <p>
                        No quests created yet. Click &ldquo;Add Quest&rdquo; to
                        create your first quest!
                    </p>
                </div>
            }
        </div>
    )
}

export default HomeDashboard
