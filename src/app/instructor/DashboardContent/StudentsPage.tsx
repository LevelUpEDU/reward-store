// src/app/instructor/DashboardContent/StudentsPage.tsx
'use client'

import React, {useState, useEffect} from 'react'

type Student = {
    email: string
    name: string
    courseCount: number
    lastSignin?: string
}

const StudentsPage = () => {
    const [students, setStudents] = useState<Student[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch('/api/instructor/students')
                if (!response.ok) {
                    throw new Error('Failed to fetch students')
                }
                const data = await response.json()
                setStudents(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStudents()
    }, [])

    if (isLoading) {
        return (
            <div className="page-content">
                <p>Loading students...</p>
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
            <h1 className="page-title">Student Management</h1>
            <div className="student-table">
                <div className="table-header">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Registered Courses</div>
                    <div>Last Sign In</div>
                </div>

                {students.length > 0 ?
                    students.map((student) => (
                        <div key={student.email} className="table-row">
                            <div>{student.name}</div>
                            <div>{student.email}</div>
                            <div>{student.courseCount}</div>
                            <div>
                                {student.lastSignin ?
                                    new Date(
                                        student.lastSignin
                                    ).toLocaleDateString()
                                :   'Never'}
                            </div>
                        </div>
                    ))
                :   <div className="empty-state">
                        <p>No students have registered for your courses yet.</p>
                    </div>
                }
            </div>
        </div>
    )
}

export default StudentsPage
