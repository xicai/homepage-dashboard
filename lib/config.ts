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

// 功能开关配置
export const features = {
  // 文件上传功能（静态导出时禁用）
  fileUpload: !isStaticExport,
  // 文件删除功能（静态导出时禁用）
  fileDelete: !isStaticExport,
  // 数据清理功能（静态导出时禁用）
  dataClear: !isStaticExport,
}

// 存储配置
export const storage = {
  // 静态导出时使用 localStorage，否则使用服务器存储
  useLocalStorage: isStaticExport,
}

// 运行时检测API可用性
export const checkApiAvailability = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return !isStaticExport
  
  try {
    const response = await fetch('/api/upload', { method: 'HEAD' })
    return response.ok || response.status === 405 // 405 表示方法不允许但端点存在
  } catch {
    return false
  }
}