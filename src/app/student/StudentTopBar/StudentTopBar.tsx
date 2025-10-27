'use client'

import React from 'react'
import {useSession, signOut} from 'next-auth/react'

type StudentTopBarProps = {
    activeTab: string
    setActiveTab: (tab: string) => void
}

const StudentTopBar = ({activeTab, setActiveTab}: StudentTopBarProps) => {
    const {data: session} = useSession()

    const handleSignOut = () => {
        signOut({callbackUrl: '/'})
    }

    return (
        <div className="student-topbar">
            <div className="topbar-left">
                <h1 className="topbar-title">Student Dashboard</h1>
            </div>

            <div className="topbar-nav">
                <button
                    className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => setActiveTab('home')}>
                    Home
                </button>
                <button
                    className={`nav-btn ${activeTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('courses')}>
                    Courses
                </button>
                <button
                    className={`nav-btn ${activeTab === 'quests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quests')}>
                    Quests
                </button>
            </div>

            <div className="topbar-right">
                <div className="user-info">
                    <span className="user-name">{session?.user?.name}</span>
                    <span className="user-role">Student</span>
                </div>
                <button className="signout-btn" onClick={handleSignOut}>
                    Sign Out
                </button>
            </div>
        </div>
    )
}

export default StudentTopBar
