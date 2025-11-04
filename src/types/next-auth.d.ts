declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            userType?: string
        }
    }

    interface User {
        userType?: string
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        userType?: string
    }
}
