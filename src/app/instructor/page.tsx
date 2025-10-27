// src/app/instructor/page.tsx
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
        // Set selected course if provided
        if (courseId !== undefined) {
            setSelectedCourseId(courseId)
        } else if (tab !== 'create_quest') {
            // Clear selected course when switching tabs (except when going to create_quest)
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

// src/app/instructor/page.tsx
// 'use client'
// import React, { useState } from 'react';
// import TopBar from './TopBar/Topbar';
// import DashboardContent from './DashboardContent/DashboardContent';
// import './Styles/instructor.css';

// export default function InstructorDashboard() {
//   const [activeTab, setActiveTab] = useState('home');

//   return (
//     <div className="app">
//       <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />
//       <DashboardContent activeTab={activeTab} />
//     </div>
//   );
// }
