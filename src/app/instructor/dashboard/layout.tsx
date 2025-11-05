// app/instructor/dashboard/layout.tsx
import React from 'react'
import {redirect} from 'next/navigation'
import {auth0} from '@/lib/auth0'
import {db} from '@/db'
import {instructor} from '@/db/schema'
import {eq} from 'drizzle-orm'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth0.getSession()
    const user = session?.user

    // sub = immutable user token
    if (!user?.sub) {
        return redirect('/api/auth/login?returnTo=/instructor')
    }

    const auth0Id = user.sub

    const existingInstructor = await db
        .select({id: instructor.email})
        .from(instructor)
        .where(eq(instructor.auth0Id, auth0Id))
        .limit(1)

    // user is a naughty student.
    if (existingInstructor.length === 0) {
        return redirect('/')
    }

    // only render the dashboard if the instructor exists
    return <>{children}</>
}
