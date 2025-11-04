import React from 'react'
import HomeDashboard from './HomeDashboard'
import CoursesPage from './CoursesPage'
import QuestsPage from './QuestsPage'
import StudentsPage from './StudentsPage'
import SettingsPage from './SettingsPage'
import CreateCoursePage from './CreateCoursePage'
import CreateQuestPage from './CreateQuestPage'
import CourseDetailPage from './CourseDetailPage'

type DashboardContentProps = {
    activeTab: string
    setActiveTab: (tab: string) => void
    selectedCourseId?: number
}

const DashboardContent = ({
    activeTab,
    setActiveTab,
    selectedCourseId,
}: DashboardContentProps) => {
    if (activeTab.startsWith('course_detail_')) {
        const courseId = parseInt(activeTab.replace('course_detail_', ''))
        return (
            <CourseDetailPage
                courseId={courseId}
                setActiveTab={setActiveTab}
                onBack={() => setActiveTab('courses')}
            />
        )
    }

    switch (activeTab) {
        case 'home':
            return <HomeDashboard setActiveTab={setActiveTab} />
        case 'courses':
            return <CoursesPage setActiveTab={setActiveTab} />
        case 'quests':
            return <QuestsPage setActiveTab={setActiveTab} />
        case 'students':
            return <StudentsPage />
        case 'settings':
            return <SettingsPage />
        case 'create_course':
            return <CreateCoursePage setActiveTab={setActiveTab} />
        case 'create_quest':
            return (
                <CreateQuestPage
                    setActiveTab={setActiveTab}
                    preselectedCourseId={selectedCourseId}
                />
            )
        default:
            return null
    }
}

export default DashboardContent
