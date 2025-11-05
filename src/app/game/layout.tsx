'use client'
import {withPageAuthRequired} from '@auth0/nextjs-auth0'
import React from 'react'

export default withPageAuthRequired(
    ({children}: {children: React.ReactNode}) => <>{children}</>
)
