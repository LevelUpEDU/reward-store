'use client'

import React, {useState} from 'react'
import {useRouter} from 'next/navigation'
import './AuthForm.css'

interface LoginFormProps {
    onSuccess: () => void
    onSwitchToSignUp: () => void
    onCancel: () => void
}

export default function LoginForm({
    onSuccess,
    onSwitchToSignUp,
    onCancel,
}: LoginFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        return (
            <div className="auth-form">
                <div className="auth-form-header">
                    <h2>Sign In</h2>
                    <p>Welcome back! Please sign in to your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form-content">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <div className="auth-form-footer">
                        <p>
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToSignUp}
                                className="link-button">
                                Sign up here
                            </button>
                        </p>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-outline btn-small">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        )
    }
}
