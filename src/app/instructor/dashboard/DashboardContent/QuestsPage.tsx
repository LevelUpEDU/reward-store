'use client'

import React, {useState, useEffect} from 'react'

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

type Submission = {
    id: number
    studentId: string
    submissionDate: string
    status: 'pending' | 'approved' | 'rejected'
    verifiedBy?: string | null
    verifiedDate?: string | null
    student: {
        name: string
        email: string
    }
}

type QuestWithSubmissions = Quest & {
    submissions?: Submission[]
}

type QuestsPageProps = {
    setActiveTab: (tab: string) => void
}

const QuestsPage = ({setActiveTab}: QuestsPageProps) => {
    const [quests, setQuests] = useState<QuestWithSubmissions[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedQuest, setSelectedQuest] =
        useState<QuestWithSubmissions | null>(null)
    const [loadingQuestId, setLoadingQuestId] = useState<number | null>(null)

    useEffect(() => {
        const fetchQuests = async () => {
            try {
                const response = await fetch('/api/quests/instructor')
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

    const viewSubmissions = async (quest: Quest) => {
        setLoadingQuestId(quest.id)
        try {
            const response = await fetch(`/api/quests/${quest.id}/submissions`)
            if (!response.ok) {
                throw new Error('Failed to fetch submissions')
            }
            const data = await response.json()
            setSelectedQuest({
                ...quest,
                submissions: data.submissions,
            })
        } catch (err: any) {
            alert('Failed to load submissions: ' + err.message)
        } finally {
            setLoadingQuestId(null)
        }
    }

    const handleSubmissionAction = async (
        submissionId: number,
        action: 'approve' | 'reject'
    ) => {
        if (!selectedQuest) return

        try {
            const response = await fetch(
                `/api/quests/${selectedQuest.id}/submissions/${submissionId}`,
                {
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({action}),
                }
            )

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || 'Failed to process submission')
            }

            setSelectedQuest((prev) => {
                if (!prev) return null
                return {
                    ...prev,
                    submissions: prev.submissions?.map((sub) =>
                        sub.id === submissionId ?
                            {
                                ...sub,
                                status:
                                    action === 'approve' ? 'approved' : (
                                        'rejected'
                                    ),
                            }
                        :   sub
                    ),
                }
            })

            alert(`Submission ${action}d successfully!`)
        } catch (err: any) {
            alert('Failed to process submission: ' + err.message)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="status-badge pending">Pending</span>
            case 'approved':
                return <span className="status-badge approved">Approved</span>
            case 'rejected':
                return <span className="status-badge rejected">Rejected</span>
            default:
                return null
        }
    }

    if (isLoading) {
        return (
            <div className="page-content">
                <p>Loading quests...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="page-content">
                <p style={{color: 'red'}}>{error}</p>
            </div>
        )
    }

    return (
        <div className="page-content">
            <div className="section-header">
                <h1 className="page-title">All Quests</h1>
                <button
                    onClick={() => setActiveTab('create_quest')}
                    className="add-quest-btn">
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
                                    <span className="quest-course">
                                        Course:{' '}
                                        {quest.course?.title ||
                                            `Course ID: ${quest.courseId}`}
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
                                <button
                                    onClick={() => viewSubmissions(quest)}
                                    className="view-submissions-btn"
                                    disabled={loadingQuestId === quest.id}>
                                    {loadingQuestId === quest.id ?
                                        'Loading...'
                                    :   'View Submissions'}
                                </button>
                                <button className="edit-quest-btn">Edit</button>
                                <button className="delete-quest-btn">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            :   <div className="empty-state">
                    <p>
                        No quests created yet. Click "Add Quest" to create your
                        first quest!
                    </p>
                </div>
            }

            {selectedQuest && (
                <div
                    className="modal-overlay"
                    onClick={() => setSelectedQuest(null)}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Submissions for: {selectedQuest.title}</h2>
                            <button
                                className="close-modal-btn"
                                onClick={() => setSelectedQuest(null)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            {(
                                selectedQuest.submissions &&
                                selectedQuest.submissions.length > 0
                            ) ?
                                <div className="submissions-list">
                                    {selectedQuest.submissions.map(
                                        (submission) => (
                                            <div
                                                key={submission.id}
                                                className="submission-item">
                                                <div className="submission-info">
                                                    <div className="submission-header">
                                                        <h4>
                                                            {
                                                                submission
                                                                    .student
                                                                    .name
                                                            }
                                                        </h4>
                                                        <span className="student-email">
                                                            {
                                                                submission
                                                                    .student
                                                                    .email
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="submission-details">
                                                        <p>
                                                            Submitted:{' '}
                                                            {new Date(
                                                                submission.submissionDate
                                                            ).toLocaleDateString()}
                                                        </p>
                                                        {submission.verifiedDate && (
                                                            <p>
                                                                Reviewed:{' '}
                                                                {new Date(
                                                                    submission.verifiedDate
                                                                ).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="submission-status">
                                                        {getStatusBadge(
                                                            submission.status
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="submission-actions">
                                                    {submission.status ===
                                                        'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    handleSubmissionAction(
                                                                        submission.id,
                                                                        'approve'
                                                                    )
                                                                }
                                                                className="approve-btn">
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleSubmissionAction(
                                                                        submission.id,
                                                                        'reject'
                                                                    )
                                                                }
                                                                className="reject-btn">
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {submission.status !==
                                                        'pending' && (
                                                        <span className="processed-badge">
                                                            {(
                                                                submission.status ===
                                                                'approved'
                                                            ) ?
                                                                'Approved'
                                                            :   'Rejected'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            :   <div className="empty-submissions">
                                    <p>No submissions yet for this quest.</p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default QuestsPage
