'use client'

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { 
  Github, 
  Cloud, 
  RefreshCw,
  CheckCircle, 
  XCircle, 
  AlertCircle
} from 'lucide-react'

interface GitHubSyncStatusProps {
  className?: string
}

export default function GitHubSyncStatus({ className = '' }: GitHubSyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'configured'>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    updateStatus()
    
    // 监听localStorage变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'github_sync_timestamp' || e.key === 'github-sync-config') {
        updateStatus()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const updateStatus = () => {
    try {
      // 检查是否已配置
      const syncConfig = localStorage.getItem('github-sync-config')
      if (syncConfig) {
        const config = JSON.parse(syncConfig)
        const configured = !!(config.token && config.owner && config.repo)
        setIsConfigured(configured)
        
        if (configured) {
          // 检查最后同步时间
          const lastSync = localStorage.getItem('github_sync_timestamp')
          if (lastSync) {
            const syncTime = new Date(parseInt(lastSync))
            setLastSyncTime(syncTime)
            
            // 如果是最近5分钟内同步的，显示成功状态
            const timeDiff = Date.now() - syncTime.getTime()
            if (timeDiff < 5 * 60 * 1000) {
              setSyncStatus('success')
            } else {
              setSyncStatus('configured')
            }
          } else {
            setSyncStatus('configured')
          }
        } else {
          setSyncStatus('idle')
        }
      } else {
        setIsConfigured(false)
        setSyncStatus('idle')
      }
    } catch (error) {
      console.error('更新同步状态失败:', error)
      setSyncStatus('error')
    }
  }

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'syncing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'configured':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'success':
        return <CheckCircle className="h-3 w-3" />
      case 'error':
        return <XCircle className="h-3 w-3" />
      case 'syncing':
        return <RefreshCw className="h-3 w-3 animate-spin" />
      case 'configured':
        return <Cloud className="h-3 w-3" />
      default:
        return <Github className="h-3 w-3" />
    }
  }

  const getStatusText = () => {
    switch (syncStatus) {
      case 'success':
        return lastSyncTime ? `已同步 ${getTimeAgo(lastSyncTime)}` : '已同步'
      case 'error':
        return '同步失败'
      case 'syncing':
        return '同步中'
      case 'configured':
        return '已配置'
      default:
        return '未配置'
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = Date.now()
    const diff = now - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  if (!isConfigured && syncStatus === 'idle') {
    return null // 不显示未配置状态
  }

  return (
    <Badge 
      variant="secondary" 
      className={`${getStatusColor()} ${className} flex items-center gap-1 text-xs`}
      title={`GitHub同步状态: ${getStatusText()}`}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </Badge>
  )
}