'use client'
import Link from 'next/link'
import '../styles/home.css'

export default function HomePage() {
    const returnUrl = window.location.origin
    return (
        <div className="home-container">
            <div className="hero-section">
                <div className="hero-content">
                    <h3 className="hero-title">Welcome to LevelUpEDU</h3>
                    <div className="user-info">
                        <p>Welcome back, </p>
                        <p className="user-type">Account type: </p>
                        <div className="action-buttons">
                            <Link
                                // href="/instructor/dashboard"
                                href="/auth/login?screen_hint=signup&returnTo=/register?role=instructor"
                                className="btn btn-primary">
                                Instructor Sign-up
                            </Link>
                            <Link
                                href="/auth/login?returnTo=/register?role=instructor"
                                className="btn btn-primary">
                                Instructor Sign-in
                            </Link>
                            <Link href="/student" className="btn btn-primary">
                                Student Dashboard
                            </Link>
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    window.location.href = `/auth/logout?returnTo=${returnUrl}/instructor`
                                }}>
                                Sign Out
                            </button>{' '}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
