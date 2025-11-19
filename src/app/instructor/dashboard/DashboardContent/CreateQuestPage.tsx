'use client'

import {useState, useEffect} from 'react'
import {useAuth} from '@/app/hooks/useAuth'
import {getCoursesByInstructor} from '@/db/queries/course'
import {createQuest, getQuestById, updateQuest} from '@/db/queries/quest'
import {toast} from 'sonner'

type CreateQuestPageProps = {
    setActiveTab: (tab: string) => void
    preselectedCourseId?: number
    questIdToEdit?: number
}

type Course = {
    id: number
    title: string
    courseCode: string
}

export default function CreateQuestPage({
    setActiveTab,
    preselectedCourseId,
    questIdToEdit,
}: CreateQuestPageProps) {
    const {email} = useAuth()
    const [formData, setFormData] = useState({
        title: '',
        points: 10,
        courseId: preselectedCourseId ? preselectedCourseId.toString() : '',
        expirationDate: '',
    })
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingCourses, setIsLoadingCourses] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isInitializingQuest, setIsInitializingQuest] = useState(
        Boolean(questIdToEdit)
    )

    useEffect(() => {
        const fetchCourses = async () => {
            if (!email) return

            try {
                const coursesData = await getCoursesByInstructor(email)
                setCourses(coursesData)
            } catch (error) {
                setError(`${error}`)
            } finally {
                setIsLoadingCourses(false)
            }
        }

        fetchCourses()
    }, [email])

    useEffect(() => {
        if (!questIdToEdit || !email) {
            setIsInitializingQuest(false)
            return
        }

        let isMounted = true

        const loadQuest = async () => {
            setIsInitializingQuest(true)
            try {
                const quest = await getQuestById(questIdToEdit)

                if (!quest) {
                    throw new Error('Quest not found.')
                }

                if (!isMounted) return

                const expirationValue =
                    quest.expirationDate ?
                        formatDateForInput(new Date(quest.expirationDate))
                    :   ''

                setFormData({
                    title: quest.title,
                    points: quest.points,
                    courseId: quest.courseId.toString(),
                    expirationDate: expirationValue,
                })
                setError(null)
            } catch (err) {
                if (!isMounted) return
                setError(
                    err instanceof Error ?
                        err.message
                    :   'Failed to load quest details.'
                )
            } finally {
                if (isMounted) {
                    setIsInitializingQuest(false)
                }
            }
        }

        loadQuest()

        return () => {
            isMounted = false
        }
    }, [questIdToEdit, email])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const {name, value} = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'points' ? parseInt(value) || 0 : value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !formData.courseId) return

        setIsLoading(true)
        setError(null)

        try {
            const expirationDateValue =
                formData.expirationDate ?
                    new Date(formData.expirationDate)
                :   undefined

            if (questIdToEdit) {
                const updatedQuest = await updateQuest(questIdToEdit, email, {
                    title: formData.title,
                    points: formData.points,
                    courseId: parseInt(formData.courseId, 10),
                    expirationDate: expirationDateValue ?? null,
                })

                if (!updatedQuest) {
                    throw new Error(
                        'Unable to update quest. Please verify your access.'
                    )
                }

                toast('Quest updated successfully!')
            } else {
                await createQuest({
                    courseId: parseInt(formData.courseId, 10),
                    createdBy: email,
                    title: formData.title,
                    points: formData.points,
                    expirationDate: expirationDateValue,
                })

                // alert('Quest created successfully!')
                toast('Quest created successfully!')
            }

            setActiveTab('quests')
        } catch (error) {
            setError(
                `An error occurred while ${
                    questIdToEdit ? 'updating' : 'creating'
                } the quest: ${error}`
            )
        } finally {
            setIsLoading(false)
        }
    }

    const heading = questIdToEdit ? 'Edit Quest' : 'Create a New Quest'
    const isBusy = isLoading || isInitializingQuest

    return (
        <div className="page-content">
            <h1 className="page-title">{heading}</h1>
            <div className="settings-section">
                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="title">Quest Title</label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Complete the JavaScript Challenge"
                            required
                            disabled={isBusy}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="points">Points</label>
                        <input
                            id="points"
                            name="points"
                            type="number"
                            value={formData.points}
                            onChange={handleChange}
                            min="1"
                            required
                            disabled={isBusy}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="courseId">Course</label>
                        <select
                            id="courseId"
                            name="courseId"
                            value={formData.courseId}
                            onChange={handleChange}
                            required
                            disabled={isLoadingCourses || isBusy}>
                            <option value="">
                                {isLoadingCourses ?
                                    'Loading courses...'
                                :   'Select a course'}
                            </option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.title} ({course.courseCode})
                                </option>
                            ))}
                        </select>
                        {courses.length === 0 && !isLoadingCourses && (
                            <p
                                style={{
                                    color: '#ef4444',
                                    fontSize: '0.9rem',
                                    marginTop: '0.5rem',
                                }}>
                                No courses found. Please create a course first.
                            </p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="expirationDate">
                            Expiration Date (Optional)
                        </label>
                        <input
                            id="expirationDate"
                            name="expirationDate"
                            type="datetime-local"
                            value={formData.expirationDate}
                            onChange={handleChange}
                            disabled={isBusy}
                        />
                    </div>

                    {error && <p style={{color: '#ef4444'}}>{error}</p>}

                    <button
                        type="submit"
                        disabled={
                            isBusy ||
                            !formData.title.trim() ||
                            !formData.courseId ||
                            formData.points <= 0
                        }
                        className="save-btn">
                        {questIdToEdit ?
                            isLoading ?
                                'Saving...'
                            :   'Save Changes'
                        : isLoading ?
                            'Creating...'
                        :   'Create Quest'}
                    </button>
                </form>
            </div>
        </div>
    )
}

function formatDateForInput(date: Date) {
    const pad = (value: number) => value.toString().padStart(2, '0')
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())

    return `${year}-${month}-${day}T${hours}:${minutes}`
}
