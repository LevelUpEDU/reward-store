import {useUser} from '@auth0/nextjs-auth0/client'

export function useAuth() {
    const {user} = useUser()

    return {
        user: user!,
        email: user!.email as string,
    }
}
