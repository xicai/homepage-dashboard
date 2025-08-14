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
}

// 导出单例实例
export const githubUploader = new GitHubUploader();