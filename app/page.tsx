"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { features } from "@/lib/config"
import SimpleBulkUploadDialog from "@/components/simple-bulk-upload"
import { ConfigGenerator } from "@/components/config-generator"
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
} from "lucide-react"
import Image from "next/image"

// 将 GitHub blob 链接转换为 raw 链接
function convertGitHubBlobToRaw(url: string): string {
  if (url && url.includes('github.com') && url.includes('/blob/')) {
    return url.replace('/blob/', '/raw/')
  }
  return url
}

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
const mockBookmarks: any[] = [
  {
    id: 1,
    title: "示例图片 1",
    url: "",
    description: "这是一个示例图片，展示应用的基本功能",
    favicon: "./placeholder.svg",
    screenshot: "./uploads/example.jpg",
    category: "示例",
    priority: "medium",
    tags: ["示例", "图片", "演示"],
    lastVisited: new Date().toISOString().split('T')[0],
    visitCount: 5,
    status: "active",
    notes: "这是一个预设的示例图片，用于展示应用功能。您可以上传自己的图片来替换它。",
    dateAdded: new Date().toISOString().split('T')[0],
    isFavorite: true,
    timeSpent: "2m",
    weeklyVisits: [1, 2, 0, 1, 1, 0, 0],
    relatedSites: [],
    lastUpdate: new Date().toISOString(),
    siteHealth: "good",
    loadTime: "0.8s",
    mobileOptimized: true,
    additionalImages: []
  },
  {
    id: 2,
    title: "占位图片",
    url: "",
    description: "占位图片，用于测试布局效果",
    favicon: "./placeholder.svg",
    screenshot: "./placeholder.jpg",
    category: "测试",
    priority: "low",
    tags: ["占位", "测试", "布局"],
    lastVisited: new Date().toISOString().split('T')[0],
    visitCount: 2,
    status: "active",
    notes: "这是一个占位图片，用于测试应用的布局和显示效果。",
    dateAdded: new Date().toISOString().split('T')[0],
    isFavorite: false,
    timeSpent: "1m",
    weeklyVisits: [0, 1, 0, 0, 1, 0, 0],
    relatedSites: [],
    lastUpdate: new Date().toISOString(),
    siteHealth: "good",
    loadTime: "0.5s",
    mobileOptimized: true,
    additionalImages: []
  }
]

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

  const handleMultipleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      console.log('📤 参考图片风格上传：开始处理文件...')
      const filesArray = Array.from(files)
      const newImageUrls: string[] = []
      
      // 检查是否为静态导出模式
      if (!features.fileUpload) {
        console.log('📤 静态模式：尝试保存参考图片到文件系统...')
        
        // 检查是否支持 File System Access API
        if ('showDirectoryPicker' in window) {
          try {
            console.log('📁 弹出文件夹选择对话框（参考图片）...')
            // 让用户选择 uploads 文件夹
            const dirHandle = await (window as any).showDirectoryPicker({
              mode: 'readwrite',
              startIn: 'downloads'
            })
            console.log('✅ 用户选择了文件夹（参考图片）:', dirHandle.name)
            
            for (let i = 0; i < filesArray.length; i++) {
              const file = filesArray[i]
              const timestamp = Date.now() + i
              const fileExtension = file.name.split('.').pop()
              const newFileName = `reference_${timestamp}.${fileExtension}`
              
              // 直接保存到选择的文件夹
              const fileHandle = await dirHandle.getFileHandle(newFileName, { create: true })
              const writable = await fileHandle.createWritable()
              await writable.write(file)
              await writable.close()
              
              console.log(`✅ 参考图片已保存: ${newFileName}`)
              
              // 使用相对路径引用保存的文件
              const imageUrl = `./uploads/${newFileName}`
              newImageUrls.push(imageUrl)
            }
            
            // 更新状态
            const updatedAdditionalImages = [...additionalImages, ...newImageUrls]
            setAdditionalImages(updatedAdditionalImages)
            
            // 立即保存到 bookmark 对象
            const updatedBookmark = {
              ...currentBookmark,
              additionalImages: updatedAdditionalImages
            }
            setCurrentBookmark(updatedBookmark)
            onUpdateBookmark(updatedBookmark)
            
            alert(`成功保存 ${filesArray.length} 个参考图片到选择的文件夹！\n刷新页面即可看到图片。`)
            
          } catch (error) {
            console.log('❌ 用户取消了文件夹选择或发生错误（参考图片）:', error)
            console.log('🔄 回退到内存模式（参考图片）')
            // 回退到原来的内存模式
            fallbackToMemoryMode()
          }
        } else {
          console.log('❌ 浏览器不支持 File System Access API，使用内存模式（参考图片）')
          // 不支持 File System Access API，使用内存模式
          fallbackToMemoryMode()
        }
      } else {
        // 服务器模式，使用内存模式
        fallbackToMemoryMode()
      }
      
      function fallbackToMemoryMode() {
        console.log('📥 使用内存模式处理参考图片...')
        filesArray.forEach(file => {
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
  }

  const handleRemoveAdditionalImage = async (index: number) => {
    try {
      // 获取要删除的图片路径
      const imageToDelete = additionalImages[index]
      
      // 如果是服务器上的文件且启用了文件删除功能，调用删除API
      if (features.fileDelete && imageToDelete && imageToDelete.startsWith('/uploads/')) {
        console.log('🗑️ 准备删除附加图片:', imageToDelete)
        const response = await fetch('/api/delete-files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePaths: [imageToDelete] }),
        })

        const result = await response.json()
        if (result.success) {
          console.log('✅ 附加图片删除成功:', result.message)
        } else {
          console.error('❌ 附加图片删除失败:', result.error)
        }
      }

      // 从前端状态中移除图片
      const newAdditionalImages = additionalImages.filter((_, i) => i !== index)
      setAdditionalImages(newAdditionalImages)
      
      // 立即保存到 bookmark 对象
      const updatedBookmark = {
        ...currentBookmark,
        additionalImages: newAdditionalImages
      }
      setCurrentBookmark(updatedBookmark)
      onUpdateBookmark(updatedBookmark)
      
    } catch (error) {
      console.error('❌ 删除附加图片失败:', error)
      alert('删除图片失败，请重试')
    }
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
                src={convertGitHubBlobToRaw(currentBookmark.screenshot || "/placeholder.svg")}
                alt={`${currentBookmark.title} screenshot`}
                width={500}
                height={400}
                className="w-full max-h-80 object-contain rounded-lg border bg-muted"
                style={{
                  aspectRatio: currentBookmark.aspectRatio || 'auto',
                  minHeight: '200px'
                }}
              />
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
            src={convertGitHubBlobToRaw(bookmark.screenshot)}
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
  const [configImported, setConfigImported] = useState(false) // 新增状态跟踪配置导入
  const [isLoadingData, setIsLoadingData] = useState(false) // 数据加载状态

  // 检查URL hash中的配置并处理
  useEffect(() => {
    const handleUrlConfig = async () => {
      // 检查hash参数
      const hash = window.location.hash
      let configParam = null
      
      if (hash) {
        // 支持两种格式：#config=xxx 或 #xxx（直接是配置字符串）
        if (hash.startsWith('#config=')) {
          configParam = hash.substring(8) // 去掉 '#config='
        } else if (hash.length > 1) {
          configParam = hash.substring(1) // 去掉 '#'
        }
      }
      
      // 如果hash没有配置，也检查查询参数（向后兼容）
      if (!configParam) {
        const urlParams = new URLSearchParams(window.location.search)
        configParam = urlParams.get('config')
      }
      
      if (configParam) {
        console.log('🔗 检测到URL配置参数')
        try {
          // 动态导入配置验证函数
          const { validateEncryptedConfig } = await import('@/lib/config-crypto')
          if (validateEncryptedConfig(configParam)) {
            localStorage.setItem('github-encrypted-config', configParam)
            console.log('✅ GitHub配置已从URL保存到localStorage')
            
            // 清除URL参数和hash，避免配置泄露
            const newUrl = window.location.pathname
            window.history.replaceState({}, document.title, newUrl)
            
            // 触发数据重新加载
            setConfigImported(true)
            setIsLoadingData(true) // 开始加载状态
            
            // 不显示alert，改为状态指示器
          } else {
            console.error('❌ URL配置参数无效')
            alert('URL中的配置参数无效，请检查配置字符串。')
          }
        } catch (error) {
          console.error('❌ 处理URL配置失败:', error)
        }
      }
    }

    handleUrlConfig()
  }, [])

  // 从配置文件和localStorage加载书签数据
  useEffect(() => {
    const loadBookmarks = async () => {
      console.log('🔄 开始加载书签数据...')
      
      try {
        // 首先尝试从GitHub配置文件加载数据（跨浏览器共享）
        await loadFromGitHub()
        
        // 如果是通过URL配置导入触发的加载，显示成功消息
        if (configImported) {
          console.log('✅ 配置导入完成，GitHub数据加载成功')
          setIsLoadingData(false) // 停止加载状态
          // 延迟显示成功消息，让用户看到数据加载完成
          setTimeout(() => {
            alert('✅ 配置已成功导入并加载了GitHub上的图片数据！')
          }, 500)
          setConfigImported(false) // 重置状态
        }
        
      } catch (error) {
        console.log('⚠️ 无法从GitHub加载，尝试本地配置文件...')
        
        // 如果是配置导入触发的，但GitHub加载失败，显示警告
        if (configImported) {
          console.error('❌ GitHub数据加载失败:', error)
          setIsLoadingData(false) // 停止加载状态
          setTimeout(() => {
            alert('⚠️ 配置已成功导入！但加载GitHub数据时出现问题，请检查网络连接或GitHub仓库设置。')
          }, 500)
          setConfigImported(false) // 重置状态
        }
        
        try {
          // 尝试从本地配置文件加载
          const response = await fetch('./data/bookmarks.json')
          if (response.ok) {
            const configData = await response.json()
            const jsonData = configData.bookmarks || configData // 兼容旧格式
            console.log('✅ 成功从本地配置文件加载数据，书签数量:', jsonData.length)
            
            // 检查localStorage是否有更新的数据
            const savedBookmarks = localStorage.getItem('bookmarks')
            if (savedBookmarks) {
              try {
                const localData = JSON.parse(savedBookmarks)
                const localTimestamp = localStorage.getItem('bookmarks_timestamp') || '0'
                const jsonTimestamp = localStorage.getItem('json_timestamp') || '0'
                
                // 如果localStorage数据更新，使用localStorage数据
                if (localData.length > jsonData.length || localTimestamp > jsonTimestamp) {
                  console.log('📱 使用localStorage数据（更新）')
                  setBookmarks(localData)
                } else {
                  console.log('📄 使用本地配置文件数据（最新）')
                  setBookmarks(jsonData)
                  // 同步到localStorage
                  localStorage.setItem('bookmarks', JSON.stringify(jsonData))
                  localStorage.setItem('json_timestamp', Date.now().toString())
                }
              } catch (error) {
                console.error('❌ 解析localStorage数据失败:', error)
                setBookmarks(jsonData)
              }
            } else {
              console.log('📄 首次加载，使用本地配置文件数据')
              setBookmarks(jsonData)
              localStorage.setItem('bookmarks', JSON.stringify(jsonData))
              localStorage.setItem('json_timestamp', Date.now().toString())
            }
          } else {
            throw new Error('无法加载本地配置文件')
          }
        } catch (error) {
          console.log('⚠️ 无法从配置文件加载，尝试localStorage...')
          
          // 回退到localStorage
          const savedBookmarks = localStorage.getItem('bookmarks')
          if (savedBookmarks) {
            try {
              const parsed = JSON.parse(savedBookmarks)
              console.log('✅ 成功加载localStorage数据，书签数量:', parsed.length)
              setBookmarks(parsed)
            } catch (error) {
              console.error('❌ 解析localStorage数据失败:', error)
              setBookmarks(mockBookmarks)
            }
          } else {
            console.log('⚠️ 没有任何保存的数据，使用默认数据')
            setBookmarks(mockBookmarks)
          }
        }
      }
    }
    
    loadBookmarks()
  }, [configImported]) // 添加 configImported 作为依赖

  // 从GitHub加载配置的函数
  const loadFromGitHub = async () => {
    const encryptedConfig = localStorage.getItem('github-encrypted-config')
    if (!encryptedConfig) {
      throw new Error('未配置GitHub')
    }

    console.log('🌐 尝试从GitHub配置文件加载数据...')
    
    // 动态导入所需模块
    const { decryptGitHubConfig } = await import('@/lib/config-crypto')
    const config = decryptGitHubConfig(encryptedConfig)
    if (!config) {
      throw new Error('无法解析GitHub配置')
    }

    // 从GitHub获取配置文件
    const githubUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/data/bookmarks.json`
    const response = await fetch(githubUrl)
    
    if (response.ok) {
      const configData = await response.json()
      const githubData = configData.bookmarks || configData // 兼容旧格式
      console.log('✅ 成功从GitHub配置文件加载数据，书签数量:', githubData.length)
      
      // 检查localStorage是否有更新的数据
      const savedBookmarks = localStorage.getItem('bookmarks')
      if (savedBookmarks) {
        try {
          const localData = JSON.parse(savedBookmarks)
          const localTimestamp = localStorage.getItem('bookmarks_timestamp') || '0'
          const githubTimestamp = new Date(configData.lastUpdated || 0).getTime().toString()
          
          // 如果localStorage数据更新，使用localStorage数据
          if (localData.length > githubData.length || localTimestamp > githubTimestamp) {
            console.log('📱 使用localStorage数据（更新）')
            setBookmarks(localData)
          } else {
            console.log('🌐 使用GitHub配置文件数据（最新）')
            setBookmarks(githubData)
            // 同步到localStorage
            localStorage.setItem('bookmarks', JSON.stringify(githubData))
            localStorage.setItem('github_timestamp', githubTimestamp)
          }
        } catch (error) {
          console.error('❌ 解析localStorage数据失败:', error)
          setBookmarks(githubData)
        }
      } else {
        console.log('🌐 首次加载，使用GitHub配置文件数据')
        setBookmarks(githubData)
        localStorage.setItem('bookmarks', JSON.stringify(githubData))
        localStorage.setItem('github_timestamp', new Date(configData.lastUpdated || 0).getTime().toString())
      }
    } else {
      throw new Error('无法从GitHub加载配置文件')
    }
  }

  // 保存书签数据到localStorage和JSON文件
  useEffect(() => {
    console.log('💾 保存书签数据，数量:', bookmarks.length)
    if (bookmarks.length > 0) {
      try {
        // 保存到localStorage
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks))
        localStorage.setItem('bookmarks_timestamp', Date.now().toString())
        console.log('✅ 书签数据已保存到localStorage')
        
        // 保存到JSON文件（异步，不阻塞UI）
        saveToJsonFile(bookmarks)
      } catch (error) {
        console.error('❌ 保存数据失败:', error)
        alert('保存失败，请重试')
      }
    }
  }, [bookmarks])

  // 保存数据到配置文件的函数（支持GitHub同步）
  const saveToJsonFile = async (bookmarksData: any[]) => {
    try {
      console.log('📄 开始保存书签配置...')
      
      // 检查是否为静态模式
      if (features.fileUpload) {
        // 服务器模式：使用API保存
        const response = await fetch('/api/save-bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookmarksData),
        })

        const result = await response.json()
        if (result.success) {
          console.log('✅ 成功保存到服务器配置文件:', result.message)
        } else {
          console.error('❌ 保存到服务器配置文件失败:', result.error)
        }
      } else {
        // 静态模式：尝试同步到GitHub
        await saveToGitHub(bookmarksData)
      }
    } catch (error) {
      console.error('❌ 保存配置文件时发生错误:', error)
    }
  }

  // 保存到GitHub的函数
  const saveToGitHub = async (bookmarksData: any[]) => {
    try {
      const encryptedConfig = localStorage.getItem('github-encrypted-config')
      if (!encryptedConfig) {
        console.log('⚠️ 未配置GitHub，跳过同步')
        return
      }

      console.log('🌐 开始同步到GitHub...')
      
      // 动态导入所需模块
      const [{ decryptGitHubConfig }, { githubUploader }] = await Promise.all([
        import('@/lib/config-crypto'),
        import('@/lib/github-uploader')
      ])

      const config = decryptGitHubConfig(encryptedConfig)
      if (!config) {
        console.error('❌ 无法解析GitHub配置')
        return
      }

      // 创建配置数据结构
      const configData = {
        bookmarks: bookmarksData,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }

      // 上传到GitHub
      const result = await githubUploader.uploadFile({
        token: config.token,
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        path: 'data/bookmarks.json',
        content: JSON.stringify(configData, null, 2),
        message: `更新书签配置 - ${new Date().toLocaleString()}`,
        isBase64: false
      })

      if (result.success) {
        console.log('✅ 成功同步到GitHub配置文件')
        localStorage.setItem('last_github_sync', Date.now().toString())
      } else {
        console.error('❌ GitHub同步失败:', result.error)
      }
    } catch (error) {
      console.error('❌ GitHub同步时发生错误:', error)
    }
  }

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

  // 全选/取消全选功能
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookmarks(filteredBookmarks.map(bookmark => bookmark.id))
    } else {
      setSelectedBookmarks([])
    }
  }

  // 检查是否全选状态
  const isAllSelected = filteredBookmarks.length > 0 && selectedBookmarks.length === filteredBookmarks.length
  const isPartialSelected = selectedBookmarks.length > 0 && selectedBookmarks.length < filteredBookmarks.length

  const handleBulkDelete = () => {
    if (selectedBookmarks.length > 0) {
      setBulkDeleteConfirmOpen(true)
    }
  }

  const confirmBulkDelete = async () => {
    try {
      // 获取要删除的书签
      const bookmarksToDelete = bookmarks.filter(bookmark => selectedBookmarks.includes(bookmark.id))
      
      // 如果启用了文件删除功能，收集需要删除的文件路径
      if (features.fileDelete) {
        const filePaths: string[] = []
        bookmarksToDelete.forEach(bookmark => {
          // 主截图
          if (bookmark.screenshot && bookmark.screenshot.startsWith('/uploads/')) {
            filePaths.push(bookmark.screenshot)
          }
          // 附加图片
          if (bookmark.additionalImages && Array.isArray(bookmark.additionalImages)) {
            bookmark.additionalImages.forEach((imagePath: string) => {
              if (imagePath.startsWith('/uploads/')) {
                filePaths.push(imagePath)
              }
            })
          }
        })

        // 如果有文件需要删除，调用删除API
        if (filePaths.length > 0) {
          console.log('🗑️ 准备删除文件:', filePaths)
          const response = await fetch('/api/delete-files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filePaths }),
          })

          const result = await response.json()
          if (result.success) {
            console.log('✅ 文件删除成功:', result.message)
          } else {
            console.error('❌ 文件删除失败:', result.error)
          }
        }
      }

      // 从前端状态中移除书签
      setBookmarks(prev => prev.filter(bookmark => !selectedBookmarks.includes(bookmark.id)))
      setSelectedBookmarks([])
      setBulkDeleteConfirmOpen(false)
      
      // 更新localStorage
      const updatedBookmarks = bookmarks.filter(bookmark => !selectedBookmarks.includes(bookmark.id))
      localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks))
      
    } catch (error) {
      console.error('❌ 批量删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleEdit = (bookmark: any) => {
    console.log("Edit bookmark:", bookmark)
  }

  const handleDelete = (bookmarkId: number) => {
    setBookmarkToDelete(bookmarkId)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (bookmarkToDelete) {
      try {
        // 获取要删除的书签
        const bookmarkToDeleteObj = bookmarks.find(bookmark => bookmark.id === bookmarkToDelete)
        
        if (bookmarkToDeleteObj && features.fileDelete) {
          // 收集需要删除的文件路径
          const filePaths: string[] = []
          
          // 主截图
          if (bookmarkToDeleteObj.screenshot && bookmarkToDeleteObj.screenshot.startsWith('/uploads/')) {
            filePaths.push(bookmarkToDeleteObj.screenshot)
          }
          
          // 附加图片
          if (bookmarkToDeleteObj.additionalImages && Array.isArray(bookmarkToDeleteObj.additionalImages)) {
            bookmarkToDeleteObj.additionalImages.forEach((imagePath: string) => {
              if (imagePath.startsWith('/uploads/')) {
                filePaths.push(imagePath)
              }
            })
          }

          // 如果有文件需要删除，调用删除API
          if (filePaths.length > 0) {
            console.log('🗑️ 准备删除文件:', filePaths)
            const response = await fetch('/api/delete-files', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ filePaths }),
            })

            const result = await response.json()
            if (result.success) {
              console.log('✅ 文件删除成功:', result.message)
            } else {
              console.error('❌ 文件删除失败:', result.error)
            }
          }
        }

        // 从前端状态中移除书签
        setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkToDelete))
        
        // 更新localStorage
        const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkToDelete)
        localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks))
        
        setBookmarkToDelete(null)
      } catch (error) {
        console.error('❌ 删除失败:', error)
        alert('删除失败，请重试')
      }
    }
    setDeleteConfirmOpen(false)
  }

  const handleAddBookmark = (newBookmark: any) => {
    setBookmarks(prev => [...prev, newBookmark])
  }

  const handleBulkAddBookmarks = (newBookmarks: any[]) => {
    console.log('📤 批量添加书签，新增数量:', newBookmarks.length)
    setBookmarks(prev => {
      const updated = [...prev, ...newBookmarks]
      console.log('📊 更新后总书签数量:', updated.length)
      return updated
    })
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
      {/* 加载状态指示器 */}
      {isLoadingData && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>正在从GitHub加载图片数据...</span>
          </div>
        </div>
      )}

      {/* Add Bookmark Button */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">我的图片</h1>
          {filteredBookmarks.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartialSelected
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-muted-foreground">
                  {isAllSelected ? '取消全选' : '全选'}
                </span>
              </label>
            </div>
          )}
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
          <ConfigGenerator />
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
          <p className="text-muted-foreground mb-4">Try adjusting your search criteria.</p>
        </div>
      )}

      {/* Add Image Dialog */}
      <AddBookmarkDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddBookmark={handleAddBookmark}
      />

      {/* Simple Bulk Upload Dialog */}
      <SimpleBulkUploadDialog
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
