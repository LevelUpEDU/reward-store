'use client'

import './styles.css'
import PixelatedBackground from '../components/PixelatedBackground'

// change the background image here only
const IMAGE_SRC = '/bcit-2.jpg'

export default function Home() {
    return (
        <div>
            <div id="ui">
                <h1> LevelUp EDU</h1>
                <div id="sign-in">
                    <form id="signin-form">
                        <div className="form-group">
                            <label htmlFor="email">Username</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="your.email@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                required
                            />
                            <div className="forgot-password">
                                <a href="#forgot">Forgot password?</a>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary">
                            Sign In
                        </button>

                        <div className="divider">or</div>

                        <div className="register-link">
                            Don&apos;t have an account?{' '}
                            <a href="#register">Register here</a>
                        </div>
                    </form>
                </div>
            </div>
            <PixelatedBackground imageSrc={IMAGE_SRC} />
        </div>
    )
}
