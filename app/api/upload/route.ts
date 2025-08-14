import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const files: File[] = data.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: '没有文件上传' }, { status: 400 })
    }

    const uploadedFiles = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // 生成唯一文件名
      const timestamp = Date.now()
      const randomSuffix = Math.floor(Math.random() * 1000)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${timestamp}_${randomSuffix}.${fileExtension}`

      // 保存文件到 public/uploads 目录
      const filePath = join(process.cwd(), 'public', 'uploads', fileName)
      await writeFile(filePath, buffer)

      uploadedFiles.push({
        originalName: file.name,
        fileName: fileName,
        filePath: `/uploads/${fileName}`,
        size: file.size,
        type: file.type
      })
    }

    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles,
      message: `成功上传 ${uploadedFiles.length} 个文件`
    })

  } catch (error) {
    console.error('文件上传失败:', error)
    return NextResponse.json({ error: '文件上传失败' }, { status: 500 })
  }
}