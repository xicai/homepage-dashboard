import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 这个API端点用于触发前端清理localStorage
    // 实际的localStorage清理需要在前端执行
    return NextResponse.json({ 
      success: true, 
      message: '清理指令已发送，请在前端执行localStorage.clear()' 
    })
  } catch (error) {
    console.error('清理数据失败:', error)
    return NextResponse.json({ error: '清理失败' }, { status: 500 })
  }
}