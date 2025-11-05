'use client'

import React, {useState, useEffect} from 'react'
import {useAuth} from '@/app/hooks/useAuth'
import {getCourseById} from '@/db/queries/course'
import {getQuestsByCourse} from '@/db/queries/quest'
import type {Quest, Course as DbCourse} from '@/types/db'

type Course = {
    id: number
    title: string
    courseCode: string
    description: string | null
}

type CourseDetailPageProps = {
    courseId: number
    setActiveTab: (tab: string, courseId?: number) => void
    onBack: () => void
}

export default function CourseDetailPage({
    courseId,
    setActiveTab,
    onBack,
}: CourseDetailPageProps) {
    const {email} = useAuth()
    const [course, setCourse] = useState<Course | null>(null)
    const [quests, setQuests] = useState<Quest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCourseAndQuests = async () => {
            if (!email) return

            try {
                setIsLoading(true)

                const currentCourse = await getCourseById(courseId)
                if (!currentCourse) {
                    throw new Error('Course not found')
                }
                setCourse(currentCourse)

                const questsData = await getQuestsByCourse(courseId)
                setQuests(questsData)
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourseAndQuests()
    }, [courseId, email])

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

    const handleAddQuest = () => {
        setActiveTab('create_quest', courseId)
    }

    if (isLoading) {
        return (
            <div className="page-content">
                <p>Loading course details...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="page-content">
                <p style={{color: 'red'}}>{error}</p>
                <button onClick={onBack} className="save-btn">
                    Back to Courses
                </button>
            </div>
        )
    }

    return (
        <div className="page-content">
            <div className="course-header">
                <button onClick={onBack} className="back-btn">
                    ← Back to Courses
                </button>
                <div className="course-info">
                    <h1 className="page-title">{course?.title}</h1>
                    <p className="course-code">
                        Course Code: {course?.courseCode}
                    </p>
                    {course?.description && (
                        <p className="course-description">
                            {course.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="section-header">
                <h2 className="section-title">Quests ({quests.length})</h2>
                <button className="add-quest-btn" onClick={handleAddQuest}>
                    + Add Quest
                </button>
            </div>

            {quests.length > 0 ?
                <div className="quests-list">
                    {quests.map((quest) => (
                        <div key={quest.id} className="quest-item">
                            <div className="quest-info">
                                <div className="quest-header">
                                    <h3 className="quest-title">
                                        {quest.title}
                                    </h3>
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
                                <div className="quest-meta">
                                    <span className="quest-points">
                                        🏆 {quest.points} points
                                    </span>
                                    <span className="quest-date">
                                        Created:{' '}
                                        {new Date(
                                            quest.createdDate
                                        ).toLocaleDateString()}
                                    </span>
                                    {quest.expirationDate && (
                                        <span className="quest-expiration">
                                            Expires:{' '}
                                            {new Date(
                                                quest.expirationDate
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="quest-actions">
                                <button className="edit-quest-btn">Edit</button>
                                <button className="delete-quest-btn">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            :   <div className="empty-state">
                    <p>No quests created for this course yet.</p>
                    <button className="add-quest-btn" onClick={handleAddQuest}>
                        + Create Your First Quest
                    </button>
                </div>
            }
        </div>
    )
}
