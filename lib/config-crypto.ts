/**
 * GitHub配置加密/解密工具
 * 使用简单的Base64和XOR加密来保护敏感配置信息
 */

interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch?: string
}

// 简单的密钥，实际项目中应该使用更复杂的密钥
const ENCRYPTION_KEY = "github-image-upload-2024"

/**
 * XOR加密函数
 */
function xorEncrypt(text: string, key: string): string {
  let result = ""
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(charCode)
  }
  return result
}

/**
 * XOR解密函数（与加密相同）
 */
function xorDecrypt(encryptedText: string, key: string): string {
  return xorEncrypt(encryptedText, key) // XOR加密和解密是相同的操作
}

/**
 * 加密GitHub配置
 */
export function encryptGitHubConfig(config: GitHubConfig): string {
  try {
    // 将配置对象转换为JSON字符串
    const configJson = JSON.stringify({
      token: config.token,
      owner: config.owner,
      repo: config.repo,
      branch: config.branch || 'master'
    })
    
    // 使用XOR加密
    const encrypted = xorEncrypt(configJson, ENCRYPTION_KEY)
    
    // 转换为Base64编码
    const base64Encoded = btoa(unescape(encodeURIComponent(encrypted)))
    
    return base64Encoded
  } catch (error) {
    console.error('加密配置失败:', error)
    throw new Error('配置加密失败')
  }
}

/**
 * 解密GitHub配置
 */
export function decryptGitHubConfig(encryptedConfig: string): GitHubConfig | null {
  try {
    // 从Base64解码
    const decoded = decodeURIComponent(escape(atob(encryptedConfig)))
    
    // 使用XOR解密
    const decrypted = xorDecrypt(decoded, ENCRYPTION_KEY)
    
    // 解析JSON
    const config = JSON.parse(decrypted)
    
    // 验证必需字段
    if (!config.token || !config.owner || !config.repo) {
      throw new Error('配置格式无效')
    }
    
    return {
      token: config.token,
      owner: config.owner,
      repo: config.repo,
      branch: config.branch || 'master'
    }
  } catch (error) {
    console.error('解密配置失败:', error)
    return null
  }
}

/**
 * 生成配置字符串（用于用户生成加密配置）
 */
export function generateConfigString(token: string, owner: string, repo: string, branch: string = 'master'): string {
  const config: GitHubConfig = { token, owner, repo, branch }
  return encryptGitHubConfig(config)
}

/**
 * 验证加密配置字符串是否有效
 */
export function validateEncryptedConfig(encryptedConfig: string): boolean {
  const config = decryptGitHubConfig(encryptedConfig)
  return config !== null
}

/**
 * 从加密配置中提取仓库信息（不包含token）
 */
export function getRepoInfoFromConfig(encryptedConfig: string): { owner: string, repo: string, branch: string } | null {
  const config = decryptGitHubConfig(encryptedConfig)
  if (!config) return null
  
  return {
    owner: config.owner,
    repo: config.repo,
    branch: config.branch || 'master'
  }
}