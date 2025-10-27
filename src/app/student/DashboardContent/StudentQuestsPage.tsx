'use client'

import React, {useState, useEffect} from 'react'

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
    isAttended?: boolean
    submissionStatus?: 'pending' | 'approved' | 'rejected' | null
    submissionDate?: string | null
    verifiedDate?: string | null
}

type StudentQuestsPageProps = {
    setActiveTab: (tab: string) => void
}

const StudentQuestsPage = ({setActiveTab}: StudentQuestsPageProps) => {
    const [quests, setQuests] = useState<Quest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchQuests = async () => {
            try {
                const response = await fetch('/api/student/quests')
                if (!response.ok) {
                    throw new Error('Failed to fetch quests')
                }
                const data = await response.json()
                setQuests(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchQuests()
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

    const handleAttendQuest = async (questId: number) => {
        try {
            const response = await fetch('/api/student/attend-quest', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({questId}),
            })

            if (response.ok) {
                // Update the quest status locally
                setQuests((prevQuests) =>
                    prevQuests.map((quest) =>
                        quest.id === questId ?
                            {
                                ...quest,
                                isAttended: true,
                                submissionStatus: 'pending',
                                submissionDate: new Date().toISOString(),
                            }
                        :   quest
                    )
                )
                alert('Quest attended successfully!')
            } else {
                const data = await response.json()
                alert(data.message || 'Failed to attend quest')
            }
        } catch (err: any) {
            alert('Failed to attend quest')
        }
    }

    if (isLoading) {
        return (
            <div className="student-page-content">
                <p>Loading quests...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="student-page-content">
                <p style={{color: 'red'}}>{error}</p>
            </div>
        )
    }

    const attendedQuests = quests.filter((quest) => quest.isAttended)
    const availableQuests = quests.filter((quest) => !quest.isAttended)

    const getStatusBadge = (status: string | null | undefined) => {
        switch (status) {
            case 'pending':
                return <span className="status-badge pending"> Pending</span>
            case 'approved':
                return <span className="status-badge approved"> Approved</span>
            case 'rejected':
                return <span className="status-badge rejected"> Rejected</span>
            default:
                return null
        }
    }

    return (
        <div className="student-page-content">
            <div className="section-header">
                <h1 className="page-title">My Quests</h1>
                <button
                    onClick={() => window.location.reload()}
                    className="refresh-btn">
                    Refresh Quests
                </button>
            </div>

            <h3>Available Quests ({availableQuests.length})</h3>
            {availableQuests.length > 0 ?
                <div className="quests-list">
                    {availableQuests.map((quest) => (
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
                                    {quest.course.title} (
                                    {quest.course.courseCode}) • {quest.points}{' '}
                                    points
                                </p>
                                <p className="quest-dates">
                                    Created:{' '}
                                    {new Date(
                                        quest.createdDate
                                    ).toLocaleDateString()}
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
                            <button
                                onClick={() => handleAttendQuest(quest.id)}
                                className="attend-btn">
                                Attend Quest
                            </button>
                        </div>
                    ))}
                </div>
            :   <div className="empty-state">
                    <p>No available quests. Check back later for new quests!</p>
                </div>
            }

            {attendedQuests.length > 0 && (
                <>
                    <h3>My Submissions ({attendedQuests.length})</h3>
                    <div className="quests-list">
                        {attendedQuests.map((quest) => (
                            <div key={quest.id} className="quest-card attended">
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
                                        {quest.course.title} (
                                        {quest.course.courseCode}) •{' '}
                                        {quest.points} points
                                    </p>
                                    <p className="quest-dates">
                                        Created:{' '}
                                        {new Date(
                                            quest.createdDate
                                        ).toLocaleDateString()}
                                        {quest.expirationDate && (
                                            <span className="expiration">
                                                • Expires:{' '}
                                                {new Date(
                                                    quest.expirationDate
                                                ).toLocaleDateString()}
                                            </span>
                                        )}
                                    </p>
                                    {quest.submissionDate && (
                                        <p className="submission-date">
                                            Submitted:{' '}
                                            {new Date(
                                                quest.submissionDate
                                            ).toLocaleDateString()}
                                        </p>
                                    )}
                                    {quest.verifiedDate && (
                                        <p className="verified-date">
                                            Reviewed:{' '}
                                            {new Date(
                                                quest.verifiedDate
                                            ).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <div className="submission-status">
                                    {getStatusBadge(quest.submissionStatus)}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default StudentQuestsPage
