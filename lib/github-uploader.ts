/**
 * GitHub 文件上传工具
 * 使用 GitHub API 直接上传文件到仓库
 */

export interface GitHubUploadOptions {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  path: string;
  content: string | ArrayBuffer;
  message?: string;
  isBase64?: boolean;
}

export interface GitHubUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  sha?: string;
}

export interface GitHubSyncConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  dataFile?: string;
  autoSync?: boolean;
}

export class GitHubUploader {
  private baseUrl = 'https://api.github.com';

  /**
   * 上传文件到 GitHub 仓库
   */
  async uploadFile(options: GitHubUploadOptions): Promise<GitHubUploadResult> {
    try {
      const {
        token,
        owner,
        repo,
        branch = 'master',
        path,
        content,
        message = `Upload ${path}`,
        isBase64 = false
      } = options;

      // 转换内容为 base64
      let base64Content: string;
      if (isBase64 && typeof content === 'string') {
        base64Content = content;
      } else if (content instanceof ArrayBuffer) {
        base64Content = this.arrayBufferToBase64(content);
      } else if (typeof content === 'string') {
        base64Content = btoa(unescape(encodeURIComponent(content)));
      } else {
        throw new Error('Unsupported content type');
      }

      // 检查文件是否已存在
      const existingFile = await this.getFileInfo(token, owner, repo, path, branch);
      
      const requestBody = {
        message,
        content: base64Content,
        branch,
        ...(existingFile?.sha && { sha: existingFile.sha })
      };

      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        url: result.content?.html_url || result.content?.download_url,
        sha: result.content?.sha
      };

    } catch (error) {
      console.error('GitHub upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 批量上传文件
   */
  async uploadMultipleFiles(
    files: Array<Omit<GitHubUploadOptions, 'token' | 'owner' | 'repo' | 'branch'>>,
    commonOptions: Pick<GitHubUploadOptions, 'token' | 'owner' | 'repo' | 'branch'>
  ): Promise<GitHubUploadResult[]> {
    const results: GitHubUploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadFile({
        ...commonOptions,
        ...file
      });
      results.push(result);
      
      // 添加小延迟避免 API 限制
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * 获取文件信息（用于检查文件是否存在）
   */
  private async getFileInfo(
    token: string,
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<{ sha: string } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { sha: data.sha };
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 将 ArrayBuffer 转换为 base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 将图片文件转换为 base64
   */
  async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:image/...;base64, 前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 生成唯一文件名
   */
  generateUniqueFileName(originalName: string, prefix: string = 'upload'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${prefix}/${timestamp}-${randomId}.${extension}`;
  }

  /**
   * 验证 GitHub token 是否有效
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 获取仓库信息
   */
  async getRepoInfo(token: string, owner: string, repo: string) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 上传JSON数据到GitHub
   */
  async uploadJsonData(
    token: string,
    owner: string, 
    repo: string,
    data: any,
    filename: string = 'public/data/bookmarks.json',
    branch: string = 'master',
    message: string = '同步数据更新'
  ): Promise<GitHubUploadResult> {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));
      
      return await this.uploadFile({
        token,
        owner,
        repo,
        branch,
        path: filename,
        content: base64Content,
        message,
        isBase64: true
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload JSON data'
      };
    }
  }

  /**
   * 从GitHub拉取JSON数据
   */
  async fetchJsonData(
    token: string,
    owner: string,
    repo: string,
    filename: string = 'public/data/bookmarks.json',
    branch: string = 'master'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/contents/${filename}?ref=${branch}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: '文件不存在' };
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const result = await response.json();
      
      // 解码base64内容
      const decodedContent = atob(result.content.replace(/\s/g, ''));
      const jsonData = JSON.parse(decodedContent);
      
      return {
        success: true,
        data: jsonData
      };

    } catch (error) {
      console.error('Failed to fetch JSON from GitHub:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      };
    }
  }

  /**
   * 获取文件的最后修改时间
   */
  async getFileLastModified(
    token: string,
    owner: string,
    repo: string,
    filename: string,
    branch: string = 'master'
  ): Promise<{ success: boolean; timestamp?: string; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/commits?path=${filename}&sha=${branch}&per_page=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get commit info: ${response.status}`);
      }

      const commits = await response.json();
      if (commits.length > 0) {
        return {
          success: true,
          timestamp: commits[0].commit.committer.date
        };
      }

      return { success: false, error: 'No commits found' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file timestamp'
      };
    }
  }
}

/**
 * GitHub数据同步管理器
 */
export class GitHubDataSyncer {
  private uploader = new GitHubUploader();
  private syncConfig: {
    token: string;
    owner: string;
    repo: string;
    branch: string;
    dataFile: string;
  } | null = null;

  /**
   * 初始化同步配置
   */
  initConfig(config: {
    token: string;
    owner: string;
    repo: string;
    branch?: string;
    dataFile?: string;
  }) {
    this.syncConfig = {
      branch: 'master',
      dataFile: 'public/data/bookmarks.json',
      ...config
    };
  }

  /**
   * 同步数据到GitHub
   */
  async syncToGitHub(bookmarks: any[]): Promise<{ success: boolean; error?: string }> {
    if (!this.syncConfig) {
      return { success: false, error: '未配置GitHub同步' };
    }

    try {
      const result = await this.uploader.uploadJsonData(
        this.syncConfig.token,
        this.syncConfig.owner,
        this.syncConfig.repo,
        bookmarks,
        this.syncConfig.dataFile,
        this.syncConfig.branch,
        `数据同步: 更新 ${bookmarks.length} 个书签`
      );

      if (result.success) {
        // 保存同步时间戳到localStorage
        localStorage.setItem('github_sync_timestamp', Date.now().toString());
        localStorage.setItem('github_last_sync_count', bookmarks.length.toString());
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '同步失败'
      };
    }
  }

  /**
   * 从GitHub拉取数据
   */
  async syncFromGitHub(): Promise<{ success: boolean; data?: any[]; error?: string; hasUpdates?: boolean }> {
    if (!this.syncConfig) {
      return { success: false, error: '未配置GitHub同步' };
    }

    try {
      // 先检查文件是否有更新
      const lastModified = await this.uploader.getFileLastModified(
        this.syncConfig.token,
        this.syncConfig.owner,
        this.syncConfig.repo,
        this.syncConfig.dataFile,
        this.syncConfig.branch
      );

      if (lastModified.success && lastModified.timestamp) {
        const localSyncTime = localStorage.getItem('github_sync_timestamp');
        const githubModifyTime = new Date(lastModified.timestamp).getTime();
        
        if (localSyncTime && githubModifyTime <= parseInt(localSyncTime)) {
          return {
            success: true,
            hasUpdates: false,
            data: [],
            error: '数据已是最新'
          };
        }
      }

      // 拉取最新数据
      const result = await this.uploader.fetchJsonData(
        this.syncConfig.token,
        this.syncConfig.owner,
        this.syncConfig.repo,
        this.syncConfig.dataFile,
        this.syncConfig.branch
      );

      if (result.success) {
        // 更新本地同步时间戳
        localStorage.setItem('github_sync_timestamp', Date.now().toString());
        localStorage.setItem('github_last_sync_count', (result.data?.length || 0).toString());
        
        return {
          success: true,
          hasUpdates: true,
          data: result.data
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '拉取数据失败'
      };
    }
  }

  /**
   * 检查是否有配置
   */
  isConfigured(): boolean {
    return this.syncConfig !== null;
  }

  /**
   * 获取同步状态信息
   */
  getSyncStatus() {
    const lastSyncTime = localStorage.getItem('github_sync_timestamp');
    const lastSyncCount = localStorage.getItem('github_last_sync_count');
    
    return {
      lastSyncTime: lastSyncTime ? new Date(parseInt(lastSyncTime)) : null,
      lastSyncCount: lastSyncCount ? parseInt(lastSyncCount) : 0,
      isConfigured: this.isConfigured()
    };
  }

  /**
   * 清除配置
   */
  clearConfig() {
    this.syncConfig = null;
    localStorage.removeItem('github-sync-config');
    localStorage.removeItem('github_sync_timestamp');
    localStorage.removeItem('github_last_sync_count');
  }
}

// 导出单例实例
export const githubUploader = new GitHubUploader();
export const githubDataSyncer = new GitHubDataSyncer();