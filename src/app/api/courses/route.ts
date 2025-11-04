import {NextResponse} from 'next/server'

export async function POST(request: Request) {
    // 1. 验证用户是否登录
    return NextResponse.json({message: 'Not authenticated'}, {status: 401})
}

// 我们也顺便创建一个 GET 方法来获取课程列表
export async function GET(request: Request) {
    return NextResponse.json({message: 'Not authenticated'}, {status: 401})
}
