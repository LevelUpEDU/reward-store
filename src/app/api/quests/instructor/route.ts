import {NextResponse} from 'next/server'

export async function GET(_request: Request) {
    // Check authentication
    return NextResponse.json({message: 'Not authenticated'}, {status: 401})
}
