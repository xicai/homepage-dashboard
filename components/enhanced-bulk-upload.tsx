"use client"

import { useState, useRef } from "react"
import { features } from "@/lib/config"
import { saveFile, saveMultipleFiles, saveImage, checkBrowserSupport } from "@/lib/file-saver"
import { Upload, X, FileImage, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface EnhancedBulkUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddBookmarks: (bookmarks: any[]) => void
}

export function EnhancedBulkUploadDialog({ isOpen, onClose, onAddBookmarks }: EnhancedBulkUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    setIsUploading(true)
    setUploadProgress(0)

    try {
      if (features.fileUpload) {
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
            {features.fileUpload 
              ? "选择多个图片文件进行批量上传" 
              : "选择图片文件，将使用高性能保存器保存到本地"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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