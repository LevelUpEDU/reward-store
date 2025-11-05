'use client'
import {withPageAuthRequired} from '@auth0/nextjs-auth0'
import React from 'react'

export default withPageAuthRequired(function GameLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
})
