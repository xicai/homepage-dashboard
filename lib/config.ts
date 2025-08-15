// 静态导出配置检测
// 通过检测当前环境来判断是否为静态导出模式
const isStaticBuild = typeof window !== 'undefined' ?
  // 客户端：检查是否为静态部署环境
  window.location.protocol === 'file:' ||
  window.location.hostname === '' ||
  window.location.hostname.includes('github.io') ||
  window.location.hostname.includes('netlify.app') ||
  window.location.hostname.includes('vercel.app') ||
  !window.location.origin.startsWith('http') :
  // 服务端：检查构建配置
  process.env.NODE_ENV === 'production' || process.env.GITHUB_ACTIONS === 'true'

// 动态检测是否为静态导出模式
export const isStaticExport = isStaticBuild

// 存储类型配置
export type StorageType = 'local' | 'github' | 'r2'

export const getStorageType = (): StorageType => {
  // 优先使用环境变量配置
  const envStorageType = process.env.NEXT_PUBLIC_STORAGE_TYPE as StorageType
  if (envStorageType && ['local', 'github', 'r2'].includes(envStorageType)) {
    return envStorageType
  }
  
  // 回退到默认逻辑
  return isStaticExport ? 'github' : 'local'
}

// 功能开关配置
export const features = {
  // 文件上传功能（静态导出时禁用）
  fileUpload: !isStaticExport,
  // 文件删除功能（静态导出时禁用）
  fileDelete: !isStaticExport,
  // 数据清理功能（静态导出时禁用）
  dataClear: !isStaticExport,
  // 存储类型
  storageType: getStorageType(),
}

// 存储配置
export const storage = {
  // 静态导出时使用 localStorage，否则使用服务器存储
  useLocalStorage: isStaticExport,
  // 当前存储类型
  type: getStorageType(),
}

// 运行时检测API可用性
export const checkApiAvailability = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return !isStaticExport
  
  try {
    const storageType = getStorageType()
    const endpoint = storageType === 'r2' ? '/api/upload-r2' : '/api/upload'
    const response = await fetch(endpoint, { method: 'HEAD' })
    return response.ok || response.status === 405 // 405 表示方法不允许但端点存在
  } catch {
    return false
  }
}

// 检查R2配置是否可用
export const checkR2Availability = (): boolean => {
  return !!(
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID && 
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  )
}