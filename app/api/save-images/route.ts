import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const images = await request.json()
    
    // 验证数据格式
    if (!Array.isArray(images)) {
      return NextResponse.json(
        { success: false, error: '数据格式错误：必须是数组' },
        { status: 400 }
      )
    }

    // 构建文件路径
    const filePath = path.join(process.cwd(), 'public', 'data', 'images.json')
    
    // 格式化JSON数据（美化输出）
    const jsonData = JSON.stringify(images, null, 2)
    
    // 写入文件
    await writeFile(filePath, jsonData, 'utf8')
    
    console.log(`✅ 成功保存 ${images.length} 个图片到 images.json`)
    
    return NextResponse.json({
      success: true,
      message: `成功保存 ${images.length} 个图片`,
      count: images.length
    })
    
  } catch (error) {
    console.error('❌ 保存图片失败:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}