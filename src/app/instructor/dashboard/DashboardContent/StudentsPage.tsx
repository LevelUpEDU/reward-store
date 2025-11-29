'use client'

import React, {useState, useEffect} from 'react'
import {useAuth} from '@/app/hooks/useAuth'
import {getStudentsByInstructor} from '@/db/queries/student'

type Student = {
    email: string
    name: string
    courseCount: number
    lastSignin?: Date | null
    totalPoints?: number
}

const StudentsPage = () => {
    const {email} = useAuth()
    const [students, setStudents] = useState<Student[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStudents = async () => {
            if (!email) return

            try {
                const studentsData = await getStudentsByInstructor(email)

                const studentsWithPoints = await Promise.all(
                    studentsData.map(async (student) => {
                        try {
                            const res = await fetch(
                                `/api/student/points?email=${student.email}`
                            )

                            if (!res.ok) throw new Error('Failed to fetch')

                            const data = await res.json()

                            return {
                                ...student,
                                totalPoints: data.points ?? 0,
                            }
                        } catch (e) {
                            console.error(
                                `Could not fetch points for ${student.email}`,
                                e
                            )
                            return {...student, totalPoints: 0}
                        }
                    })
                )

                setStudents(studentsWithPoints)
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
            } finally {
                setIsLoading(false)
            }
        }

        fetchStudents()
    }, [email])

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
                    <div>Total Points</div>
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
                            <div>{student.totalPoints ?? '-'}</div>
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
