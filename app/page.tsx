"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
  Search,
  Grid3X3,
  List,
  Star,
  Plus,
  Eye,
  BarChart3,
  Settings,
  Download,
  Trash2,
  Edit,
  ExternalLink,
  Clock,
  TrendingUp,
  Tag,
  Heart,
  Share2,
  Copy,
  Activity,
  LayoutGrid,
  Rows,
  CalendarIcon,
  Kanban,
  Upload,
  Camera,
  Check,
  X,
  FileImage,
  FolderOpen,
} from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Mock data for bookmarks with enhanced details
const mockBookmarks: any[] = []

const categories = ["All", "Development", "Design", "Productivity", "Learning", "Entertainment"]
const priorities = ["All", "High", "Medium", "Low"]
const statuses = ["All", "Active", "Archived", "Broken"]

const viewModes = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
  { id: "compact", label: "Compact", icon: Rows },
  { id: "kanban", label: "Kanban", icon: Kanban },
  { id: "timeline", label: "Timeline", icon: CalendarIcon },
]

function DetailedBookmarkModal({ bookmark, isOpen, onClose, onUpdateBookmark }: any) {
  if (!bookmark) return null

  const [currentBookmark, setCurrentBookmark] = useState(bookmark)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const multipleFileInputRef = useRef<HTMLInputElement>(null)
  const [additionalImages, setAdditionalImages] = useState<string[]>(bookmark?.additionalImages || [])
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editDescription, setEditDescription] = useState(bookmark?.description || '')
  const [editNotes, setEditNotes] = useState(bookmark?.notes || '')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // 当 bookmark 变化时更新 additionalImages
  useEffect(() => {
    if (bookmark) {
      setCurrentBookmark(bookmark)
      setAdditionalImages(bookmark.additionalImages || [])
      setEditDescription(bookmark.description || '')
      setEditNotes(bookmark.notes || '')
    }
  }, [bookmark])

  const healthColors = {
    excellent: "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200",
    good: "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200",
    fair: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200",
    poor: "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200",
  }

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = document.createElement('img')
      
      img.onload = () => {
        // 计算压缩后的尺寸，保持宽高比
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height)
        
        // 转换为压缩后的 base64
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        // 压缩图片
        const compressedImageUrl = await compressImage(file)
        const fileName = file.name.replace(/\.[^/.]+$/, "")
        
        // 创建Image对象获取原始图片尺寸
        const img = document.createElement('img')
        img.onload = () => {
          const aspectRatio = img.width / img.height
          const updatedBookmark = {
            ...currentBookmark,
            screenshot: compressedImageUrl,
            title: fileName,
            imageWidth: img.width,
            imageHeight: img.height,
            aspectRatio: aspectRatio
          }
          setCurrentBookmark(updatedBookmark)
          onUpdateBookmark(updatedBookmark)
        }
        img.src = URL.createObjectURL(file)
      } catch (error) {
        console.error('图片压缩失败:', error)
        alert('图片上传失败，请尝试选择更小的图片')
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleMultipleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string
          const newAdditionalImages = [...additionalImages, imageUrl]
          setAdditionalImages(newAdditionalImages)
          
          // 立即保存到 bookmark 对象
          const updatedBookmark = {
            ...currentBookmark,
            additionalImages: newAdditionalImages
          }
          setCurrentBookmark(updatedBookmark)
          onUpdateBookmark(updatedBookmark)
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleRemoveAdditionalImage = (index: number) => {
    const newAdditionalImages = additionalImages.filter((_, i) => i !== index)
    setAdditionalImages(newAdditionalImages)
    
    // 立即保存到 bookmark 对象
    const updatedBookmark = {
      ...currentBookmark,
      additionalImages: newAdditionalImages
    }
    setCurrentBookmark(updatedBookmark)
    onUpdateBookmark(updatedBookmark)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={bookmark.favicon || "/placeholder.svg"} alt={bookmark.title} />
              <AvatarFallback>{bookmark.title[0]}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{bookmark.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group">
              <Image
                src={currentBookmark.screenshot || "/placeholder.svg"}
                alt={`${currentBookmark.title} screenshot`}
                width={500}
                height={400}
                className="w-full max-h-80 object-contain rounded-lg border bg-muted"
                style={{
                  aspectRatio: currentBookmark.aspectRatio || 'auto',
                  minHeight: '200px'
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <button
                  onClick={triggerFileInput}
                  className="bg-white text-black px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-100 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Image</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">修改建议</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isEditingDescription) {
                        const updatedBookmark = { ...currentBookmark, description: editDescription }
                        setCurrentBookmark(updatedBookmark)
                        onUpdateBookmark(updatedBookmark)
                      } else {
                        setEditDescription(currentBookmark.description || '')
                      }
                      setIsEditingDescription(!isEditingDescription)
                    }}
                  >
                    {isEditingDescription ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </div>
                {isEditingDescription ? (
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="输入描述..."
                    className="text-muted-foreground"
                  />
                ) : (
                  <p className="text-muted-foreground">{currentBookmark.description}</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">其他</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isEditingNotes) {
                        const updatedBookmark = { ...currentBookmark, notes: editNotes }
                        setCurrentBookmark(updatedBookmark)
                        onUpdateBookmark(updatedBookmark)
                      } else {
                        setEditNotes(currentBookmark.notes || '')
                      }
                      setIsEditingNotes(!isEditingNotes)
                    }}
                  >
                    {isEditingNotes ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </div>
                {isEditingNotes ? (
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="添加备注..."
                    className="text-sm bg-muted"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{currentBookmark.notes}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">参考图片风格</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => multipleFileInputRef.current?.click()}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加更多图片
              </Button>
            </div>
            
            {/* 小红书瀑布流3列布局 */}
            <div className="columns-3 gap-4 space-y-0">
              {/* 附加图片 */}
              {additionalImages.map((image, index) => (
                <div key={index} className="relative group break-inside-avoid mb-4">
                  <Image
                    src={image}
                    alt={`图片 ${index + 1}`}
                    width={300}
                    height={200}
                    className="w-full h-auto object-contain rounded-lg border bg-muted"
                    style={{
                      display: 'block'
                    }}
                    onLoad={(e) => {
                      // 确保图片加载后保持原始宽高比
                      const img = e.target as HTMLImageElement;
                      img.style.height = 'auto';
                    }}
                  />
                  <button
                    onClick={() => handleRemoveAdditionalImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {/* 添加图片占位符 */}
              <div
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors break-inside-avoid mb-4"
                onClick={() => multipleFileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">添加图片</p>
                </div>
              </div>
            </div>
            
            <input
              ref={multipleFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultipleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BulkUploadDialog({ isOpen, onClose, onAddBookmarks }: any) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles)
      setFiles(prevFiles => [...prevFiles, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    // 处理文件上传
    const totalFiles = files.length
    let uploadedCount = 0
    const newBookmarks = []

    for (const file of files) {
      // 将文件转换为base64格式以便持久保存
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      })

      // 模拟上传延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 创建新的书签对象
      const newBookmark = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: file.name.replace(/\.[^/.]+$/, ""),
        url: "",
        description: `Uploaded image: ${file.name}`,
        favicon: "/placeholder.svg?height=32&width=32",
        screenshot: base64Image, // 使用base64格式保存图片
        category: "Uploaded",
        priority: "medium",
        tags: ["upload", "image"],
        lastVisited: new Date().toISOString().split('T')[0],
        visitCount: 0,
        status: "active",
        notes: `File size: ${(file.size / 1024).toFixed(2)} KB`,
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
        fileType: file.type
      }

      newBookmarks.push(newBookmark)
      uploadedCount++
      setUploadProgress((uploadedCount / totalFiles) * 100)
    }

    // 批量添加所有书签
    onAddBookmarks(newBookmarks)

    // 上传完成
    setIsUploading(false)
    setFiles([])
    onClose()
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批量上传图片</DialogTitle>
          <DialogDescription>
            选择多个图片文件进行批量上传
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={triggerFileInput}
          >
            <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">拖拽文件到这里</p>
            <p className="text-sm text-gray-500 mb-4">或点击选择文件</p>
            <Button variant="secondary">
              <FileImage className="h-4 w-4 mr-2" />
              选择文件
            </Button>
            <p className="text-xs text-gray-500 mt-2">支持 JPG, PNG, GIF 格式</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">已选择 {files.length} 个文件</h3>
                <Button variant="outline" size="sm" onClick={triggerFileInput}>
                  添加更多
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <FileImage className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-center">
                    正在上传... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={onClose}>
                  取消
                </Button>
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      开始上传
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddBookmarkDialog({ isOpen, onClose, onAddBookmark }: any) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'Development',
    priority: 'medium',
    tags: '',
    notes: '',
    screenshot: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newBookmark = {
      id: Date.now(),
      title: formData.title,
      url: formData.url,
      description: formData.description,
      favicon: "/placeholder.svg?height=32&width=32",
      screenshot: formData.screenshot,
      category: formData.category,
      priority: formData.priority,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      lastVisited: new Date().toISOString().split('T')[0],
      visitCount: 0,
      status: "active",
      notes: formData.notes,
      dateAdded: new Date().toISOString().split('T')[0],
      isFavorite: false,
      timeSpent: "0m",
      weeklyVisits: [0, 0, 0, 0, 0, 0, 0],
      relatedSites: [],
      lastUpdate: new Date().toISOString(),
      siteHealth: "good",
      loadTime: "1.0s",
      mobileOptimized: true,
    }

    onAddBookmark(newBookmark)
    
    // Reset form
    setFormData({
      title: '',
      url: '',
      description: '',
      category: 'Development',
      priority: 'medium',
      tags: '',
      notes: '',
      screenshot: ''
    })
    
    onClose()
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 使用文件名作为标题，去掉扩展名
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setFormData(prev => ({
          ...prev,
          screenshot: imageUrl,
          title: fileName
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加新图片</DialogTitle>
          <DialogDescription>
            填写图片信息来添加到您的收藏中
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="输入图片标题"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="简短描述这张图片"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="添加一些备注信息"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>图片</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {formData.screenshot ? (
                <div className="relative">
                  <Image
                    src={formData.screenshot}
                    alt="Preview"
                    width={200}
                    height={150}
                    className="w-full max-h-48 object-contain rounded-md"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={triggerFileInput}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    更换图片
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={triggerFileInput}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    上传图片
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">支持 JPG, PNG, GIF 格式</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              添加图片
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BookmarkCard({ bookmark, viewMode, isSelected, onSelect, onEdit, onDelete, onViewDetails }: any) {
  const priorityColors = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  }

  if (viewMode === "list") {
    return (
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Checkbox checked={isSelected} onCheckedChange={onSelect} />
            <Avatar className="h-8 w-8">
              <AvatarImage src={bookmark.favicon || "/placeholder.svg"} alt={bookmark.title} />
              <AvatarFallback>{bookmark.title[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3
                  className="font-medium truncate cursor-pointer hover:text-primary"
                  onClick={() => onViewDetails(bookmark)}
                >
                  {bookmark.title}
                </h3>
                {bookmark.isFavorite && <Heart className="h-4 w-4 fill-red-500 text-red-500" />}
                <Badge variant="secondary" className={priorityColors[bookmark.priority as keyof typeof priorityColors]}>
                  {bookmark.priority}
                </Badge>
                <Badge variant="outline">{bookmark.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{bookmark.description}</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{bookmark.lastVisited}</span>
              <span>•</span>
              <span>{bookmark.visitCount} visits</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={() => onViewDetails(bookmark)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.open(bookmark.url, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(bookmark)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(bookmark.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "compact") {
    return (
      <Card className="group hover:shadow-md transition-all duration-200">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <Checkbox checked={isSelected} onCheckedChange={onSelect} />
            <Avatar className="h-6 w-6">
              <AvatarImage src={bookmark.favicon || "/placeholder.svg"} alt={bookmark.title} />
              <AvatarFallback className="text-xs">{bookmark.title[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3
                className="font-medium text-sm truncate cursor-pointer hover:text-primary"
                onClick={() => onViewDetails(bookmark)}
              >
                {bookmark.title}
              </h3>
              <div className="flex items-center space-x-1 mt-1">
                {bookmark.isFavorite && <Heart className="h-3 w-3 fill-red-500 text-red-500" />}
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {bookmark.category}
                </Badge>
                <span className="text-xs text-muted-foreground">{bookmark.visitCount} visits</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={() => onViewDetails(bookmark)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.open(bookmark.url, "_blank")}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "kanban") {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Checkbox checked={isSelected} onCheckedChange={onSelect} />
              <Avatar className="h-6 w-6">
                <AvatarImage src={bookmark.favicon || "/placeholder.svg"} alt={bookmark.title} />
                <AvatarFallback className="text-xs">{bookmark.title[0]}</AvatarFallback>
              </Avatar>
            </div>
            {bookmark.isFavorite && <Heart className="h-4 w-4 fill-red-500 text-red-500" />}
          </div>
          <h3 className="font-medium mb-2 cursor-pointer hover:text-primary" onClick={() => onViewDetails(bookmark)}>
            {bookmark.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{bookmark.description}</p>
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={() => onViewDetails(bookmark)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.open(bookmark.url, "_blank")}>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "timeline") {
    return (
      <div className="flex items-start space-x-4 mb-6">
        <div className="flex flex-col items-center">
          <div className="h-3 w-3 bg-primary rounded-full"></div>
          <div className="w-px h-16 bg-border mt-2"></div>
        </div>
        <Card className="flex-1 group hover:shadow-lg transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Checkbox checked={isSelected} onCheckedChange={onSelect} />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={bookmark.favicon || "/placeholder.svg"} alt={bookmark.title} />
                  <AvatarFallback>{bookmark.title[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium cursor-pointer hover:text-primary" onClick={() => onViewDetails(bookmark)}>
                    {bookmark.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{bookmark.lastVisited}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {bookmark.isFavorite && <Heart className="h-4 w-4 fill-red-500 text-red-500" />}
                <Badge variant="outline" className={priorityColors[bookmark.priority as keyof typeof priorityColors]}>
                  {bookmark.priority}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{bookmark.description}</p>
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(bookmark)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.open(bookmark.url, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default grid view with dynamic height based on aspect ratio
  const aspectRatio = bookmark.aspectRatio || 1
  const cardWidth = 240
  const maxImageHeight = 320
  const minImageHeight = 120
  
  // Calculate image height based on aspect ratio, with constraints
  let imageHeight = cardWidth / aspectRatio
  imageHeight = Math.max(minImageHeight, Math.min(maxImageHeight, imageHeight))
  
  return (
    <div className="group relative break-inside-avoid mb-4">
      {/* 图片容器 */}
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {bookmark.screenshot && bookmark.screenshot !== "/placeholder.svg" ? (
          <Image
            src={bookmark.screenshot}
            alt={`${bookmark.title} screenshot`}
            width={cardWidth}
            height={0}
            className="w-full h-auto object-contain cursor-pointer transition-transform duration-200 group-hover:scale-105"
            style={{
              aspectRatio: bookmark.aspectRatio || 'auto'
            }}
            onClick={() => onViewDetails(bookmark)}
          />
        ) : (
          <div
            className="w-full bg-gray-100 flex items-center justify-center cursor-pointer aspect-square"
            onClick={() => onViewDetails(bookmark)}
          >
            <span className="text-gray-400 text-sm">无图片</span>
          </div>
        )}
        
        {/* 删除按钮 - 右上角 */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="destructive"
            size="sm"
            className="h-7 w-7 p-0 rounded-full shadow-lg"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(bookmark.id)
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* 选择框 - 左上角 */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="bg-white/90 border-2 rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* 标题 - 图片下方 */}
      <div className="mt-2 px-1">
        <h3
          className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
          onClick={() => onViewDetails(bookmark)}
        >
          {bookmark.title}
        </h3>
      </div>
    </div>
  )
}

function AppSidebar({ bookmarks }: { bookmarks: any[] }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Star className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">ImageHub</h2>
            <p className="text-xs text-muted-foreground">Your digital workspace</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Grid3X3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Star className="h-4 w-4" />
                  <span>Favorites</span>
                  <Badge variant="secondary" className="ml-auto">
                    {bookmarks.filter((b) => b.isFavorite).length}
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.slice(1).map((category) => (
                <SidebarMenuItem key={category}>
                  <SidebarMenuButton>
                    <span>{category}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {bookmarks.filter((b) => b.category === category).length}
                    </Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2 space-y-2">
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Total Images</span>
              <span>{bookmarks.length}</span>
            </div>
            <div className="flex justify-between">
              <span>This Month</span>
              <span>+12</span>
            </div>
            <div className="flex justify-between">
              <span>Favorites</span>
              <span>{bookmarks.filter((b) => b.isFavorite).length}</span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedPriority, setSelectedPriority] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [sortBy, setSortBy] = useState("lastVisited")
  const [viewMode, setViewMode] = useState("grid")
  const [selectedBookmarks, setSelectedBookmarks] = useState<number[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [bookmarkToDelete, setBookmarkToDelete] = useState<number | null>(null)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)

  // 从localStorage加载图片数据
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bookmarks')
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks))
      } catch (error) {
        console.error('Failed to parse saved bookmarks:', error)
        setBookmarks(mockBookmarks)
      }
    } else {
      setBookmarks(mockBookmarks)
    }
  }, [])

  // 保存图片数据到localStorage
  useEffect(() => {
    if (bookmarks.length > 0) {
      try {
        const bookmarksData = JSON.stringify(bookmarks)
        // 检查数据大小（大约5MB限制）
        if (bookmarksData.length > 5 * 1024 * 1024) {
          console.warn('数据过大，可能超出localStorage限制')
          alert('存储空间不足，请删除一些图片或清理浏览器缓存')
          return
        }
        localStorage.setItem('bookmarks', bookmarksData)
      } catch (error) {
        console.error('保存到localStorage失败:', error)
        if (error instanceof DOMException && error.code === 22) {
          alert('存储空间已满，请删除一些图片或清理浏览器缓存')
        } else {
          alert('保存失败，请重试')
        }
      }
    }
  }, [bookmarks])

  const filteredBookmarks = useMemo(() => {
    return bookmarks
      .filter((bookmark) => {
        const matchesSearch =
          bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          bookmark.notes.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory = selectedCategory === "All" || bookmark.category === selectedCategory
        const matchesPriority = selectedPriority === "All" || bookmark.priority === selectedPriority.toLowerCase()
        const matchesStatus = selectedStatus === "All" || bookmark.status === selectedStatus.toLowerCase()

        return matchesSearch && matchesCategory && matchesPriority && matchesStatus
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "title":
            return a.title.localeCompare(b.title)
          case "visitCount":
            return b.visitCount - a.visitCount
          case "dateAdded":
            return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
          case "lastVisited":
          default:
            return new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime()
        }
      })
  }, [bookmarks, searchQuery, selectedCategory, selectedPriority, selectedStatus, sortBy])

  const handleSelectBookmark = (bookmarkId: number, checked: boolean) => {
    if (checked) {
      setSelectedBookmarks([...selectedBookmarks, bookmarkId])
    } else {
      setSelectedBookmarks(selectedBookmarks.filter((id) => id !== bookmarkId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookmarks(filteredBookmarks.map((b) => b.id))
    } else {
      setSelectedBookmarks([])
    }
  }

  const handleBulkDelete = () => {
    if (selectedBookmarks.length > 0) {
      setBulkDeleteConfirmOpen(true)
    }
  }

  const confirmBulkDelete = () => {
    setBookmarks(prev => prev.filter(bookmark => !selectedBookmarks.includes(bookmark.id)))
    setSelectedBookmarks([])
    setBulkDeleteConfirmOpen(false)
  }

  const handleEdit = (bookmark: any) => {
    console.log("Edit bookmark:", bookmark)
  }

  const handleDelete = (bookmarkId: number) => {
    setBookmarkToDelete(bookmarkId)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (bookmarkToDelete) {
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkToDelete))
      setBookmarkToDelete(null)
    }
    setDeleteConfirmOpen(false)
  }

  const handleAddBookmark = (newBookmark: any) => {
    setBookmarks(prev => [...prev, newBookmark])
  }

  const handleBulkAddBookmarks = (newBookmarks: any[]) => {
    setBookmarks(prev => [...prev, ...newBookmarks])
  }

  const handleViewDetails = (bookmark: any) => {
    setSelectedBookmark(bookmark)
    setIsDetailModalOpen(true)
  }

  const handleUpdateBookmark = (updatedBookmark: any) => {
    setBookmarks(prevBookmarks =>
      prevBookmarks.map(bookmark =>
        bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark
      )
    )
  }

  const renderBookmarks = () => {
    if (viewMode === "kanban") {
      const categorizedBookmarks = categories.slice(1).reduce(
        (acc, category) => {
          acc[category] = filteredBookmarks.filter((b) => b.category === category)
          return acc
        },
        {} as Record<string, any[]>,
      )

      return (
        <div className="grid grid-cols-6 gap-6">
          {Object.entries(categorizedBookmarks).map(([category, bookmarks]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{category}</h3>
                <Badge variant="secondary">{bookmarks.length}</Badge>
              </div>
              <div className="space-y-3">
                {bookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    viewMode={viewMode}
                    isSelected={selectedBookmarks.includes(bookmark.id)}
                    onSelect={(checked: boolean) => handleSelectBookmark(bookmark.id, checked)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (viewMode === "timeline") {
      return (
        <div className="max-w-3xl mx-auto">
          {filteredBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              viewMode={viewMode}
              isSelected={selectedBookmarks.includes(bookmark.id)}
              onSelect={(checked: boolean) => handleSelectBookmark(bookmark.id, checked)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )
    }

    const gridClasses = {
      grid: "columns-1 md:columns-3 lg:columns-4 xl:columns-6 gap-6 space-y-0",
      list: "space-y-2",
      compact: "columns-1 md:columns-3 lg:columns-4 xl:columns-6 gap-3 space-y-0",
    }

    return (
      <div className={gridClasses[viewMode as keyof typeof gridClasses] || gridClasses.grid}>
        {filteredBookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            viewMode={viewMode}
            isSelected={selectedBookmarks.includes(bookmark.id)}
            onSelect={(checked: boolean) => handleSelectBookmark(bookmark.id, checked)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full p-6">
      {/* Add Bookmark Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">我的图片</h1>
          {selectedBookmarks.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedBookmarks.length} 项
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                批量删除
              </Button>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加图片
          </Button>
          <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            批量上传
          </Button>
        </div>
      </div>

      {/* Bookmarks Display */}
      {renderBookmarks()}

      {filteredBookmarks.length === 0 && (
        <div className="text-center py-12">
          <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No images found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search criteria or add a new image.</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Image
          </Button>
        </div>
      )}

      {/* Add Image Dialog */}
      <AddBookmarkDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddBookmark={handleAddBookmark}
      />

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onAddBookmarks={handleBulkAddBookmarks}
      />

      {/* Detailed Image Modal */}
      <DetailedBookmarkModal
        bookmark={selectedBookmark}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedBookmark(null)
        }}
        onUpdateBookmark={handleUpdateBookmark}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个图片吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除选中的 {selectedBookmarks.length} 个图片吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteConfirmOpen(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除全部
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
