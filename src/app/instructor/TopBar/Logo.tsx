// src/app/instructor/TopBar/Logo.tsx

import React from 'react'
import logo from '../public/Logo_green.jpg'

const Logo = () => (
    <div className="logo">
        <div className="logo-icon">
            <img src={logo.src} alt="LevelUpEDU Logo" />
        </div>
        <span className="logo-text">LevelUpEDU</span>
    </div>
)

export default Logo
