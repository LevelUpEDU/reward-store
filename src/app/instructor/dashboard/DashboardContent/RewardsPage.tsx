'use client'

import React, {useState, useEffect} from 'react'
import {useAuth} from '@/app/hooks/useAuth'
import {getCoursesByInstructor} from '@/db/queries/course'
import {getRewardsByCourse, createReward} from '@/db/queries/reward'
import type {Reward} from '@/types/db'
import {toast} from 'sonner'

type RewardWithCourse = Reward & {
    courseId: number
}

type Course = {
    id: number
    title: string
    courseCode: string
}

const RewardsPage = () => {
    const {email} = useAuth()
    const [rewards, setRewards] = useState<RewardWithCourse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [courses, setCourses] = useState<Course[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState({
        courseId: '',
        name: '',
        description: '',
        cost: '',
        quantityLimit: '',
    })

    useEffect(() => {
        const fetchData = async () => {
            if (!email) return

            try {
                const coursesData = await getCoursesByInstructor(email)
                setCourses(coursesData)

                const allRewards: RewardWithCourse[] = []

                for (const course of coursesData) {
                    const courseRewards = await getRewardsByCourse(course.id)
                    allRewards.push(...courseRewards)
                }

                setRewards(allRewards)
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [email])

    const handleAddReward = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setIsCreating(true)
        setError(null)

        try {
            const newReward = await createReward({
                courseId: parseInt(formData.courseId),
                name: formData.name,
                description: formData.description || undefined,
                cost: parseInt(formData.cost),
                quantityLimit:
                    formData.quantityLimit ?
                        parseInt(formData.quantityLimit)
                    :   undefined,
            })

            // Refresh rewards list
            const coursesData = await getCoursesByInstructor(email)
            const allRewards: RewardWithCourse[] = []

            for (const course of coursesData) {
                const courseRewards = await getRewardsByCourse(course.id)
                allRewards.push(...courseRewards)
            }

            setRewards(allRewards)
            setShowAddForm(false)
            setFormData({
                courseId: '',
                name: '',
                description: '',
                cost: '',
                quantityLimit: '',
            })
            toast('Reward created successfully!')
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to create reward'
            )
        } finally {
            setIsCreating(false)
        }
    }

    if (isLoading) {
        return (
            <div className="page-content">
                <p>Loading rewards...</p>
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
                <h1 className="page-title">Rewards Management</h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="add-quest-btn">
                    + Add Reward
                </button>
            </div>

            <div className="student-table">
                <div
                    className="table-header"
                    style={{gridTemplateColumns: '1fr 1fr 2fr 1fr'}}>
                    <div>ID</div>
                    <div>Course ID</div>
                    <div>Name</div>
                    <div>Cost</div>
                </div>

                {rewards.length > 0 ?
                    rewards.map((reward) => (
                        <div
                            key={reward.id}
                            className="table-row"
                            style={{gridTemplateColumns: '1fr 1fr 2fr 1fr'}}>
                            <div>{reward.id}</div>
                            <div>{reward.courseId}</div>
                            <div>{reward.name}</div>
                            <div>{reward.cost}</div>
                        </div>
                    ))
                :   <div className="empty-state">
                        <p>No rewards found.</p>
                    </div>
                }
            </div>

            {showAddForm && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowAddForm(false)}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Reward</h2>
                            <button
                                className="close-modal-btn"
                                onClick={() => setShowAddForm(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <form
                                onSubmit={handleAddReward}
                                className="settings-form">
                                <div className="form-group">
                                    <label htmlFor="courseId">Course</label>
                                    <select
                                        id="courseId"
                                        value={formData.courseId}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                courseId: e.target.value,
                                            })
                                        }
                                        required>
                                        <option value="">
                                            Select a course
                                        </option>
                                        {courses.map((course) => (
                                            <option
                                                key={course.id}
                                                value={course.id}>
                                                {course.title} (
                                                {course.courseCode})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="Reward name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="description">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        rows={3}
                                        placeholder="Reward description"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="cost">Cost</label>
                                    <input
                                        id="cost"
                                        type="number"
                                        value={formData.cost}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                cost: e.target.value,
                                            })
                                        }
                                        placeholder="Points cost"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="quantityLimit">
                                        Quantity Limit (Optional)
                                    </label>
                                    <input
                                        id="quantityLimit"
                                        type="number"
                                        value={formData.quantityLimit}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                quantityLimit: e.target.value,
                                            })
                                        }
                                        placeholder="Maximum quantity"
                                        min="1"
                                    />
                                </div>
                                {error && (
                                    <p style={{color: '#ef4444'}}>{error}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="save-btn">
                                    {isCreating ?
                                        'Creating...'
                                    :   'Create Reward'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RewardsPage
