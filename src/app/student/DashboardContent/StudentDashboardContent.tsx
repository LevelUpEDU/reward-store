// src/app/student/DashboardContent/StudentDashboardContent.tsx

import React from 'react'
import StudentHomePage from './StudentHomePage'
import StudentCoursesPage from './StudentCoursesPage'
import StudentQuestsPage from './StudentQuestsPage'

type StudentDashboardContentProps = {
    activeTab: string
    setActiveTab: (tab: string) => void
}

const StudentDashboardContent = ({
    activeTab,
    setActiveTab,
}: StudentDashboardContentProps) => {
    switch (activeTab) {
        case 'home':
            return <StudentHomePage setActiveTab={setActiveTab} />
        case 'courses':
            return <StudentCoursesPage setActiveTab={setActiveTab} />
        case 'quests':
            return <StudentQuestsPage setActiveTab={setActiveTab} />
        default:
            return <StudentHomePage setActiveTab={setActiveTab} />
    }
}

export default StudentDashboardContent
