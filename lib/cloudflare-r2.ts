import { S3Client } from '@aws-sdk/client-s3'

const r2Config = {
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || 'https://12b8be9e44cba6580153ad19b5eaca0e.r2.cloudflarestorage.com',
  bucketName: process.env.CLOUDFLARE_R2_BUCKET || 'blog',
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
  publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://r2.xicp.top' // 如果配置了自定义域名
}

// 创建S3客户端连接到Cloudflare R2
export const createR2Client = () => {
  if (!r2Config.accessKeyId || !r2Config.secretAccessKey) {
    throw new Error('Cloudflare R2 credentials not configured')
  }

  return new S3Client({
    region: 'auto', // Cloudflare R2 使用 'auto' 作为区域
    endpoint: r2Config.endpoint,
    credentials: {
      accessKeyId: r2Config.accessKeyId,
      secretAccessKey: r2Config.secretAccessKey,
    },
    forcePathStyle: true, // Cloudflare R2 需要路径风格的URL
  })
}

export { r2Config }

// 检查R2配置是否完整
export const isR2Configured = () => {
  return !!(r2Config.accessKeyId && r2Config.secretAccessKey)
}

// 生成R2存储的公共URL
export const getR2PublicUrl = (key: string) => {
  if (r2Config.publicUrl) {
    // 使用自定义域名
    return `${r2Config.publicUrl}/${key}`
  }
  
  // 使用默认的R2 URL格式
  return `${r2Config.endpoint}/${r2Config.bucketName}/${key}`
}