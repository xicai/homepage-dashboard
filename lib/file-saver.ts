// 高性能本地文件保存工具
// 支持多种保存方式，确保在 GitHub Pages 上也能正常工作

interface SaveOptions {
  filename: string
  data: Blob | string
  mimeType?: string
}

interface DirectorySaveOptions extends SaveOptions {
  suggestedName?: string
  directory?: 'downloads' | 'pictures' | 'documents'
}

// 检测浏览器支持的功能
const checkBrowserSupport = () => {
  return {
    // File System Access API (Chrome 86+)
    fileSystemAccess: 'showSaveFilePicker' in window,
    // Web Share API (移动端和部分桌面浏览器)
    webShare: 'share' in navigator && 'canShare' in navigator,
    // Service Worker (用于后台处理)
    serviceWorker: 'serviceWorker' in navigator,
    // IndexedDB (用于大文件缓存)
    indexedDB: 'indexedDB' in window,
  }
}

// 方法1: File System Access API (最佳体验，Chrome/Edge)
const saveWithFileSystemAPI = async (options: DirectorySaveOptions): Promise<boolean> => {
  try {
    if (!('showSaveFilePicker' in window)) return false

    const fileHandle = await (window as any).showSaveFilePicker({
      suggestedName: options.filename,
      types: [{
        description: '图片文件',
        accept: {
          'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
          'application/json': ['.json'],
        },
      }],
    })

    const writable = await fileHandle.createWritable()
    
    if (typeof options.data === 'string') {
      await writable.write(options.data)
    } else {
      await writable.write(options.data)
    }
    
    await writable.close()
    return true
  } catch (error) {
    console.log('File System Access API 保存失败:', error)
    return false
  }
}

// 方法2: 传统下载方式 (兼容性最好)
const saveWithDownload = (options: SaveOptions): boolean => {
  try {
    let blob: Blob
    
    if (typeof options.data === 'string') {
      blob = new Blob([options.data], { 
        type: options.mimeType || 'text/plain;charset=utf-8' 
      })
    } else {
      blob = options.data
    }

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = options.filename
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理内存
    setTimeout(() => URL.revokeObjectURL(url), 100)
    
    return true
  } catch (error) {
    console.error('传统下载保存失败:', error)
    return false
  }
}

// 方法3: Web Share API (移动端优化)
const saveWithWebShare = async (options: SaveOptions): Promise<boolean> => {
  try {
    if (!('share' in navigator)) return false

    let file: File
    
    if (typeof options.data === 'string') {
      const blob = new Blob([options.data], { 
        type: options.mimeType || 'text/plain' 
      })
      file = new File([blob], options.filename, { 
        type: options.mimeType || 'text/plain' 
      })
    } else {
      file = new File([options.data], options.filename, { 
        type: options.data.type || 'application/octet-stream' 
      })
    }

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: '保存文件',
        text: `保存 ${options.filename}`,
      })
      return true
    }
    
    return false
  } catch (error) {
    console.log('Web Share API 保存失败:', error)
    return false
  }
}

// 方法4: 批量保存为 ZIP (大量文件时使用)
const saveAsZip = async (files: { name: string; data: Blob | string }[], zipName: string): Promise<boolean> => {
  try {
    // 动态导入 JSZip (仅在需要时加载)
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    // 添加文件到 ZIP
    files.forEach(file => {
      if (typeof file.data === 'string') {
        zip.file(file.name, file.data)
      } else {
        zip.file(file.name, file.data)
      }
    })

    // 生成 ZIP 文件
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    
    return saveWithDownload({
      filename: zipName,
      data: zipBlob,
      mimeType: 'application/zip'
    })
  } catch (error) {
    console.error('ZIP 保存失败:', error)
    return false
  }
}

// 主要保存函数 - 自动选择最佳方式
export const saveFile = async (options: DirectorySaveOptions): Promise<boolean> => {
  const support = checkBrowserSupport()
  
  // 优先级顺序：File System Access API > Web Share API > 传统下载
  
  // 1. 尝试 File System Access API (桌面端最佳体验)
  if (support.fileSystemAccess) {
    const success = await saveWithFileSystemAPI(options)
    if (success) {
      console.log('✅ 使用 File System Access API 保存成功')
      return true
    }
  }
  
  // 2. 尝试 Web Share API (移动端优化)
  if (support.webShare && /Mobi|Android/i.test(navigator.userAgent)) {
    const success = await saveWithWebShare(options)
    if (success) {
      console.log('✅ 使用 Web Share API 保存成功')
      return true
    }
  }
  
  // 3. 回退到传统下载方式 (兼容性最好)
  const success = saveWithDownload(options)
  if (success) {
    console.log('✅ 使用传统下载方式保存成功')
    return true
  }
  
  console.error('❌ 所有保存方式都失败了')
  return false
}

// 批量保存函数
export const saveMultipleFiles = async (
  files: { name: string; data: Blob | string }[],
  options: { 
    useZip?: boolean
    zipName?: string
    showProgress?: (current: number, total: number) => void
  } = {}
): Promise<boolean> => {
  
  // 如果文件数量多或者用户选择打包，使用 ZIP
  if (options.useZip || files.length > 5) {
    return saveAsZip(files, options.zipName || 'files.zip')
  }
  
  // 逐个保存文件
  let successCount = 0
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    options.showProgress?.(i + 1, files.length)
    
    const success = await saveFile({
      filename: file.name,
      data: file.data
    })
    
    if (success) successCount++
    
    // 添加小延迟避免浏览器阻止多个下载
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return successCount === files.length
}

// 保存图片的便捷函数
export const saveImage = async (
  imageData: string | Blob, 
  filename: string,
  quality: number = 0.9
): Promise<boolean> => {
  let blob: Blob
  
  if (typeof imageData === 'string') {
    // 如果是 base64 或 data URL
    if (imageData.startsWith('data:')) {
      const response = await fetch(imageData)
      blob = await response.blob()
    } else {
      // 如果是普通字符串，当作文本处理
      blob = new Blob([imageData], { type: 'text/plain' })
    }
  } else {
    blob = imageData
  }
  
  // 如果是图片且需要压缩
  if (blob.type.startsWith('image/') && quality < 1) {
    blob = await compressImage(blob, quality)
  }
  
  return saveFile({
    filename,
    data: blob,
    mimeType: blob.type
  })
}

// 图片压缩函数 (性能优化)
const compressImage = async (blob: Blob, quality: number): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      canvas.toBlob((compressedBlob) => {
        resolve(compressedBlob || blob)
      }, blob.type, quality)
    }
    
    img.src = URL.createObjectURL(blob)
  })
}

// 导出浏览器支持信息
export { checkBrowserSupport }

// 使用示例:
/*
// 保存单个文件
await saveFile({
  filename: 'my-image.jpg',
  data: imageBlob
})

// 保存多个文件
await saveMultipleFiles([
  { name: 'image1.jpg', data: blob1 },
  { name: 'image2.jpg', data: blob2 }
], { 
  useZip: true, 
  zipName: 'my-images.zip' 
})

// 保存图片 (带压缩)
await saveImage(imageBlob, 'compressed-image.jpg', 0.8)
*/