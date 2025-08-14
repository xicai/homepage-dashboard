"use client"

import { useState, useRef } from "react"
import { features } from "@/lib/config"
import { saveFile, saveMultipleFiles, saveImage, checkBrowserSupport } from "@/lib/file-saver"
import { githubUploader } from "@/lib/github-uploader"
import { Upload, X, FileImage, Check, Github, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

interface EnhancedBulkUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddBookmarks: (bookmarks: any[]) => void
}

export function EnhancedBulkUploadDialog({ isOpen, onClose, onAddBookmarks }: EnhancedBulkUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMode, setUploadMode] = useState<'local' | 'github'>('local')
  const [githubConfig, setGithubConfig] = useState({
    token: '',
    owner: '',
    repo: '',
    branch: 'master',
    uploadPath: 'uploads'
  })
  const [showGithubConfig, setShowGithubConfig] = useState(false)
  const [validationError, setValidationError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 从 localStorage 加载 GitHub 配置
  const loadGithubConfig = () => {
    try {
      const saved = localStorage.getItem('github-upload-config')
      if (saved) {
        const parsedConfig = JSON.parse(saved)
        setGithubConfig(prev => ({ ...prev, ...parsedConfig }))
      }
    } catch (error) {
      console.error('Failed to load GitHub config:', error)
    }
  }

  // 保存 GitHub 配置
  const saveGithubConfig = () => {
    try {
      localStorage.setItem('github-upload-config', JSON.stringify(githubConfig))
      toast({
        title: "配置已保存",
        description: "GitHub 配置已成功保存到本地",
      })
    } catch (error) {
      console.error('Failed to save GitHub config:', error)
      toast({
        title: "保存失败",
        description: "无法保存配置到本地存储",
        variant: "destructive"
      })
    }
  }

  // 验证 GitHub 配置
  const validateGithubConfig = async (): Promise<boolean> => {
    setValidationError('')
    
    if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
      setValidationError('请填写所有必需的配置项')
      return false
    }

    try {
      const isValidToken = await githubUploader.validateToken(githubConfig.token)
      if (!isValidToken) {
        setValidationError('GitHub Token 无效，请检查权限')
        return false
      }

      const repoInfo = await githubUploader.getRepoInfo(githubConfig.token, githubConfig.owner, githubConfig.repo)
      if (!repoInfo) {
        setValidationError('无法访问指定的仓库，请检查仓库名称和权限')
        return false
      }

      return true
    } catch (error) {
      setValidationError('配置验证失败：' + (error instanceof Error ? error.message : '未知错误'))
      return false
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'))
    setFiles(imageFiles)
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    // 如果选择 GitHub 模式，先验证配置
    if (uploadMode === 'github') {
      if (!(await validateGithubConfig())) {
        return
      }
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      if (uploadMode === 'github') {
        // GitHub 上传模式
        console.log('📤 GitHub 模式：上传到 GitHub 仓库...')
        
        const newBookmarks: any[] = []
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileName = githubUploader.generateUniqueFileName(file.name, githubConfig.uploadPath)
          
          try {
            const base64Content = await githubUploader.imageToBase64(file)
            const result = await githubUploader.uploadFile({
              token: githubConfig.token,
              owner: githubConfig.owner,
              repo: githubConfig.repo,
              branch: githubConfig.branch,
              path: fileName,
              content: base64Content,
              message: `Upload image: ${file.name}`,
              isBase64: true
            })
            
            if (result.success) {
              // 创建书签对象
              const newBookmark = {
                id: Date.now() + Math.random(),
                title: file.name.replace(/\.[^/.]+$/, ""),
                url: result.url || `https://github.com/${githubConfig.owner}/${githubConfig.repo}/blob/${githubConfig.branch}/${fileName}`,
                description: `GitHub 上传: ${file.name}`,
                favicon: "/placeholder.svg?height=32&width=32",
                screenshot: result.url || URL.createObjectURL(file),
                category: "GitHub 上传",
                priority: "medium",
                tags: ["github", "upload", "image"],
                lastVisited: new Date().toISOString().split('T')[0],
                visitCount: 0,
                status: "active",
                notes: `文件大小: ${(file.size / 1024).toFixed(2)} KB\nGitHub 路径: ${fileName}`,
                dateAdded: new Date().toISOString().split('T')[0],
                isFavorite: false,
                timeSpent: "0m",
                weeklyVisits: [0, 0, 0, 0, 0, 0, 0],
                relatedSites: [],
                lastUpdate: new Date().toISOString(),
                siteHealth: "good",
                loadTime: "1.0s",
                mobileOptimized: true,
                fileSize: file.size,
                fileType: file.type,
                fileName: fileName,
                githubUrl: result.url
              }
              
              newBookmarks.push(newBookmark)
            } else {
              console.error(`上传失败: ${file.name}`, result.error)
              toast({
                title: "上传失败",
                description: `${file.name}: ${result.error}`,
                variant: "destructive"
              })
            }
          } catch (error) {
            console.error(`上传错误: ${file.name}`, error)
            toast({
              title: "上传错误",
              description: `${file.name}: ${error instanceof Error ? error.message : '未知错误'}`,
              variant: "destructive"
            })
          }
          
          // 更新进度
          setUploadProgress(((i + 1) / files.length) * 100)
        }
        
        if (newBookmarks.length > 0) {
          onAddBookmarks(newBookmarks)
          toast({
            title: "上传成功",
            description: `成功上传 ${newBookmarks.length} 个文件到 GitHub！`,
          })
        }
        
      } else if (features.fileUpload) {
        // 服务器模式 - 使用 API 上传
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('上传失败')
        }

        const result = await response.json()
        const newBookmarks = result.files.map((uploadedFile: any) => ({
          id: Date.now() + Math.random(),
          title: uploadedFile.originalName.replace(/\.[^/.]+$/, ""),
          url: "",
          description: `上传的图片: ${uploadedFile.originalName}`,
          favicon: "/placeholder.svg?height=32&width=32",
          screenshot: uploadedFile.url,
          category: "上传图片",
          priority: "medium",
          tags: ["upload", "image"],
          lastVisited: new Date().toISOString().split('T')[0],
          visitCount: 0,
          status: "active",
          notes: `文件大小: ${(uploadedFile.size / 1024).toFixed(2)} KB`,
          dateAdded: new Date().toISOString().split('T')[0],
          isFavorite: false,
          timeSpent: "0m",
          weeklyVisits: [0, 0, 0, 0, 0, 0, 0],
          relatedSites: [],
          lastUpdate: new Date().toISOString(),
          siteHealth: "good",
          loadTime: "1.0s",
          mobileOptimized: true,
          fileSize: uploadedFile.size,
          fileType: uploadedFile.type,
          fileName: uploadedFile.fileName
        }))

        onAddBookmarks(newBookmarks)
        alert(`成功上传 ${result.files.length} 个文件！`)
      } else {
        // 静态导出模式 - 使用高性能文件保存器
        console.log('📤 静态模式：使用高性能文件保存器...')
        
        const browserSupport = checkBrowserSupport()
        console.log('🔍 浏览器支持情况:', browserSupport)
        
        const newBookmarks: any[] = []
        
        // 准备文件数据
        const filesToSave = files.map((file, i) => {
          const timestamp = Date.now() + i
          const fileExtension = file.name.split('.').pop()
          const newFileName = `image_${timestamp}.${fileExtension}`
          
          return {
            name: newFileName,
            data: file,
            originalFile: file,
            timestamp
          }
        })
        
        // 使用高性能文件保存器
        let saveSuccess = false
        
        if (files.length === 1) {
          // 单个文件保存
          const fileData = filesToSave[0]
          saveSuccess = await saveImage(
            fileData.data, 
            fileData.name,
            0.9 // 90% 质量，保持性能
          )
        } else {
          // 多个文件保存
          const shouldUseZip = files.length > 3 // 超过3个文件时打包
          
          saveSuccess = await saveMultipleFiles(
            filesToSave.map(f => ({ name: f.name, data: f.data })),
            {
              useZip: shouldUseZip,
              zipName: `images_${Date.now()}.zip`,
              showProgress: (current, total) => {
                setUploadProgress((current / total) * 100)
              }
            }
          )
        }
        
        if (saveSuccess) {
          // 创建书签对象（用于应用内显示）
          for (let i = 0; i < filesToSave.length; i++) {
            const fileData = filesToSave[i]
            const file = fileData.originalFile
            
            // 创建本地 URL 用于预览
            const localUrl = URL.createObjectURL(file)
            
            const bookmark = {
              id: fileData.timestamp,
              title: file.name.replace(/\.[^/.]+$/, ""),
              url: "",
              description: `本地图片: ${file.name}`,
              favicon: "/placeholder.svg?height=32&width=32",
              screenshot: localUrl, // 使用 blob URL 进行预览
              category: "本地上传",
              priority: "medium",
              tags: ["upload", "image", "local"],
              lastVisited: new Date().toISOString().split('T')[0],
              visitCount: 0,
              status: "active",
              notes: `文件大小: ${(file.size / 1024).toFixed(2)} KB\n已保存到本地`,
              dateAdded: new Date().toISOString().split('T')[0],
              isFavorite: false,
              timeSpent: "0m",
              weeklyVisits: [0, 0, 0, 0, 0, 0, 0],
              relatedSites: [],
              lastUpdate: new Date().toISOString(),
              siteHealth: "good",
              loadTime: "1.0s",
              mobileOptimized: true,
              fileSize: file.size,
              fileType: file.type,
              fileName: fileData.name,
              localUrl: localUrl // 保存本地 URL
            }
            
            newBookmarks.push(bookmark)
          }
          
          onAddBookmarks(newBookmarks)
          
          const saveMethod = browserSupport.fileSystemAccess ? 'File System Access API' : 
                           browserSupport.webShare ? 'Web Share API' : '传统下载'
          
          alert(`✅ 成功保存 ${files.length} 个文件！\n保存方式: ${saveMethod}\n\n图片已添加到应用中，可以正常查看和管理。`)
          
        } else {
          throw new Error('所有保存方式都失败了')
        }
      }
      
    } catch (error) {
      console.error('❌ 文件保存失败:', error)
      alert(`❌ 文件保存失败: ${error}\n\n请检查浏览器权限或尝试其他浏览器。`)
    } finally {
      setIsUploading(false)
      setFiles([])
      onClose()
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
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
            选择多个图片文件进行批量上传，支持本地保存和 GitHub 上传
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 上传模式选择 */}
          <Tabs value={uploadMode} onValueChange={(value) => {
            setUploadMode(value as 'local' | 'github')
            if (value === 'github') {
              loadGithubConfig()
            }
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                本地保存
              </TabsTrigger>
              <TabsTrigger value="github" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub 上传
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="local" className="space-y-4">
              <div className="text-sm text-gray-600">
                {features.fileUpload
                  ? "文件将上传到服务器"
                  : "文件将使用高性能保存器保存到本地"
                }
              </div>
            </TabsContent>
            
            <TabsContent value="github" className="space-y-4">
              <div className="text-sm text-gray-600">
                文件将直接上传到您的 GitHub 仓库
              </div>
              
              {/* GitHub 配置 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">GitHub 配置</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGithubConfig(!showGithubConfig)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {showGithubConfig ? '隐藏配置' : '显示配置'}
                  </Button>
                </div>

                {showGithubConfig && (
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div className="col-span-2">
                      <Label htmlFor="github-token">Personal Access Token *</Label>
                      <Input
                        id="github-token"
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxx"
                        value={githubConfig.token}
                        onChange={(e) => setGithubConfig(prev => ({ ...prev, token: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="github-owner">仓库所有者 *</Label>
                      <Input
                        id="github-owner"
                        placeholder="username"
                        value={githubConfig.owner}
                        onChange={(e) => setGithubConfig(prev => ({ ...prev, owner: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="github-repo">仓库名称 *</Label>
                      <Input
                        id="github-repo"
                        placeholder="repository-name"
                        value={githubConfig.repo}
                        onChange={(e) => setGithubConfig(prev => ({ ...prev, repo: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="github-branch">分支</Label>
                      <Select value={githubConfig.branch} onValueChange={(value) => setGithubConfig(prev => ({ ...prev, branch: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="master">master</SelectItem>
                          <SelectItem value="main">main</SelectItem>
                          <SelectItem value="gh-pages">gh-pages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="github-path">上传路径</Label>
                      <Input
                        id="github-path"
                        placeholder="uploads"
                        value={githubConfig.uploadPath}
                        onChange={(e) => setGithubConfig(prev => ({ ...prev, uploadPath: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={saveGithubConfig} variant="outline" size="sm">
                        保存配置
                      </Button>
                    </div>
                  </div>
                )}

                {validationError && (
                  <Alert variant="destructive">
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* 文件选择区域 */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={triggerFileInput}
          >
            <FileImage className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">点击选择图片文件</p>
            <p className="text-sm text-gray-500">支持 JPG, PNG, GIF, WebP 格式</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 已选择的文件列表 */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">已选择 {files.length} 个文件:</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 上传进度 */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">处理进度</span>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            取消
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                处理中...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {features.fileUpload ? '上传' : '保存到本地'} ({files.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}