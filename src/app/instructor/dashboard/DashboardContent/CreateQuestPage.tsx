'use client'

import {useState, useEffect} from 'react'
import {useAuth} from '@/app/hooks/useAuth'
import {getCoursesByInstructor} from '@/db/queries/course'
import {createQuest} from '@/db/queries/quest'

type CreateQuestPageProps = {
    setActiveTab: (tab: 'quests') => void
    preselectedCourseId?: number
}

type Course = {
    id: number
    title: string
    courseCode: string
}

export default function CreateQuestPage({
    setActiveTab,
    preselectedCourseId,
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
        if (!email) return

        setIsLoading(true)
        setError(null)

        try {
            await createQuest({
                courseId: parseInt(formData.courseId),
                createdBy: email,
                title: formData.title,
                points: formData.points,
                expirationDate:
                    formData.expirationDate ?
                        new Date(formData.expirationDate)
                    :   undefined,
            })

            alert('Quest created successfully!')
            setActiveTab('quests')
        } catch (error) {
            setError(`An error occurred while creating the quest: ${error}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="page-content">
            <h1 className="page-title">Create a New Quest</h1>
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
                            disabled={isLoadingCourses}>
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
                        />
                    </div>

                    {error && <p style={{color: '#ef4444'}}>{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="save-btn">
                        {isLoading ? 'Creating...' : 'Create Quest'}
                    </button>
                </form>
            </div>
        </div>
    )
}
