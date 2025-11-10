'use client'

import React, {useState, useEffect} from 'react'
import {useAuth} from '@/app/hooks/useAuth'
import {deleteQuest, getQuestsByInstructor} from '@/db/queries/quest'
import {getSubmissionsByQuest, verifySubmission} from '@/db/queries/submission'
import type {Quest, Submission} from '@/types/db'

type QuestWithCourse = Quest & {
    course?: {
        title: string
        courseCode: string
    }
}

type SubmissionWithStudent = Submission & {
    student: {
        name: string
        email: string
    }
}

type QuestWithSubmissions = QuestWithCourse & {
    submissions?: SubmissionWithStudent[]
}

type QuestsPageProps = {
    setActiveTab: (tab: string) => void
}

const QuestsPage = ({setActiveTab}: QuestsPageProps) => {
    const {email} = useAuth()
    const [quests, setQuests] = useState<QuestWithSubmissions[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedQuest, setSelectedQuest] =
        useState<QuestWithSubmissions | null>(null)
    const [loadingQuestId, setLoadingQuestId] = useState<number | null>(null)
    const [deletingQuestId, setDeletingQuestId] = useState<number | null>(null)

    useEffect(() => {
        const fetchQuests = async () => {
            if (!email) return

            try {
                const data = await getQuestsByInstructor(email)
                setQuests(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
            } finally {
                setIsLoading(false)
            }
        }

        fetchQuests()
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

    const viewSubmissions = async (quest: QuestWithCourse) => {
        setLoadingQuestId(quest.id)
        try {
            const submissions = await getSubmissionsByQuest(quest.id)
            setSelectedQuest({
                ...quest,
                submissions: submissions,
            })
        } catch (err) {
            alert(
                'Failed to load submissions: ' +
                    (err instanceof Error ? err.message : String(err))
            )
        } finally {
            setLoadingQuestId(null)
        }
    }

    const handleSubmissionAction = async (
        submissionId: number,
        action: 'approve' | 'reject'
    ) => {
        if (!selectedQuest || !email) return

        try {
            await verifySubmission(submissionId, email, action === 'approve')

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
        } catch (err) {
            alert(
                'Failed to process submission: ' +
                    (err instanceof Error ? err.message : String(err))
            )
        }
    }

    const handleEditQuest = (questId: number) => {
        setActiveTab(`edit_quest_${questId}`)
    }

    const handleDeleteQuest = async (questId: number) => {
        if (!email) return

        const confirmDelete =
            typeof window !== 'undefined' ?
                window.confirm(
                    'Are you sure you want to delete this quest? This action cannot be undone.'
                )
            :   true

        if (!confirmDelete) return

        setDeletingQuestId(questId)

        try {
            const success = await deleteQuest(questId, email)

            if (!success) {
                throw new Error('Unable to delete the quest. Please try again.')
            }

            setQuests((prev) => prev.filter((quest) => quest.id !== questId))

            if (selectedQuest?.id === questId) {
                setSelectedQuest(null)
            }

            alert('Quest deleted successfully.')
        } catch (err) {
            alert(
                'Failed to delete quest: ' +
                    (err instanceof Error ? err.message : String(err))
            )
        } finally {
            setDeletingQuestId(null)
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
                                <button
                                    className="edit-quest-btn"
                                    onClick={() => handleEditQuest(quest.id)}>
                                    Edit
                                </button>
                                <button
                                    className="delete-quest-btn"
                                    onClick={() => handleDeleteQuest(quest.id)}
                                    disabled={deletingQuestId === quest.id}>
                                    {deletingQuestId === quest.id ?
                                        'Deleting...'
                                    :   'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            :   <div className="empty-state">
                    <p>
                        No quests created yet. Click &ldquo;Add Quest&rdquo; to
                        create your first quest!
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
