// src/app/instructor/TopBar/NavItem.tsx

import React from 'react'

type NavItemProps = {
    href: string
    active: boolean
    onClick: () => void
    children: React.ReactNode
}

const NavItem = ({href, active, onClick, children}: NavItemProps) => (
    <a
        href={href}
        className={`nav-item ${active ? 'active' : ''}`}
        onClick={(e) => {
            e.preventDefault()
            onClick()
        }}>
        {children}
    </a>
)

export default NavItem
