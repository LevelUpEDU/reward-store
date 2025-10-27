// src/app/DashboardContent/CreateCoursePage.tsx

'use client'

import {useState} from 'react'

type CreateCoursePageProps = {
    setActiveTab: (tab: 'courses') => void // 定义回调函数类型
}

export default function CreateCoursePage({
    setActiveTab,
}: CreateCoursePageProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/courses', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title, description}),
        })

        if (response.ok) {
            // 成功后，调用回调函数切换回课程列表视图
            alert('Course created successfully!')
            setActiveTab('courses')
        } else {
            const data = await response.json()
            setError(data.message || 'Failed to create the course.')
            setIsLoading(false)
        }
    }

    return (
        <div className="page-content">
            <h1 className="page-title">Create a New Course</h1>
            <div className="settings-section">
                {' '}
                {/* 复用你的 settings 页面的样式 */}
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
                        className="save-btn" // 复用你的保存按钮样式
                    >
                        {isLoading ? 'Creating...' : 'Create Course'}
                    </button>
                </form>
            </div>
        </div>
    )
}
