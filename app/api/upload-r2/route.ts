import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { createR2Client, r2Config, isR2Configured, getR2PublicUrl } from '@/lib/cloudflare-r2'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 R2上传API开始处理请求...')
    
    // 检查R2配置
    if (!isR2Configured()) {
      console.error('❌ Cloudflare R2 配置不完整')
      console.log('环境变量检查:', {
        hasAccessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        bucket: process.env.CLOUDFLARE_R2_BUCKET
      })
      return NextResponse.json(
        { success: false, error: 'Cloudflare R2 not configured' },
        { status: 500 }
      )
    }

    console.log('✅ R2配置检查通过')

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    console.log(`📁 接收到 ${files.length} 个文件`)

    if (!files || files.length === 0) {
      console.error('❌ 没有接收到文件')
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    let r2Client
    try {
      r2Client = createR2Client()
      console.log('✅ R2客户端创建成功')
    } catch (error) {
      console.error('❌ R2客户端创建失败:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create R2 client: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      )
    }

    const uploadResults = []

    for (const file of files) {
      try {
        console.log(`📤 开始上传文件: ${file.name}, 大小: ${file.size} bytes`)
        
        // 生成唯一的文件名
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const fileName = `${timestamp}.${fileExtension}`
        const key = `uploads/${fileName}`

        console.log(`🔑 生成的key: ${key}`)

        // 将文件转换为Buffer
        const buffer = Buffer.from(await file.arrayBuffer())
        console.log(`💾 文件转换为Buffer完成, 大小: ${buffer.length} bytes`)

        // 上传到R2
        const putCommand = new PutObjectCommand({
          Bucket: r2Config.bucketName,
          Key: key,
          Body: buffer,
          ContentType: file.type,
          ContentLength: buffer.length,
          // 设置缓存控制
          CacheControl: 'public, max-age=31536000', // 1年缓存
        })

        console.log(`☁️ 发送上传命令到R2...`)
        console.log('上传参数:', {
          Bucket: r2Config.bucketName,
          Key: key,
          ContentType: file.type,
          ContentLength: buffer.length
        })

        await r2Client.send(putCommand)

        console.log(`✅ 文件上传到R2成功: ${key}`)

        // 生成公共访问URL
        const publicUrl = getR2PublicUrl(key)
        console.log(`🔗 生成公共URL: ${publicUrl}`)

        uploadResults.push({
          success: true,
          filename: file.name,
          url: publicUrl,
          key: key,
          size: buffer.length
        })

        console.log(`✅ 文件上传成功: ${file.name} -> ${publicUrl}`)

      } catch (error) {
        console.error(`❌ 文件上传失败: ${file.name}`, error)
        uploadResults.push({
          success: false,
          filename: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        })
      }
    }

    // 检查是否有成功上传的文件
    const successfulUploads = uploadResults.filter(result => result.success)
    const failedUploads = uploadResults.filter(result => !result.success)

    console.log(`📊 上传结果统计: 成功 ${successfulUploads.length}, 失败 ${failedUploads.length}`)

    return NextResponse.json({
      success: successfulUploads.length > 0,
      uploaded: successfulUploads.length,
      failed: failedUploads.length,
      results: uploadResults,
      message: `成功上传 ${successfulUploads.length} 个文件${failedUploads.length > 0 ? `，${failedUploads.length} 个失败` : ''}`
    })

  } catch (error) {
    console.error('❌ R2上传API错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// 删除文件的API
export async function DELETE(request: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { success: false, error: 'Cloudflare R2 not configured' },
        { status: 500 }
      )
    }

    const { keys } = await request.json()

    if (!keys || !Array.isArray(keys)) {
      return NextResponse.json(
        { success: false, error: 'No keys provided' },
        { status: 400 }
      )
    }

    const r2Client = createR2Client()
    const deleteResults = []

    for (const key of keys) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: r2Config.bucketName,
          Key: key
        })

        await r2Client.send(deleteCommand)

        deleteResults.push({
          success: true,
          key: key
        })

        console.log(`✅ 文件删除成功: ${key}`)

      } catch (error) {
        console.error(`❌ 文件删除失败: ${key}`, error)
        deleteResults.push({
          success: false,
          key: key,
          error: error instanceof Error ? error.message : 'Delete failed'
        })
      }
    }

    const successfulDeletes = deleteResults.filter(result => result.success)
    const failedDeletes = deleteResults.filter(result => !result.success)

    return NextResponse.json({
      success: successfulDeletes.length > 0,
      deleted: successfulDeletes.length,
      failed: failedDeletes.length,
      results: deleteResults,
      message: `成功删除 ${successfulDeletes.length} 个文件${failedDeletes.length > 0 ? `，${failedDeletes.length} 个失败` : ''}`
    })

  } catch (error) {
    console.error('❌ R2删除API错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}