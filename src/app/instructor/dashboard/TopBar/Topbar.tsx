import React from 'react'
import Link from 'next/link'
import Logo from './Logo'
import NavItem from './NavItem'

type TopBarProps = {
    activeTab: string
    setActiveTab: (tab: string) => void
}

const TopBar = ({activeTab, setActiveTab}: TopBarProps) => {
    const navItems = [
        {id: 'home', label: 'Home'},
        {id: 'courses', label: 'Courses'},
        {id: 'quests', label: 'Quests'},
        {id: 'rewards', label: 'Rewards'},
        {id: 'students', label: 'Students'},
    ]

    return (
        <header className="topbar">
            <div className="topbar-container">
                <Logo />
                <nav className="nav">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.id}
                            href={`#${item.id}`}
                            active={activeTab === item.id}
                            onClick={() => setActiveTab(item.id)}>
                            {item.label}
                        </NavItem>
                    ))}
                </nav>
                <div className="nav-right">
                    {/* <Link href="/" className="nav-link">
            Welcome
          </Link> */}
                    <Link href="/game" className="nav-link">
                        Game
                    </Link>
                    <NavItem
                        href="#settings"
                        active={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}>
                        Settings
                    </NavItem>

                    <button
                        className="logout-btn"
                        onClick={() => {
                            const returnUrl = `${window.location.origin}/instructor`
                            window.location.href = `/auth/logout?returnTo=${encodeURIComponent(returnUrl)}`
                        }}>
                        Logout
                    </button>
                </div>
            </div>
        </header>
    )
}

export default TopBar
