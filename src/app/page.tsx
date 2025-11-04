'use client'

import './styles.css'
import PixelatedBackground from '../components/PixelatedBackground'

// change the background image here only
const IMAGE_SRC = '/bcit-2.jpg'

export default function Home() {
    return (
        <div>
            <div id="ui">
                <h1>LevelUp EDU</h1>
                <div id="sign-in">
                    <div className="auth-container">
                        {/* register */}
                        <div className="auth-section">
                            <h2>New Student?</h2>
                            <p>Create an account</p>
                            <a href="/auth/login?screen_hint=signup&returnTo=/register?role=student">
                                <button
                                    type="button"
                                    className="btn btn-primary">
                                    Create Account
                                </button>
                            </a>
                        </div>

                        <div className="divider">or</div>

                        {/* sign in */}
                        <div className="auth-section">
                            <h2>Already have an account?</h2>
                            <a href="/auth/login?returnTo=/game">
                                <button
                                    type="button"
                                    className="btn btn-secondary">
                                    Sign In
                                </button>
                            </a>
                        </div>

                        <div className="info-text">
                            <p>Sign in with Google, Apple, or Microsoft</p>
                        </div>
                    </div>
                </div>
            </div>
            <PixelatedBackground imageSrc={IMAGE_SRC} />
        </div>
    )
}
