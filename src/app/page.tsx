'use client'

import React, {useState} from 'react'
import Link from 'next/link'
import {useSession, signIn, signOut} from 'next-auth/react'
import LoginForm from './components/LoginForm'
import SignUpForm from './components/SignUpForm'
import './styles/home.css'

export default function HomePage() {
    const {data: session, status} = useSession()
    const [showLogin, setShowLogin] = useState(false)
    const [showSignUp, setShowSignUp] = useState(false)

    if (status === 'loading') {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        )
    }

    if (session) {
        return (
            <div className="home-container">
                <div className="hero-section">
                    <div className="hero-content">
                        <h3 className="hero-title">Welcome to LevelUpEDU</h3>
                        <div className="user-info">
                            <p>
                                Welcome back,{' '}
                                {session.user?.name || session.user?.email}!
                            </p>
                            <p className="user-type">
                                Account type:{' '}
                                {session.user?.userType || 'Unknown'}
                            </p>
                            <div className="action-buttons">
                                {session.user?.userType === 'instructor' ?
                                    <Link
                                        href="/instructor"
                                        className="btn btn-primary">
                                        Instructor Dashboard
                                    </Link>
                                : session.user?.userType === 'student' ?
                                    <Link
                                        href="/student"
                                        className="btn btn-primary">
                                        Student Dashboard
                                    </Link>
                                :   <Link
                                        href="/game"
                                        className="btn btn-primary">
                                        Start Learning
                                    </Link>
                                }
                                <button
                                    onClick={() => signOut()}
                                    className="btn btn-outline">
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="home-container">
            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">LevelUpEDU</h1>
                    <p className="hero-subtitle">Start your journey today!</p>

                    <div className="auth-section">
                        {!showLogin && !showSignUp && (
                            <div className="auth-buttons">
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="btn btn-primary">
                                    Sign In
                                </button>
                                <button
                                    onClick={() => setShowSignUp(true)}
                                    className="btn btn-secondary">
                                    Sign Up
                                </button>
                            </div>
                        )}

                        {showLogin && (
                            <div className="auth-form-container">
                                <LoginForm
                                    onSuccess={() => {
                                        setShowLogin(false)
                                        // User will be redirected automatically
                                    }}
                                    onSwitchToSignUp={() => {
                                        setShowLogin(false)
                                        setShowSignUp(true)
                                    }}
                                    onCancel={() => setShowLogin(false)}
                                />
                            </div>
                        )}

                        {showSignUp && (
                            <div className="auth-form-container">
                                <SignUpForm
                                    onSuccess={() => {
                                        setShowSignUp(false)
                                        // User will be redirected automatically
                                    }}
                                    onSwitchToLogin={() => {
                                        setShowSignUp(false)
                                        setShowLogin(true)
                                    }}
                                    onCancel={() => setShowSignUp(false)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="features-section">
                        <h3>Why Choose LevelUpEDU?</h3>
                        <div className="features-grid">
                            <div className="feature-card">
                                <div className="feature-icon">🎮</div>
                                <h5>Gamified Learning</h5>
                                <p>
                                    Learn through interactive games and
                                    challenges
                                </p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon">🏆</div>
                                <h5>Earn Rewards</h5>
                                <p>
                                    Complete quests and earn points and
                                    achievements
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
