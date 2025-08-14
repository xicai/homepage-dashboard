'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Separator } from "@/components/ui/separator"
import { 
  Github, 
  Settings, 
  Cloud, 
  Download, 
  Upload, 
  RefreshCw,
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Info,
  Sync
} from 'lucide-react'
import { githubDataSyncer, GitHubSyncConfig } from '@/lib/github-uploader'

interface GitHubSyncDialogProps {
  bookmarks: any[]
  onSyncComplete: (data: any[]) => void
}

export default function GitHubSyncDialog({ bookmarks, onSyncComplete }: GitHubSyncDialogProps) {
  const [open, setOpen] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<GitHubSyncConfig>({
    token: '',
    owner: '',
    repo: '',
    branch: 'master',
    dataFile: 'public/data/bookmarks.json',
    autoSync: false
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'uploading' | 'downloading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [validationError, setValidationError] = useState('')
  const [syncInfo, setSyncInfo] = useState({
    lastSyncTime: null as Date | null,
    lastSyncCount: 0,
    isConfigured: false
  })

  // 加载配置和同步状态
  useEffect(() => {
    loadConfig()
    updateSyncInfo()
  }, [open])

  const loadConfig = () => {
    try {
      const saved = localStorage.getItem('github-sync-config')
      if (saved) {
        const parsedConfig = JSON.parse(saved)
        setConfig(prev => ({ ...prev, ...parsedConfig }))
        
        // 如果有完整配置，初始化同步器
        if (parsedConfig.token && parsedConfig.owner && parsedConfig.repo) {
          githubDataSyncer.initConfig(parsedConfig)
          setShowConfig(false)
        } else {
          setShowConfig(true)
        }
      } else {
        setShowConfig(true)
      }
    } catch (error) {
      console.error('Failed to load sync config:', error)
      setShowConfig(true)
    }
  }

  const saveConfig = () => {
    try {
      localStorage.setItem('github-sync-config', JSON.stringify(config))
      githubDataSyncer.initConfig(config)
      updateSyncInfo()
      setValidationError('')
      setStatusMessage('配置已保存并初始化同步器')
    } catch (error) {
      console.error('Failed to save sync config:', error)
      setValidationError('保存配置失败')
    }
  }

  const updateSyncInfo = () => {
    const status = githubDataSyncer.getSyncStatus()
    setSyncInfo(status)
  }

  const validateConfig = (): boolean => {
    if (!config.token || !config.owner || !config.repo) {
      setValidationError('请填写所有必需的配置项')
      return false
    }
    setValidationError('')
    return true
  }

  // 同步到GitHub
  const handleSyncToGitHub = async () => {
    if (!validateConfig()) return

    setIsSyncing(true)
    setSyncStatus('uploading')
    setStatusMessage('正在上传数据到GitHub...')

    try {
      const result = await githubDataSyncer.syncToGitHub(bookmarks)
      
      if (result.success) {
        setSyncStatus('success')
        setStatusMessage(`成功同步 ${bookmarks.length} 个书签到GitHub`)
        updateSyncInfo()
      } else {
        setSyncStatus('error')
        setStatusMessage(result.error || '同步失败')
      }
    } catch (error) {
      setSyncStatus('error')
      setStatusMessage(error instanceof Error ? error.message : '同步过程中发生错误')
    } finally {
      setIsSyncing(false)
    }
  }

  // 从GitHub同步
  const handleSyncFromGitHub = async () => {
    if (!validateConfig()) return

    setIsSyncing(true)
    setSyncStatus('downloading')
    setStatusMessage('正在从GitHub拉取数据...')

    try {
      const result = await githubDataSyncer.syncFromGitHub()
      
      if (result.success) {
        if (result.hasUpdates && result.data) {
          onSyncComplete(result.data)
          setSyncStatus('success')
          setStatusMessage(`成功从GitHub同步 ${result.data.length} 个书签`)
          updateSyncInfo()
        } else {
          setSyncStatus('success')
          setStatusMessage('数据已是最新，无需更新')
        }
      } else {
        setSyncStatus('error')
        setStatusMessage(result.error || '拉取数据失败')
      }
    } catch (error) {
      setSyncStatus('error')
      setStatusMessage(error instanceof Error ? error.message : '同步过程中发生错误')
    } finally {
      setIsSyncing(false)
    }
  }

  // 双向同步
  const handleFullSync = async () => {
    if (!validateConfig()) return

    setIsSyncing(true)
    setStatusMessage('正在执行双向同步...')

    try {
      // 先拉取远程数据
      setSyncStatus('downloading')
      setStatusMessage('第1步: 从GitHub拉取数据...')
      
      const pullResult = await githubDataSyncer.syncFromGitHub()
      
      if (pullResult.success && pullResult.hasUpdates && pullResult.data) {
        // 如果有更新，合并数据
        onSyncComplete(pullResult.data)
        setStatusMessage('第2步: 数据已更新，准备上传...')
      } else {
        setStatusMessage('第2步: 准备上传本地数据...')
      }

      // 再上传当前数据
      setSyncStatus('uploading')
      setStatusMessage('第2步: 上传数据到GitHub...')
      
      const pushResult = await githubDataSyncer.syncToGitHub(bookmarks)
      
      if (pushResult.success) {
        setSyncStatus('success')
        setStatusMessage('双向同步完成！数据已保持一致')
        updateSyncInfo()
      } else {
        setSyncStatus('error')
        setStatusMessage(pushResult.error || '上传数据失败')
      }
    } catch (error) {
      setSyncStatus('error')
      setStatusMessage(error instanceof Error ? error.message : '双向同步失败')
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'uploading':
      case 'downloading':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Info className="h-4 w-4 text-gray-400" />
    }
  }

  const clearConfig = () => {
    githubDataSyncer.clearConfig()
    setConfig({
      token: '',
      owner: '',
      repo: '',
      branch: 'master',
      dataFile: 'public/data/bookmarks.json',
      autoSync: false
    })
    updateSyncInfo()
    setShowConfig(true)
    setStatusMessage('配置已清除')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Github className="h-4 w-4" />
          GitHub同步
          {syncInfo.isConfigured && (
            <Badge variant="secondary" className="ml-1">
              已配置
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub 数据同步
          </DialogTitle>
          <DialogDescription>
            将书签数据同步到GitHub仓库，实现跨设备数据一致性
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 同步状态信息 */}
          {syncInfo.isConfigured && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">同步状态</h3>
                <Badge variant={syncInfo.isConfigured ? "default" : "secondary"}>
                  {syncInfo.isConfigured ? "已配置" : "未配置"}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>最后同步时间:</span>
                  <span>{syncInfo.lastSyncTime ? syncInfo.lastSyncTime.toLocaleString() : '从未同步'}</span>
                </div>
                <div className="flex justify-between">
                  <span>最后同步数量:</span>
                  <span>{syncInfo.lastSyncCount} 个书签</span>
                </div>
                <div className="flex justify-between">
                  <span>当前书签数量:</span>
                  <span>{bookmarks.length} 个书签</span>
                </div>
              </div>
            </div>
          )}

          {/* 配置区域 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">GitHub 配置</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfig(!showConfig)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {showConfig ? '隐藏配置' : '显示配置'}
                </Button>
                {syncInfo.isConfigured && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearConfig}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    清除配置
                  </Button>
                )}
              </div>
            </div>

            {showConfig && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="col-span-2">
                  <Label htmlFor="sync-token">Personal Access Token *</Label>
                  <Input
                    id="sync-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxx"
                    value={config.token}
                    onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    需要 repo 权限的 GitHub Personal Access Token
                  </p>
                </div>
                <div>
                  <Label htmlFor="sync-owner">仓库所有者 *</Label>
                  <Input
                    id="sync-owner"
                    placeholder="username"
                    value={config.owner}
                    onChange={(e) => setConfig(prev => ({ ...prev, owner: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sync-repo">仓库名称 *</Label>
                  <Input
                    id="sync-repo"
                    placeholder="repository-name"
                    value={config.repo}
                    onChange={(e) => setConfig(prev => ({ ...prev, repo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sync-branch">分支</Label>
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
                  <Label htmlFor="sync-datafile">数据文件路径</Label>
                  <Input
                    id="sync-datafile"
                    placeholder="public/data/bookmarks.json"
                    value={config.dataFile}
                    onChange={(e) => setConfig(prev => ({ ...prev, dataFile: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      id="auto-sync"
                      type="checkbox"
                      checked={config.autoSync}
                      onChange={(e) => setConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="auto-sync" className="text-sm">
                      启用自动同步（数据变更时自动上传到GitHub）
                    </Label>
                  </div>
                </div>
                <div className="col-span-2 pt-2">
                  <Button onClick={saveConfig} variant="default" size="sm">
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

          {/* 同步操作 */}
          {syncInfo.isConfigured && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">同步操作</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    onClick={handleSyncToGitHub}
                    disabled={isSyncing}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    上传到GitHub
                  </Button>
                  
                  <Button
                    onClick={handleSyncFromGitHub}
                    disabled={isSyncing}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    从GitHub拉取
                  </Button>
                  
                  <Button
                    onClick={handleFullSync}
                    disabled={isSyncing}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Sync className="h-4 w-4" />
                    双向同步
                  </Button>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>上传:</strong> 将当前数据推送到GitHub<br />
                    <strong>拉取:</strong> 从GitHub获取最新数据<br />
                    <strong>双向同步:</strong> 先拉取，再推送，确保数据一致
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          {/* 状态显示 */}
          {statusMessage && (
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {getStatusIcon()}
              <span className="text-sm">{statusMessage}</span>
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