'use client'
import Link from 'next/link'
import '../styles/home.css'

export default function HomePage() {
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
                                href="/instructor/dashboard"
                                className="btn btn-primary">
                                Instructor Dashboard
                            </Link>
                            <Link href="/student" className="btn btn-primary">
                                Student Dashboard
                            </Link>
                            <button className="btn btn-outline">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
