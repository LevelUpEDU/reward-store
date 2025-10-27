// src/app/instructor/DashboardContent/DashboardContent.tsx

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
    // 2. 接收一个可以改变 Tab 的函数
    setActiveTab: (tab: string) => void
    selectedCourseId?: number
}

const DashboardContent = ({
    activeTab,
    setActiveTab,
    selectedCourseId,
}: DashboardContentProps) => {
    // Check if activeTab is a course detail tab
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
            // 3. 把 setActiveTab 传递给 CoursesPage
            return <CoursesPage setActiveTab={setActiveTab} />
        case 'quests':
            return <QuestsPage setActiveTab={setActiveTab} />
        case 'students':
            return <StudentsPage />
        case 'settings':
            return <SettingsPage />
        case 'create_course': // 4. 添加新的 case
            // 5. 把 setActiveTab 传递给 CreateCoursePage
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

// import React from 'react';
// import HomeDashboard from './HomeDashboard';
// import CoursesPage from './CoursesPage';
// import QuestsPage from './QuestsPage';
// import StudentsPage from './StudentsPage';
// import SettingsPage from './SettingsPage';

// type DashboardContentProps = {
//   activeTab: string;
// };

// const DashboardContent = ({ activeTab }: DashboardContentProps) => {
//   switch (activeTab) {
//     case 'home':
//       return <HomeDashboard />;
//     case 'courses':
//       return <CoursesPage />;
//     case 'quests':
//       return <QuestsPage />;
//     case 'students':
//       return <StudentsPage />;
//     case 'settings':
//       return <SettingsPage />;
//     default:
//       return null;
//   }
// };

// export default DashboardContent;
