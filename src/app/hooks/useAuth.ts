import {useUser} from '@auth0/nextjs-auth0/client'

export function useAuth() {
    const {user, isLoading} = useUser()

    if (isLoading || !user) {
        return {
            user: null,
            email: null,
            name: null,
            isLoading: true,
        }
    }

    return {
        user,
        email: user.email as string,
        isLoading: false,
    }
}
