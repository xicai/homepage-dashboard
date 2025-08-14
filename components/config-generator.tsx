"use client"

import { useState } from "react"
import { Copy, Key, Github, Eye, EyeOff, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { generateConfigString, decryptGitHubConfig } from "@/lib/config-crypto"

interface ConfigGeneratorProps {
  onConfigGenerated?: (encryptedConfig: string) => void
}

export function ConfigGenerator({ onConfigGenerated }: ConfigGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    token: '',
    owner: '',
    repo: '',
    branch: 'master'
  })
  const [showToken, setShowToken] = useState(false)
  const [encryptedConfig, setEncryptedConfig] = useState('')
  const [copied, setCopied] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)
  const [validationError, setValidationError] = useState('')

  const handleGenerate = () => {
    // 验证必需字段
    if (!formData.token || !formData.owner || !formData.repo) {
      setValidationError('请填写所有必需字段')
      return
    }

    // 验证GitHub Token格式
    if (!formData.token.startsWith('ghp_') && !formData.token.startsWith('github_pat_')) {
      setValidationError('GitHub Token 格式不正确，应以 ghp_ 或 github_pat_ 开头')
      return
    }

    try {
      const encrypted = generateConfigString(
        formData.token,
        formData.owner,
        formData.repo,
        formData.branch
      )
      
      setEncryptedConfig(encrypted)
      setValidationError('')
      
      // 回调传递生成的配置
      onConfigGenerated?.(encrypted)
    } catch (error) {
      setValidationError('生成配置时发生错误: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(encryptedConfig)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleCopyUrl = async () => {
    try {
      const currentUrl = window.location.origin + window.location.pathname
      const configUrl = `${currentUrl}#${encryptedConfig}`
      await navigator.clipboard.writeText(configUrl)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    } catch (error) {
      console.error('复制URL失败:', error)
    }
  }

  const generateConfigUrl = () => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.origin + window.location.pathname
      return `${currentUrl}#${encryptedConfig}`
    }
    return ''
  }

  const handleClear = () => {
    setFormData({
      token: '',
      owner: '',
      repo: '',
      branch: 'master'
    })
    setEncryptedConfig('')
    setValidationError('')
    setCopied(false)
    setUrlCopied(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    // 延迟清理状态，避免关闭动画时闪烁
    setTimeout(() => {
      handleClear()
    }, 200)
  }

  // 测试解密功能
  const testDecryption = () => {
    if (encryptedConfig) {
      const decrypted = decryptGitHubConfig(encryptedConfig)
      if (decrypted) {
        alert(`解密成功！\n仓库: ${decrypted.owner}/${decrypted.repo}\n分支: ${decrypted.branch}`)
      } else {
        alert('解密失败，配置可能有误')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Key className="h-4 w-4" />
          生成加密配置
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub配置加密工具
          </DialogTitle>
          <DialogDescription>
            生成加密后的GitHub配置字符串，保护您的敏感信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 输入表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GitHub信息</CardTitle>
              <CardDescription>
                请填写您的GitHub仓库信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="token">GitHub Personal Access Token *</Label>
                <div className="relative">
                  <Input
                    id="token"
                    type={showToken ? "text" : "password"}
                    placeholder="ghp_xxxxxxxxxxxxxxxx"
                    value={formData.token}
                    onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  需要 repo 权限的 GitHub Personal Access Token
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner">用户名/组织名 *</Label>
                  <Input
                    id="owner"
                    placeholder="username"
                    value={formData.owner}
                    onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="repo">仓库名 *</Label>
                  <Input
                    id="repo"
                    placeholder="repository-name"
                    value={formData.repo}
                    onChange={(e) => setFormData(prev => ({ ...prev, repo: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="branch">分支</Label>
                <Select value={formData.branch} onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}>
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

              {validationError && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={handleGenerate} className="flex-1">
                  <Key className="h-4 w-4 mr-2" />
                  生成加密配置
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 生成结果 */}
          {encryptedConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  加密配置字符串
                </CardTitle>
                <CardDescription>
                  复制此字符串到应用中使用
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>加密后的配置</Label>
                  <div className="relative">
                    <Input
                      value={encryptedConfig}
                      readOnly
                      className="pr-20 font-mono text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={testDecryption}
                        className="h-8 px-2 text-xs"
                        title="测试解密"
                      >
                        测试
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-8 px-2"
                        title="复制到剪贴板"
                      >
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>配置URL（直接分享链接）</Label>
                  <div className="relative">
                    <Input
                      value={generateConfigUrl()}
                      readOnly
                      className="pr-12 font-mono text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyUrl}
                        className="h-8 px-2"
                        title="复制URL到剪贴板"
                      >
                        {urlCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    分享此链接，其他浏览器访问后会自动导入配置
                  </p>
                </div>

                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    <strong>使用方式：</strong><br />
                    <strong>方式一（直接分享）：</strong>复制"配置URL"分享给其他人，对方访问链接后会自动导入配置<br />
                    <strong>方式二（手动导入）：</strong>复制"加密后的配置"字符串，在上传图片时粘贴到配置输入框
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                  <strong>目标仓库：</strong> {formData.owner}/{formData.repo}<br />
                  <strong>分支：</strong> {formData.branch}<br />
                  <strong>配置长度：</strong> {encryptedConfig.length} 字符
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
          {encryptedConfig && onConfigGenerated && (
            <Button onClick={() => {
              onConfigGenerated(encryptedConfig)
              setIsOpen(false)
            }}>
              使用此配置
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfigGenerator