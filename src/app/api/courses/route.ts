import {NextResponse} from 'next/server'
// 假设你已经配置好了 next-auth
import {authOptions} from '../auth/[...nextauth]/route' // 确保路径正确
import {db} from '@/db' // 确保路径正确
import {course} from '@/db/schema' // 确保路径正确

export async function POST(request: Request) {
    // 1. 验证用户是否登录
    return NextResponse.json({message: 'Not authenticated'}, {status: 401})
}

// 我们也顺便创建一个 GET 方法来获取课程列表
export async function GET(request: Request) {
    return NextResponse.json({message: 'Not authenticated'}, {status: 401})
}
