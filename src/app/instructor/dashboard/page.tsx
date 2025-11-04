'use client'
import React, {useState} from 'react'
import TopBar from './TopBar/Topbar'
import DashboardContent from './DashboardContent/DashboardContent'
import './Styles/instructor.css'

export default function InstructorDashboard() {
    const [activeTab, setActiveTab] = useState('home')
    const [selectedCourseId, setSelectedCourseId] = useState<
        number | undefined
    >(undefined)

    const handleSetActiveTab = (tab: string, courseId?: number) => {
        setActiveTab(tab)
        if (courseId !== undefined) {
            setSelectedCourseId(courseId)
        } else if (tab !== 'create_quest') {
            setSelectedCourseId(undefined)
        }
    }

    return (
        <div className="app">
            <TopBar activeTab={activeTab} setActiveTab={handleSetActiveTab} />
            <DashboardContent
                activeTab={activeTab}
                setActiveTab={handleSetActiveTab}
                selectedCourseId={selectedCourseId}
            />
        </div>
    )
}
