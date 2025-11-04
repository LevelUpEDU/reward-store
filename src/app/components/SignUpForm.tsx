'use client'

import React, {useState} from 'react'
import {useRouter} from 'next/navigation'
import './AuthForm.css'

interface SignUpFormProps {
    onSuccess: () => void
    onSwitchToLogin: () => void
    onCancel: () => void
}

export default function SignUpForm({
    onSuccess,
    onSwitchToLogin,
    onCancel,
}: SignUpFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'student' as 'student' | 'instructor',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const {name, value} = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long')
            setIsLoading(false)
            return
        }

        // Create user account
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                userType: formData.userType,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Registration failed')
        }

        onSuccess()
        // Redirect based on user type
        // We need to wait a moment for the session to update
        setTimeout(() => {
            router.push('/')
        }, 100)

        return (
            <div className="auth-form">
                <div className="auth-form-header">
                    <h2>Create Account</h2>
                    <p>Join LevelUpEDU and start your learning journey!</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form-content">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter your full name"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="userType">Account Type</label>
                        <select
                            id="userType"
                            name="userType"
                            value={formData.userType}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            className="form-select">
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Create a password (min 6 characters)"
                            disabled={isLoading}
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Confirm your password"
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <div className="auth-form-footer">
                        <p>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToLogin}
                                className="link-button">
                                Sign in here
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
