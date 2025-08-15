"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, FileImage, Check, Github, Settings, Key, Eye, EyeOff, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { githubUploader } from "@/lib/github-uploader"
import { decryptGitHubConfig, validateEncryptedConfig, getRepoInfoFromConfig } from "@/lib/config-crypto"
import { features, storage } from "@/lib/config"
import ConfigGenerator from "@/components/config-generator"

interface SimpleBulkUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddImages: (images: any[]) => void
}

export default function SimpleBulkUploadDialog({ isOpen, onClose, onAddImages }: SimpleBulkUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [showConfig, setShowConfig] = useState(false)
  const [storageType, setStorageType] = useState<'local' | 'github' | 'r2'>(storage.type)
  
  // GitHub配置状态
  const [encryptedConfig, setEncryptedConfig] = useState('')
  const [showEncryptedConfig, setShowEncryptedConfig] = useState(false)
  const [configValid, setConfigValid] = useState(false)
  const [repoInfo, setRepoInfo] = useState<{ owner: string, repo: string, branch: string } | null>(null)
  
  const [isConfigured, setIsConfigured] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 检查配置
  useEffect(() => {
    const savedEncryptedConfig = localStorage.getItem('github-encrypted-config')
    if (savedEncryptedConfig) {
      try {
        // 验证加密配置
        const isValid = validateEncryptedConfig(savedEncryptedConfig)
        if (isValid) {
          setEncryptedConfig(savedEncryptedConfig)
          setConfigValid(true)
          
          // 获取仓库信息用于显示
          const info = getRepoInfoFromConfig(savedEncryptedConfig)
          if (info) {
            setRepoInfo(info)
            setIsConfigured(true)
          }
        }
      } catch (error) {
        console.error('配置验证失败:', error)
      }
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // 过滤图片文件
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length !== selectedFiles.length) {
      alert('只能上传图片文件')
    }
    
    setFiles(prev => [...prev, ...imageFiles])
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const droppedFiles = Array.from(event.dataTransfer.files)
    
    // 过滤图片文件
    const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length !== droppedFiles.length) {
      alert('只能上传图片文件')
    }
    
    setFiles(prev => [...prev, ...imageFiles])
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    // 根据存储类型进行不同的上传处理
    if (storageType === 'github') {
      return await handleGitHubUpload()
    } else if (storageType === 'r2') {
      return await handleR2Upload()
    } else {
      return await handleLocalUpload()
    }
  }

  const handleGitHubUpload = async () => {
    if (!isConfigured) {
      alert('请先配置GitHub设置')
      return
    }

    // 解密配置
    const config = decryptGitHubConfig(encryptedConfig)
    if (!config) {
      alert('无法解析配置，请重新设置')
      return
    }

    console.log('📤 开始上传到GitHub，文件数量:', files.length)
    setIsUploading(true)
    setUploadProgress(0)

    const newImages: any[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // 生成文件名
        const timestamp = Date.now() + i
        const fileExtension = file.name.split('.').pop()
        const fileName = `${timestamp}.${fileExtension}`
        const filePath = `uploads/${fileName}`
        
        // 上传到GitHub
        const result = await githubUploader.uploadFile({
          token: config.token,
          owner: config.owner,
          repo: config.repo,
          branch: config.branch,
          path: filePath,
          content: await githubUploader.imageToBase64(file),
          message: `Upload image: ${file.name}`,
          isBase64: true
        })

        if (result.success) {
          // 生成GitHub raw链接
          const githubUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${filePath}`
          
          // 获取图片尺寸
          const img = document.createElement('img')
          await new Promise((resolve) => {
            img.onload = resolve
            img.src = URL.createObjectURL(file)
          })

          const aspectRatio = img.width / img.height
          const fileName = file.name.replace(/\.[^/.]+$/, "")

          newImages.push({
            id: Date.now() + i,
            title: fileName,
            url: githubUrl,
            description: `上传到GitHub的图片: ${file.name}`,
            favicon: "/placeholder.svg",
            screenshot: githubUrl,
            category: "GitHub图片",
            priority: "medium",
            tags: ["GitHub", "图片", "上传"],
            lastVisited: new Date().toISOString().split('T')[0],
            visitCount: 0,
            status: "active",
            notes: `GitHub链接: ${githubUrl}`,
            dateAdded: new Date().toISOString().split('T')[0],
            isFavorite: false,
            timeSpent: "0m",
            weeklyVisits: [0, 0, 0, 0, 0, 0, 0],
            relatedSites: [],
            lastUpdate: new Date().toISOString(),
            siteHealth: "good",
            loadTime: "0.5s",
            mobileOptimized: true,
            additionalImages: [],
            imageWidth: img.width,
            imageHeight: img.height,
            aspectRatio: aspectRatio
          })

          console.log(`✅ 文件上传成功: ${file.name}`)
        } else {
          console.error(`❌ 文件上传失败: ${file.name}`, result.error)
        }

        // 更新进度
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      // 添加所有新书签
      if (newImages.length > 0) {
        onAddImages(newImages)
        setUploadSuccess(true)
        setUploadedCount(newImages.length)
        
        // 3秒后关闭弹窗
        setTimeout(() => {
          onClose()
          setUploadSuccess(false)
          setFiles([])
          setUploadProgress(0)
        }, 3000)
      }

    } catch (error) {
      console.error('❌ 上传过程中发生错误:', error)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleR2Upload = async () => {
    console.log('📤 开始上传到Cloudflare R2，文件数量:', files.length)
    setIsUploading(true)
    setUploadProgress(0)

    const newImages: any[] = []

    try {
      // 创建FormData
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      // 上传到R2
      const response = await fetch('/api/upload-r2', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.results) {
        for (let i = 0; i < result.results.length; i++) {
          const uploadResult = result.results[i]
          
          if (uploadResult.success) {
            const file = files[i]
            
            // 获取图片尺寸
            const img = document.createElement('img')
            await new Promise((resolve) => {
              img.onload = resolve
              img.src = URL.createObjectURL(file)
            })

            const aspectRatio = img.width / img.height
            const fileName = file.name.replace(/\.[^/.]+$/, "")

            newImages.push({
              id: Date.now() + i,
              title: fileName,
              url: uploadResult.url,
              description: `上传到Cloudflare R2的图片: ${file.name}`,
              favicon: "/placeholder.svg",
              screenshot: uploadResult.url,
              category: "R2图片",
              priority: "medium",
              tags: ["Cloudflare", "R2", "图片", "上传"],
              lastVisited: new Date().toISOString().split('T')[0],
              visitCount: 0,
              status: "active",
              notes: `R2链接: ${uploadResult.url}`,
              dateAdded: new Date().toISOString().split('T')[0],
              isFavorite: false,
              timeSpent: "0m",
              weeklyVisits: [0, 0, 0, 0, 0, 0, 0],
              relatedSites: [],
              lastUpdate: new Date().toISOString(),
              siteHealth: "good",
              loadTime: "0.5s",
              mobileOptimized: true,
              additionalImages: [],
              imageWidth: img.width,
              imageHeight: img.height,
              aspectRatio: aspectRatio,
              r2Key: uploadResult.key // 保存R2的key用于删除
            })

            console.log(`✅ 文件上传成功: ${file.name}`)
          } else {
            console.error(`❌ 文件上传失败: ${files[i].name}`, uploadResult.error)
          }

          // 更新进度
          setUploadProgress(((i + 1) / files.length) * 100)
        }

        // 添加所有新书签
        if (newImages.length > 0) {
          onAddImages(newImages)
          setUploadSuccess(true)
          setUploadedCount(newImages.length)
          
          // 3秒后关闭弹窗
          setTimeout(() => {
            onClose()
            setUploadSuccess(false)
            setFiles([])
            setUploadProgress(0)
          }, 3000)
        }
      } else {
        throw new Error(result.error || '上传失败')
      }

    } catch (error) {
      console.error('❌ R2上传过程中发生错误:', error)
      alert('上传失败，请重试: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleLocalUpload = async () => {
    console.log('📤 开始本地上传，文件数量:', files.length)
    setIsUploading(true)
    setUploadProgress(0)

    const newImages: any[] = []

    try {
      // 创建FormData
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      // 上传到本地服务器
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.uploadedFiles) {
        for (let i = 0; i < result.uploadedFiles.length; i++) {
          const uploadedFile = result.uploadedFiles[i]
          const file = files[i]
          
          // 获取图片尺寸
          const img = document.createElement('img')
          await new Promise((resolve) => {
            img.onload = resolve
            img.src = URL.createObjectURL(file)
          })

          const aspectRatio = img.width / img.height
          const fileName = file.name.replace(/\.[^/.]+$/, "")

          newImages.push({
            id: Date.now() + i,
            title: fileName,
            url: uploadedFile.url,
            description: `本地上传的图片: ${file.name}`,
            favicon: "/placeholder.svg",
            screenshot: uploadedFile.url,
            category: "本地图片",
            priority: "medium",
            tags: ["本地", "图片", "上传"],
            lastVisited: new Date().toISOString().split('T')[0],
            visitCount: 0,
            status: "active",
            notes: `本地链接: ${uploadedFile.url}`,
            dateAdded: new Date().toISOString().split('T')[0],
            isFavorite: false,
            timeSpent: "0m",
            weeklyVisits: [0, 0, 0, 0, 0, 0, 0],
            relatedSites: [],
            lastUpdate: new Date().toISOString(),
            siteHealth: "good",
            loadTime: "0.5s",
            mobileOptimized: true,
            additionalImages: [],
            imageWidth: img.width,
            imageHeight: img.height,
            aspectRatio: aspectRatio
          })

          console.log(`✅ 文件上传成功: ${file.name}`)

          // 更新进度
          setUploadProgress(((i + 1) / files.length) * 100)
        }

        // 添加所有新书签
        if (newImages.length > 0) {
          onAddImages(newImages)
          setUploadSuccess(true)
          setUploadedCount(newImages.length)
          
          // 3秒后关闭弹窗
          setTimeout(() => {
            onClose()
            setUploadSuccess(false)
            setFiles([])
            setUploadProgress(0)
          }, 3000)
        }
      } else {
        throw new Error(result.error || '上传失败')
      }

    } catch (error) {
      console.error('❌ 本地上传过程中发生错误:', error)
      alert('上传失败，请重试: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfigSubmit = (config: string) => {
    try {
      const isValid = validateEncryptedConfig(config)
      if (isValid) {
        setEncryptedConfig(config)
        setConfigValid(true)
        
        // 保存到localStorage
        localStorage.setItem('github-encrypted-config', config)
        
        // 获取仓库信息用于显示
        const info = getRepoInfoFromConfig(config)
        if (info) {
          setRepoInfo(info)
          setIsConfigured(true)
        }
        
        setShowConfig(false)
        alert('✅ GitHub配置已保存')
      } else {
        alert('❌ 配置格式无效，请检查')
      }
    } catch (error) {
      console.error('配置验证失败:', error)
      alert('❌ 配置验证失败，请重试')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            批量上传图片
          </DialogTitle>
          <DialogDescription>
            选择多个图片文件进行批量上传
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 存储类型选择 */}
          <div className="space-y-2">
            <Label>存储类型</Label>
            <Select value={storageType} onValueChange={(value: 'local' | 'github' | 'r2') => setStorageType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择存储类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    本地存储
                  </div>
                </SelectItem>
                <SelectItem value="github">
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub存储
                  </div>
                </SelectItem>
                <SelectItem value="r2">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Cloudflare R2
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* GitHub配置 */}
          {storageType === 'github' && (
            <div className="space-y-4">
              {/* 配置状态显示 */}
              {isConfigured && repoInfo ? (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">GitHub已配置</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowConfig(true)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      重新配置
                    </Button>
                  </div>
                  <p className="text-green-700 text-sm mt-2">
                    仓库: {repoInfo.owner}/{repoInfo.repo} (分支: {repoInfo.branch})
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Github className="h-5 w-5 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">需要配置GitHub</span>
                  </div>
                  <p className="text-yellow-700 text-sm mb-3">
                    请配置GitHub仓库信息以使用GitHub存储功能
                  </p>
                  <Button 
                    onClick={() => setShowConfig(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Key className="h-4 w-4 mr-1" />
                    配置GitHub
                  </Button>
                </div>
              )}

              {/* 配置对话框 */}
              {showConfig && (
                <ConfigGenerator 
                  onConfigGenerated={handleConfigSubmit}
                />
              )}
            </div>
          )}

          {/* R2配置提示 */}
          {storageType === 'r2' && (
            <Alert>
              <Cloud className="h-4 w-4" />
              <AlertDescription>
                使用Cloudflare R2存储。请确保环境变量已正确配置R2访问密钥。
              </AlertDescription>
            </Alert>
          )}

          {/* 文件选择区域 */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              点击或拖拽图片到这里
            </p>
            <p className="text-sm text-gray-500">
              支持 JPG、PNG、GIF、WebP 等格式
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">已选择文件 ({files.length})</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    添加更多文件
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={isUploading || (storageType === 'github' && !isConfigured)}
                  >
                    {isUploading ? '上传中...' : 
                      storageType === 'github' ? '上传到GitHub' :
                      storageType === 'r2' ? '上传到R2' : '本地上传'}
                  </Button>
                </div>
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium truncate max-w-48">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 上传进度 */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>上传进度</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* 成功提示 */}
          {uploadSuccess && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                成功上传 {uploadedCount} 个文件！窗口将在 3 秒后自动关闭...
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}