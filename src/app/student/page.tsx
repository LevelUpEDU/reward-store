// src/app/student/page.tsx
'use client'

import React, {useState} from 'react'
import StudentTopBar from './StudentTopBar/StudentTopBar'
import StudentDashboardContent from './DashboardContent/StudentDashboardContent'
import './Styles/student.css'

export default function StudentDashboard() {
    const [activeTab, setActiveTab] = useState('home')

    return (
        <div className="student-app">
            <StudentTopBar activeTab={activeTab} setActiveTab={setActiveTab} />
            <StudentDashboardContent
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
        </div>
    )
}
