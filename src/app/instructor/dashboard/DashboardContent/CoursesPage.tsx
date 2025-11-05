'use client'

import React, {useState, useEffect} from 'react'
import CourseCard from '../CourseCard/CourseCard'
import {useAuth} from '@/app/hooks/useAuth'
import {getCoursesByInstructor} from '@/db/queries/course'
import type {Course} from '@/types/db'

type CoursesPageProps = {
    setActiveTab: (tab: string, courseId?: number) => void
}

const CoursesPage = ({setActiveTab}: CoursesPageProps) => {
    const {email} = useAuth()
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCourses = async () => {
            if (!email) return

            try {
                const coursesData = await getCoursesByInstructor(email)
                setCourses(coursesData)
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourses()
    }, [email])

    const handleCourseClick = (courseId: number) => {
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
