'use client'
import Link from 'next/link'
import {useAuth} from '@/app/hooks/useAuth'
import '../styles/home.css'

export default function HomePage() {
    const {user, isInstructor, isLoading} = useAuth()

    const returnUrl =
        typeof window !== 'undefined' ? window.location.origin : ''

    if (isLoading) return <div>Loading...</div>

    return (
        <div className="home-container">
            <div className="hero-section">
                <div className="hero-content">
                    <h3 className="hero-title">Welcome to LevelUpEDU</h3>

                    <div className="user-info">
                        {user ?
                            <>
                                <p>
                                    Welcome back, <strong>{user.name}</strong>
                                </p>
                                <p className="user-type">
                                    Account type:{' '}
                                    <span className="font-bold">
                                        {isInstructor ?
                                            'Instructor'
                                        :   'Student'}
                                    </span>
                                </p>
                            </>
                        :   <p>Please sign in to continue.</p>}

                        <div className="action-buttons">
                            {/* --- GUEST VIEW --- */}
                            {!user && (
                                <>
                                    <Link
                                        href="/auth/login?screen_hint=signup&returnTo=/register?role=instructor"
                                        className="btn btn-primary">
                                        Instructor Sign-up
                                    </Link>
                                    <a
                                        // 1. URL is /auth/login (No /api)
                                        // 2. prompt=login forces the Action to run again
                                        href="/auth/login?returnTo=/instructor/dashboard&prompt=login"
                                        className="btn btn-primary">
                                        Instructor Sign-in
                                    </a>

                                    <Link
                                        href="/student"
                                        className="btn btn-primary">
                                        Student Dashboard
                                    </Link>
                                </>
                            )}

                            {/* --- LOGGED IN VIEW --- */}
                            {user && (
                                <>
                                    {
                                        isInstructor ?
                                            <>
                                                <Link
                                                    href="/instructor/dashboard"
                                                    className="btn btn-primary">
                                                    Instructor Dashboard
                                                </Link>
                                                <Link
                                                    href="/student"
                                                    className="btn btn-outline">
                                                    Student Dashboard
                                                </Link>
                                            </>
                                            // students only see their dashboard
                                        :   <Link
                                                href="/student"
                                                className="btn btn-primary">
                                                Student Dashboard
                                            </Link>

                                    }

                                    <button
                                        className="btn btn-outline"
                                        onClick={() => {
                                            window.location.href = `/api/auth/logout?returnTo=${returnUrl}`
                                        }}>
                                        Sign Out
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
