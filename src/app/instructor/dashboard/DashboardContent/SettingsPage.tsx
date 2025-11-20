'use client'

import React, {useEffect, useMemo, useState} from 'react'
import {useAuth} from '@/app/hooks/useAuth'
import {
    getInstructorByEmail,
    updateInstructorProfile,
} from '@/db/queries/instructor'

type FormState = {
    name: string
    email: string
    department: string
}

const emptyForm: FormState = {
    name: '',
    email: '',
    department: '',
}

const SettingsPage = () => {
    const {email, user, isLoading} = useAuth()
    const [formState, setFormState] = useState<FormState>(emptyForm)
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'saving' | 'error'
    >('idle')
    const [message, setMessage] = useState<string | null>(null)

    const localStorageKey = useMemo(
        () => (email ? `instructor-profile-${email}` : null),
        [email]
    )

    useEffect(() => {
        if (!email || isLoading) {
            return
        }

        let mounted = true
        const fetchProfile = async () => {
            setStatus('loading')
            setMessage(null)

            try {
                const [profile] = await Promise.all([
                    getInstructorByEmail(email),
                ])

                const storedDepartment =
                    typeof window !== 'undefined' && localStorageKey ?
                        localStorage.getItem(`${localStorageKey}-department`)
                    :   null

                if (!mounted) return

                setFormState({
                    name: profile?.name ?? user?.name ?? '',
                    email,
                    department:
                        storedDepartment ??
                        (
                            user?.user_metadata as
                                | Record<string, unknown>
                                | undefined
                        )?.department?.toString() ??
                        '',
                })
                setStatus('idle')
            } catch (err) {
                if (!mounted) return
                setStatus('error')
                setMessage(
                    err instanceof Error ?
                        err.message
                    :   'Failed to load profile information.'
                )
            }
        }

        fetchProfile()

        return () => {
            mounted = false
        }
    }, [email, user, isLoading, localStorageKey])

    const handleChange =
        (field: keyof FormState) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value
            setFormState((prev) => ({
                ...prev,
                [field]: value,
            }))
            setMessage(null)
        }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!email) return

        setStatus('saving')
        setMessage(null)

        try {
            await updateInstructorProfile(email, {
                name: formState.name.trim() || user?.name || '',
            })

            if (typeof window !== 'undefined' && localStorageKey) {
                localStorage.setItem(
                    `${localStorageKey}-department`,
                    formState.department.trim()
                )
            }

            setStatus('idle')
            setMessage('Profile updated successfully.')
        } catch (err) {
            setStatus('error')
            setMessage(
                err instanceof Error ?
                    err.message
                :   'Failed to update profile. Please try again.'
            )
        }
    }

    const isBusy = status === 'loading' || status === 'saving'

    return (
        <div className="page-content">
            <h1 className="page-title">Settings</h1>
            <div className="settings-section">
                <h2>Profile Settings</h2>
                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="full-name">Full Name</label>
                        <input
                            id="full-name"
                            type="text"
                            value={formState.name}
                            onChange={handleChange('name')}
                            placeholder="Enter your full name"
                            disabled={isBusy}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={formState.email}
                            disabled
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="department">Department</label>
                        <input
                            id="department"
                            type="text"
                            value={formState.department}
                            onChange={handleChange('department')}
                            placeholder="e.g., Computer Science"
                            disabled={status === 'loading'}
                        />
                    </div>
                    {message && (
                        <p
                            style={{
                                color:
                                    status === 'error' ? '#ef4444' : '#047857',
                            }}>
                            {message}
                        </p>
                    )}
                    <button
                        className="save-btn"
                        type="submit"
                        disabled={isBusy || !formState.name.trim()}>
                        {status === 'saving' ? 'Saving...' : 'Save'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default SettingsPage
