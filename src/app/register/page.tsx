'use client'

import {useEffect, useState, Suspense} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import Link from 'next/link'
import {useUser} from '@auth0/nextjs-auth0/client'
import PixelatedBackground from '../../components/PixelatedBackground'
import '../styles.css'

const IMAGE_SRC = '/bcit-2.jpg'

function RegisterContent() {
    const {user, isLoading} = useUser()
    const searchParams = useSearchParams()
    const router = useRouter()
    const role = searchParams.get('role') as 'student' | 'instructor' | null

    const [error, setError] = useState<string>('')
    const [registering, setRegistering] = useState<boolean>(false)

    useEffect(() => {
        if (isLoading) return

        if (!user) {
            router.push('/')
            return
        }

        if (!role) {
            setError('No role specified')
            return
        }

        if (registering) return

        const handleRegistration = async () => {
            setRegistering(true)
            setError('')

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        email: user.email,
                        name: user.name,
                        auth0Id: user.sub,
                        role: role,
                    }),
                })

                const data = await response.json()

                if (!response.ok) {
                    if (response.status === 409 && role === 'student') {
                        router.push('/game')
                        return
                    } else if (
                        response.status === 409 &&
                        role === 'instructor'
                    ) {
                        router.push('/instructor/dashboard')
                        return
                    }
                    throw new Error(data.error || 'Registration failed')
                }

                const redirectUrl =
                    role === 'instructor' ? '/instructor/dashboard' : '/game'
                router.push(redirectUrl)
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'An error occurred'
                )
                setRegistering(false)
            }
        }

        handleRegistration()
    }, [user, isLoading, role, router, registering])

    return (
        <div>
            <div id="ui">
                <h1 id="title">LevelUp EDU</h1>
                <div id="sign-in">
                    {error ?
                        <div style={{textAlign: 'center', color: '#ffffff'}}>
                            <p>{error}</p>
                            <Link href="/">
                                <button
                                    type="button"
                                    className="btn btn-primary">
                                    Go Back
                                </button>
                            </Link>
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

/* wrap the existing content in a "suspense" boundary
 * this signals an asynchronous operation to Next.js
 *
 * required so Next.js doesn't try to statically build this page and fail
 */
export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterContent />
        </Suspense>
    )
}
