import {useUser} from '@auth0/nextjs-auth0/client'

export function useAuth() {
    const {user, isLoading} = useUser()
    // if you change this - make sure it matches the namespace
    // inside auth0's "Add Roles" action
    // use a dummy url, it doesn't need to be real
    const namespace = 'https://my-learning-app.com'

    // auth0 is loading
    if (isLoading) {
        return {
            user: null,
            email: null,
            isInstructor: false,
            isLoading: true,
        }
    }

    // no user found
    if (!user || !user.email) {
        return {
            user: null,
            email: null,
            isInstructor: false,
            isLoading: false,
        }
    }

    // user logged in - check for role
    const roles = (user[`${namespace}/roles`] as string[]) || []
    const isInstructor = roles.includes('Instructor')

    return {
        user,
        email: user.email as string,
        isInstructor,
        isLoading: false,
    }
}
