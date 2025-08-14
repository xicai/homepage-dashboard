import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { filePaths } = await request.json()
    
    if (!filePaths || !Array.isArray(filePaths)) {
      return NextResponse.json({ error: '无效的文件路径' }, { status: 400 })
    }

    const deletedFiles: string[] = []
    const failedFiles: string[] = []

    for (const filePath of filePaths) {
      try {
        // 确保文件路径是在 public/uploads 目录下
        if (!filePath.startsWith('/uploads/')) {
          console.warn(`跳过无效路径: ${filePath}`)
          continue
        }

        // 构建完整的文件系统路径
        const fullPath = path.join(process.cwd(), 'public', filePath)
        
        // 检查文件是否存在
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
          deletedFiles.push(filePath)
          console.log(`✅ 删除文件: ${filePath}`)
        } else {
          console.warn(`文件不存在: ${filePath}`)
        }
      } catch (error) {
        console.error(`❌ 删除文件失败 ${filePath}:`, error)
        failedFiles.push(filePath)
      }
    }

    return NextResponse.json({
      success: true,
      deletedFiles,
      failedFiles,
      message: `成功删除 ${deletedFiles.length} 个文件${failedFiles.length > 0 ? `，${failedFiles.length} 个文件删除失败` : ''}`
    })

  } catch (error) {
    console.error('删除文件API错误:', error)
    return NextResponse.json({ error: '删除文件失败' }, { status: 500 })
  }
}