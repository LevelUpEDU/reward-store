// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, {NextAuthOptions} from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import {db} from '@/db'
import {instructor, student} from '@/db/schema'
import {eq, or} from 'drizzle-orm'
import * as bcrypt from 'bcrypt'

// 将配置导出，这样其他文件才能导入它
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: {label: 'Email', type: 'text'},
                password: {label: 'Password', type: 'password'},
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null
                }

                // Try to find user in both student and instructor tables
                const instructorUser = await db.query.instructor.findFirst({
                    where: eq(instructor.email, credentials.email),
                })

                const studentUser = await db.query.student.findFirst({
                    where: eq(student.email, credentials.email),
                })

                const user = instructorUser || studentUser
                if (!user) return null

                // Verify password
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )
                if (!isPasswordValid) return null

                return {
                    id: user.email,
                    email: user.email,
                    name: user.name,
                    userType: instructorUser ? 'instructor' : 'student',
                }
            },
        }),
    ],
    pages: {
        signIn: '/', // Redirect to home page for login
    },
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({token, user}) {
            // Persist the userType to the token right after signin
            if (user) {
                token.userType = user.userType
            }
            return token
        },
        async session({session, token}) {
            // Send properties to the client
            if (token.userType) {
                session.user.userType = token.userType
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export {handler as GET, handler as POST}
