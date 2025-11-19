'use client'

import {useState} from 'react'
import {useAuth} from '@/app/hooks/useAuth'
import {createCourse} from '@/db/queries/course'
import {toast} from 'sonner'

type CreateCoursePageProps = {
    setActiveTab: (tab: 'courses') => void
}

export default function CreateCoursePage({
    setActiveTab,
}: CreateCoursePageProps) {
    const {email} = useAuth()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setIsLoading(true)
        setError(null)

        try {
            await createCourse({
                email,
                title,
                description: description || undefined,
            })

            // alert('Course created successfully!')
            toast('Course created successfully!')

            setActiveTab('courses')
        } catch (err) {
            setError(`Failed to create the course: ${err}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="page-content">
            <h1 className="page-title">Create a New Course</h1>
            <div className="settings-section">
                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="title">Course Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Introduction to Web Development"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            placeholder="Describe what this course is about..."
                        />
                    </div>
                    {error && <p style={{color: '#ef4444'}}>{error}</p>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="save-btn">
                        {isLoading ? 'Creating...' : 'Create Course'}
                    </button>
                </form>
            </div>
        </div>
    )
}
