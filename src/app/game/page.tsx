'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {useState, useEffect} from 'react'
import {useSession, signOut} from 'next-auth/react'

interface PreInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>
}

declare global {
    interface Navigator {
        standalone?: boolean
    }
}

const GameComponent = dynamic(() => import('../../components/GameComponent'), {
    ssr: false,
    loading: () => null,
})

const styles = {
    promptContainer: {
        position: 'fixed' as const,
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        maxWidth: '250px',
    },
    installButton: {
        background: '#000',
        color: '#fff',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600' as const,
    },
    closeButton: {
        position: 'absolute' as const,
        top: '4px',
        right: '4px',
        background: 'none',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '4px',
        lineHeight: '1',
    },
    iosInstructions: {
        fontSize: '13px',
        lineHeight: '1.4',
    },
    instructionHeader: {
        display: 'block',
        marginBottom: '8px',
    },
    instructionText: {
        margin: 0,
    },
    shareIcon: {
        width: '16px',
        height: '16px',
        verticalAlign: 'middle' as const,
        margin: '0 2px',
    },
}

function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [deferredPrompt, setDeferredPrompt] =
        useState<PreInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(true)

    useEffect(() => {
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        setIsIOS(iOS)

        // check if running as PWA
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true || // iOS specific
            document.referrer.includes('android-app://') // Android

        setIsStandalone(standalone)

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as PreInstallPromptEvent)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // hide after 5 seconds on iOS
        if (iOS && !standalone) {
            const timer = setTimeout(() => {
                setShowPrompt(false)
            }, 5000)

            return () => {
                clearTimeout(timer)
                window.removeEventListener('beforeinstallprompt', handler)
            }
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return
        }

        deferredPrompt.prompt()
        const {outcome} = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setDeferredPrompt(null)
        }
    }

    if (isStandalone || (!deferredPrompt && !isIOS) || !showPrompt) {
        return null
    }

    return (
        <div style={styles.promptContainer}>
            {!isIOS && deferredPrompt && (
                <button
                    onClick={handleInstallClick}
                    style={styles.installButton}>
                    Install App
                </button>
            )}
            {isIOS && (
                <div style={styles.iosInstructions}>
                    <button
                        onClick={() => setShowPrompt(false)}
                        style={styles.closeButton}>
                        ×
                    </button>
                    <strong style={styles.instructionHeader}>
                        Install LevelUpEDU
                    </strong>
                    <p style={styles.instructionText}>
                        1. Tap the Share button{' '}
                        <span role="img" aria-label="share">
                            ⎋
                        </span>
                        <br />
                        2. Select &quot;Add to Home Screen&quot;
                        <span role="img" aria-label="add">
                            ➕
                        </span>
                    </p>
                </div>
            )}
        </div>
    )
}
function GameNavigation() {
    const {data: session} = useSession()

    return (
        <div
            style={{
                position: 'fixed',
                top: '10px',
                left: '10px',
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
            }}>
            <Link
                href="/"
                style={{
                    background: '#667eea',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                }}>
                Home
            </Link>
            {session?.user?.userType === 'instructor' && (
                <Link
                    href="/instructor"
                    style={{
                        background: '#f093fb',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '600',
                    }}>
                    Dashboard
                </Link>
            )}
            <button
                onClick={() => signOut({callbackUrl: '/'})}
                style={{
                    background: '#e53e3e',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                }}>
                Logout
            </button>
        </div>
    )
}

export default function GamePage() {
    return (
        <div>
            <GameNavigation />
            <InstallPrompt />
            <GameComponent />
        </div>
    )
}
