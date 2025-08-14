'use client'

import { useState, useRef } from 'react'
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Github, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { githubUploader, GitHubUploadResult } from '@/lib/github-uploader'
import { toast } from "@/hooks/use-toast"

interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
  uploadPath: string
}

interface UploadStatus {
  fileName: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

interface GitHubUploadDialogProps {
  images: Array<{
    id: string
    url: string
    title: string
    tags: string[]
  }>
}

export default function GitHubUploadDialog({ images }: GitHubUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<GitHubConfig>({
    token: '',
    owner: '',
    repo: '',
    branch: 'master',
    uploadPath: 'uploads'
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])
  const [validationError, setValidationError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 从 localStorage 加载配置
  const loadConfig = () => {
    try {
      const saved = localStorage.getItem('github-upload-config')
      if (saved) {
        const parsedConfig = JSON.parse(saved)
        setConfig(prev => ({ ...prev, ...parsedConfig }))
      }
    } catch (error) {
      console.error('Failed to load GitHub config:', error)
    }
  }

  // 保存配置到 localStorage
  const saveConfig = () => {
    try {
      // 保存完整配置包括 token
      localStorage.setItem('github-upload-config', JSON.stringify(config))
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

  // 验证配置
  const validateConfig = async (): Promise<boolean> => {
    setValidationError('')
    
    if (!config.token || !config.owner || !config.repo) {
      setValidationError('请填写所有必需的配置项')
      return false
    }

    try {
      // 验证 token
      const isValidToken = await githubUploader.validateToken(config.token)
      if (!isValidToken) {
        setValidationError('GitHub Token 无效，请检查权限')
        return false
      }

      // 验证仓库访问权限
      const repoInfo = await githubUploader.getRepoInfo(config.token, config.owner, config.repo)
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

  // 将图片 URL 转换为文件
  const urlToFile = async (url: string, filename: string): Promise<File> => {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type })
  }

  // 上传单个文件
  const uploadSingleFile = async (file: File, customPath?: string): Promise<GitHubUploadResult> => {
    const fileName = customPath || githubUploader.generateUniqueFileName(file.name, config.uploadPath)
    const base64Content = await githubUploader.imageToBase64(file)
    
    return await githubUploader.uploadFile({
      token: config.token,
      owner: config.owner,
      repo: config.repo,
      branch: config.branch,
      path: fileName,
      content: base64Content,
      message: `Upload image: ${file.name}`,
      isBase64: true
    })
  }

  // 上传选中的图片
  const handleUploadImages = async () => {
    if (!(await validateConfig())) return

    setIsUploading(true)
    setUploadProgress(0)
    
    const statuses: UploadStatus[] = images.map(img => ({
      fileName: `${img.title || img.id}.jpg`,
      status: 'pending'
    }))
    setUploadStatuses(statuses)

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const fileName = `${image.title || image.id}.jpg`
        
        // 更新状态为上传中
        setUploadStatuses(prev => prev.map((status, index) => 
          index === i ? { ...status, status: 'uploading' } : status
        ))

        try {
          // 将图片 URL 转换为文件
          const file = await urlToFile(image.url, fileName)
          
          // 上传文件
          const result = await uploadSingleFile(file)
          
          // 更新状态
          setUploadStatuses(prev => prev.map((status, index) => 
            index === i ? {
              ...status,
              status: result.success ? 'success' : 'error',
              url: result.url,
              error: result.error
            } : status
          ))
        } catch (error) {
          setUploadStatuses(prev => prev.map((status, index) => 
            index === i ? {
              ...status,
              status: 'error',
              error: error instanceof Error ? error.message : '上传失败'
            } : status
          ))
        }

        // 更新进度
        setUploadProgress(((i + 1) / images.length) * 100)
      }
    } finally {
      setIsUploading(false)
    }
  }

  // 上传本地文件
  const handleUploadLocalFiles = async () => {
    if (!(await validateConfig())) return
    
    const files = fileInputRef.current?.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    
    const statuses: UploadStatus[] = Array.from(files).map(file => ({
      fileName: file.name,
      status: 'pending'
    }))
    setUploadStatuses(statuses)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // 更新状态为上传中
        setUploadStatuses(prev => prev.map((status, index) => 
          index === i ? { ...status, status: 'uploading' } : status
        ))

        try {
          const result = await uploadSingleFile(file)
          
          // 更新状态
          setUploadStatuses(prev => prev.map((status, index) => 
            index === i ? {
              ...status,
              status: result.success ? 'success' : 'error',
              url: result.url,
              error: result.error
            } : status
          ))
        } catch (error) {
          setUploadStatuses(prev => prev.map((status, index) => 
            index === i ? {
              ...status,
              status: 'error',
              error: error instanceof Error ? error.message : '上传失败'
            } : status
          ))
        }

        // 更新进度
        setUploadProgress(((i + 1) / files.length) * 100)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'uploading':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={loadConfig} className="gap-2">
          <Github className="h-4 w-4" />
          上传到 GitHub
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            上传到 GitHub 仓库
          </DialogTitle>
          <DialogDescription>
            将图片直接上传到您的 GitHub 仓库中
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 配置区域 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">GitHub 配置</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                {showConfig ? '隐藏配置' : '显示配置'}
              </Button>
            </div>

            {showConfig && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="col-span-2">
                  <Label htmlFor="token">Personal Access Token *</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxx"
                    value={config.token}
                    onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="owner">仓库所有者 *</Label>
                  <Input
                    id="owner"
                    placeholder="username"
                    value={config.owner}
                    onChange={(e) => setConfig(prev => ({ ...prev, owner: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="repo">仓库名称 *</Label>
                  <Input
                    id="repo"
                    placeholder="repository-name"
                    value={config.repo}
                    onChange={(e) => setConfig(prev => ({ ...prev, repo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="branch">分支</Label>
                  <Select value={config.branch} onValueChange={(value) => setConfig(prev => ({ ...prev, branch: value }))}>
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
                  <Label htmlFor="uploadPath">上传路径</Label>
                  <Input
                    id="uploadPath"
                    placeholder="uploads"
                    value={config.uploadPath}
                    onChange={(e) => setConfig(prev => ({ ...prev, uploadPath: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Button onClick={saveConfig} variant="outline" size="sm">
                    保存配置
                  </Button>
                </div>
              </div>
            )}

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* 上传选项 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">上传选项</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleUploadImages}
                disabled={isUploading || images.length === 0}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                上传当前图片 ({images.length})
              </Button>
              
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    // 强制重新渲染以显示上传按钮
                    setValidationError('')
                  }}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Upload className="h-4 w-4" />
                  选择本地文件
                </Button>
              </div>
            </div>

            {fileInputRef.current?.files && fileInputRef.current.files.length > 0 && (
              <Button
                onClick={handleUploadLocalFiles}
                disabled={isUploading}
                className="w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                上传选中的文件 ({fileInputRef.current.files.length})
              </Button>
            )}
          </div>

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

          {/* 上传状态列表 */}
          {uploadStatuses.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">上传状态</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {uploadStatuses.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.status)}
                      <span className="text-sm truncate">{status.fileName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.status === 'success' && status.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(status.url, '_blank')}
                        >
                          查看
                        </Button>
                      )}
                      {status.status === 'error' && status.error && (
                        <span className="text-xs text-red-500 max-w-32 truncate" title={status.error}>
                          {status.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}