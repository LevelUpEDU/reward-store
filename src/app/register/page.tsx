'use client'

import {useEffect, useState} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {useUser} from '@auth0/nextjs-auth0/client'
import PixelatedBackground from '../../components/PixelatedBackground'
import '../styles.css'

const IMAGE_SRC = '/bcit-2.jpg'

export default function RegisterPage() {
    const {user, isLoading} = useUser()
    const searchParams = useSearchParams()
    const router = useRouter()
    const role = searchParams.get('role') as 'student' | 'instructor' | null

    const [error, setError] = useState<string>('')
    const [registering, setRegistering] = useState<boolean>(false)

    useEffect(() => {
        // not logged in - redirect to homepage
        if (!isLoading && !user) {
            router.push('/')
            return
        }

        if (user && role) {
            handleRegistration()
        }
    }, [user, isLoading, role])

    const handleRegistration = async () => {
        if (registering) return

        setRegistering(true)
        setError('')

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email: user?.email,
                    name: user?.name,
                    auth0Id: user?.sub,
                    role: role || 'student',
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 409) {
                    // user already exists... just redirect them
                    router.push('/game')
                    return
                }
                throw new Error(data.error || 'Registration failed')
            }

            // success
            router.push('/game')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            setRegistering(false)
        }
    }

    return (
        <div>
            <div id="ui">
                <h1>LevelUp EDU</h1>
                <div id="sign-in">
                    {error ?
                        <div style={{textAlign: 'center', color: '#ffffff'}}>
                            <p>{error}</p>
                            <a href="/">
                                <button
                                    type="button"
                                    className="btn btn-primary">
                                    Go Back
                                </button>
                            </a>
                        </div>
                    :   <div style={{textAlign: 'center', color: '#ffffff'}}>
                            <p>Setting up your account...</p>
                        </div>
                    }
                </div>
            </div>
            <PixelatedBackground imageSrc={IMAGE_SRC} />
        </div>
    )
}
