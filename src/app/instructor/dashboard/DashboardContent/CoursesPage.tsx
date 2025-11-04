'use client'

import React, {useState, useEffect} from 'react'
import CourseCard from '../CourseCard/CourseCard'

type Course = {
    id: number
    title: string
    courseCode: string
    description: string | null
}

type CoursesPageProps = {
    setActiveTab: (tab: string, courseId?: number) => void
}

const CoursesPage = ({setActiveTab}: CoursesPageProps) => {
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await fetch('/api/courses')
                if (!response.ok) {
                    throw new Error('Failed to fetch courses')
                }
                const data = await response.json()
                setCourses(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourses()
    }, [])

    const handleCourseClick = (courseId: number) => {
        console.log('Course clicked:', courseId)
        // Navigate to course detail by setting a special tab
        setActiveTab(`course_detail_${courseId}`)
    }

    if (isLoading) {
        return (
            <div className="page-content">
                <p>Loading courses...</p>
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
                <h1 className="page-title">My Courses</h1>
                <button
                    onClick={() => setActiveTab('create_course')}
                    className="add-course-btn">
                    + Add Course
                </button>
            </div>

            {courses.length > 0 ?
                <div className="courses-grid">
                    {courses.map((course) => (
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
                        You haven&apos;t created any courses yet. Click the
                        button above to get started!
                    </p>
                </div>
            }
        </div>
    )
}

export default CoursesPage
