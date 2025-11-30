import {Auth0Client} from '@auth0/nextjs-auth0/server'

export const auth0 = new Auth0Client({
    authorizationParameters: {
        audience: 'https://my-learning-app.com',
        scope: 'openid profile email',
    },
    async beforeSessionSaved(session) {
        let roles: string[] = []

        // decode the ID to get auth0 claims (contains the user role)
        if (session.tokenSet?.idToken) {
            const parts = session.tokenSet.idToken.split('.')
            if (parts[1]) {
                const decoded = JSON.parse(
                    Buffer.from(parts[1], 'base64').toString()
                )
                roles = decoded['https://my-learning-app.com/roles'] || []
            }
        }

        return {
            ...session,
            user: {
                ...session.user,
                'https://my-learning-app.com/roles': roles,
            },
        }
    },
})
