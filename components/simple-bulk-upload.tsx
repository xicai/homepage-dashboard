"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, FileImage, Check, Github, Settings, Key, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import ConfigGenerator from "@/components/config-generator"

interface SimpleBulkUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddBookmarks: (bookmarks: any[]) => void
}

export default function SimpleBulkUploadDialog({ isOpen, onClose, onAddBookmarks }: SimpleBulkUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [showConfig, setShowConfig] = useState(false)
  
  // 新的加密配置状态
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
        if (validateEncryptedConfig(savedEncryptedConfig)) {
          setEncryptedConfig(savedEncryptedConfig)
          setConfigValid(true)
          setIsConfigured(true)
          
          // 获取仓库信息用于显示
          const info = getRepoInfoFromConfig(savedEncryptedConfig)
          if (info) {
            setRepoInfo(info)
          }
        } else {
          setShowConfig(true)
        }
      } catch {
        setShowConfig(true)
      }
    } else {
      setShowConfig(true)
    }
  }, [])

  // 处理加密配置输入变化
  const handleEncryptedConfigChange = (value: string) => {
    setEncryptedConfig(value)
    
    // 实时验证配置
    if (value.trim()) {
      const isValid = validateEncryptedConfig(value)
      setConfigValid(isValid)
      
      if (isValid) {
        const info = getRepoInfoFromConfig(value)
        setRepoInfo(info)
      } else {
        setRepoInfo(null)
      }
    } else {
      setConfigValid(false)
      setRepoInfo(null)
    }
  }

  const saveConfig = () => {
    if (!encryptedConfig.trim()) {
      alert('请输入加密配置字符串')
      return
    }
    
    if (!configValid) {
      alert('配置字符串无效，请检查格式')
      return
    }
    
    localStorage.setItem('github-encrypted-config', encryptedConfig)
    setIsConfigured(true)
    setShowConfig(false)
  }

  const clearConfig = () => {
    localStorage.removeItem('github-encrypted-config')
    setEncryptedConfig('')
    setConfigValid(false)
    setRepoInfo(null)
    setIsConfigured(false)
    setShowConfig(true)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles))
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0 || !isConfigured) return

    // 解密配置
    const config = decryptGitHubConfig(encryptedConfig)
    if (!config) {
      alert('无法解析配置，请重新设置')
      return
    }

    console.log('📤 开始上传到GitHub，文件数量:', files.length)
    setIsUploading(true)
    setUploadProgress(0)

    const newBookmarks: any[] = []

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
          
          const newBookmark = {
            id: Date.now() + i,
            title: fileName,
            url: githubUrl,
            description: `上传到GitHub的图片: ${file.name}`,
            favicon: "/placeholder.svg",
            screenshot: githubUrl, // 使用GitHub链接
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
          }

          newBookmarks.push(newBookmark)
          console.log('✅ 上传成功:', githubUrl)
        } else {
          console.error('❌ 上传失败:', result.error)
        }
        
        // 更新进度
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      console.log('✅ 所有文件上传完成，数量:', newBookmarks.length)
      onAddBookmarks(newBookmarks)
      
      setUploadedCount(newBookmarks.length)
      setUploadSuccess(true)
      setFiles([])
      
    } catch (error) {
      console.error('❌ 上传失败:', error)
      alert('上传失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsUploading(false)
      
      // 3秒后重置状态
      setTimeout(() => {
        setUploadProgress(0)
        setUploadSuccess(false)
        setUploadedCount(0)
      }, 3000)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setFiles([])
      setUploadProgress(0)
      setUploadSuccess(false)
      setUploadedCount(0)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            上传图片到GitHub
          </DialogTitle>
          <DialogDescription>
            图片将上传到GitHub仓库，获得永久可访问链接
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* GitHub配置 */}
          {!isConfigured && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                请先配置GitHub加密字符串才能上传图片
              </AlertDescription>
            </Alert>
          )}

          {showConfig && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-500" />
                  <h3 className="font-medium">GitHub加密配置</h3>
                </div>
                <ConfigGenerator 
                  onConfigGenerated={(config) => {
                    handleEncryptedConfigChange(config)
                  }}
                />
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label>加密配置字符串 *</Label>
                  <div className="relative">
                    <Input
                      type={showEncryptedConfig ? "text" : "password"}
                      placeholder="请输入加密后的配置字符串..."
                      value={encryptedConfig}
                      onChange={(e) => handleEncryptedConfigChange(e.target.value)}
                      className={`pr-20 ${configValid ? 'border-green-500' : encryptedConfig ? 'border-red-500' : ''}`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
                      {configValid && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setShowEncryptedConfig(!showEncryptedConfig)}
                      >
                        {showEncryptedConfig ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    包含GitHub Token、用户名和仓库名的加密字符串
                  </p>
                  {encryptedConfig && !configValid && (
                    <p className="text-xs text-red-500 mt-1">
                      配置字符串格式无效
                    </p>
                  )}
                  {configValid && repoInfo && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ 目标仓库: {repoInfo.owner}/{repoInfo.repo} ({repoInfo.branch})
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={saveConfig} disabled={!configValid}>
                    保存配置
                  </Button>
                  {isConfigured && (
                    <Button variant="outline" onClick={clearConfig}>
                      清除配置
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {isConfigured && repoInfo && (
            <div className="flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded">
              <span className="text-sm text-green-700 flex items-center gap-2">
                <Check className="h-4 w-4" />
                已配置GitHub: {repoInfo.owner}/{repoInfo.repo}
              </span>
              <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
                修改配置
              </Button>
            </div>
          )}

          {/* 文件选择区域 */}
          {isConfigured && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {files.length === 0 ? (
                  <div>
                    <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg mb-2">选择图片文件</p>
                    <p className="text-sm text-gray-500 mb-4">图片将上传到GitHub，获得永久链接</p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      选择文件
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg mb-4">已选择 {files.length} 个文件</p>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                          <span className="text-sm truncate">{file.name}</span>
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
                    <div className="mt-4 space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        添加更多文件
                      </Button>
                      <Button onClick={handleUpload} disabled={isUploading}>
                        {isUploading ? '上传中...' : '上传到GitHub'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 上传进度 */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>上传到GitHub进度</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* 成功提示 */}
              {uploadSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800">
                  <Check className="h-4 w-4" />
                  <span>成功上传 {uploadedCount} 张图片到GitHub! 现在可以在任何地方访问这些图片了。</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {isUploading ? '上传中...' : '关闭'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}