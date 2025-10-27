'use client'

import React, {useState, useEffect} from 'react'

type Course = {
    id: number
    title: string
    courseCode: string
    description: string | null
    instructorName: string
}

type AvailableCourse = {
    id: number
    title: string
    courseCode: string
    description: string | null
    instructorName: string
    isRegistered: boolean
}

type StudentCoursesPageProps = {
    setActiveTab: (tab: string) => void
}

const StudentCoursesPage = ({setActiveTab}: StudentCoursesPageProps) => {
    const [registeredCourses, setRegisteredCourses] = useState<Course[]>([])
    const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>(
        []
    )
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showRegisterForm, setShowRegisterForm] = useState(false)
    const [registerCourseId, setRegisterCourseId] = useState<number | null>(
        null
    )

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [registeredResponse, availableResponse] =
                    await Promise.all([
                        fetch('/api/student/courses'),
                        fetch('/api/student/available-courses'),
                    ])

                if (!registeredResponse.ok || !availableResponse.ok) {
                    throw new Error('Failed to fetch courses')
                }

                const [registeredData, availableData] = await Promise.all([
                    registeredResponse.json(),
                    availableResponse.json(),
                ])

                setRegisteredCourses(registeredData)
                setAvailableCourses(availableData)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleRegisterCourse = async (courseId: number) => {
        try {
            const response = await fetch('/api/student/register-course', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({courseId}),
            })

            if (response.ok) {
                // Refresh the data
                window.location.reload()
            } else {
                const data = await response.json()
                alert(data.message || 'Failed to register for course')
            }
        } catch (err: any) {
            alert('Failed to register for course')
        }
    }

    if (isLoading) {
        return (
            <div className="student-page-content">
                <p>Loading courses...</p>
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

    return (
        <div className="student-page-content">
            <div className="section-header">
                <h1 className="page-title">My Courses</h1>
                <button
                    onClick={() => setShowRegisterForm(!showRegisterForm)}
                    className="register-course-btn">
                    {showRegisterForm ? 'Hide' : '+'} Register New Course
                </button>
            </div>

            {showRegisterForm && (
                <div className="register-form-section">
                    <h3>Available Courses</h3>
                    {(
                        availableCourses.filter(
                            (course) => !course.isRegistered
                        ).length > 0
                    ) ?
                        <div className="available-courses-grid">
                            {availableCourses
                                .filter((course) => !course.isRegistered)
                                .map((course) => (
                                    <div
                                        key={course.id}
                                        className="available-course-card">
                                        <div className="course-info">
                                            <h4>{course.title}</h4>
                                            <p className="course-code">
                                                {course.courseCode}
                                            </p>
                                            <p className="instructor">
                                                Instructor:{' '}
                                                {course.instructorName}
                                            </p>
                                            {course.description && (
                                                <p className="description">
                                                    {course.description}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleRegisterCourse(course.id)
                                            }
                                            className="register-btn">
                                            Register
                                        </button>
                                    </div>
                                ))}
                        </div>
                    :   <p className="no-courses">
                            No available courses to register for.
                        </p>
                    }
                </div>
            )}

            <h3>Registered Courses ({registeredCourses.length})</h3>
            {registeredCourses.length > 0 ?
                <div className="courses-grid">
                    {registeredCourses.map((course) => (
                        <div key={course.id} className="course-card">
                            <div className="course-info">
                                <h4>{course.title}</h4>
                                <p className="course-code">
                                    {course.courseCode}
                                </p>
                                <p className="instructor">
                                    Instructor: {course.instructorName}
                                </p>
                                {course.description && (
                                    <p className="description">
                                        {course.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            :   <div className="empty-state">
                    <p>
                        No courses registered yet. Register for courses above to
                        get started!
                    </p>
                </div>
            }
        </div>
    )
}

export default StudentCoursesPage
