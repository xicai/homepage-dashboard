# GitHub Pages 部署指南 🚀

## 📋 部署步骤

### 1. 准备 GitHub 仓库

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: Image management app with cross-browser sync"

# 添加远程仓库（替换为您的仓库地址）
git remote add origin https://github.com/yourusername/homepage-dashboard.git

# 推送到 GitHub
git push -u origin main
```

### 2. 启用 GitHub Pages

1. **进入仓库设置**
   - 访问您的 GitHub 仓库
   - 点击 `Settings` 标签页

2. **配置 Pages**
   - 在左侧菜单找到 `Pages`
   - Source 选择 `GitHub Actions`
   - 保存设置

3. **自动部署**
   - 推送代码到 `main` 分支会自动触发部署
   - 部署完成后，访问 `https://yourusername.github.io/homepage-dashboard`

## 🔧 配置说明

### GitHub Actions 工作流

项目已包含 `.github/workflows/deploy.yml` 文件，会自动：

1. **安装依赖**: `npm ci`
2. **构建项目**: `npm run export`
3. **部署到 Pages**: 将 `out/` 目录发布到 `gh-pages` 分支

### Next.js 配置

项目已针对 GitHub Pages 优化：

```javascript
// next.config.js
const nextConfig = {
  output: 'export',           // 静态导出
  trailingSlash: true,        // 兼容静态托管
  images: { unoptimized: true }, // 禁用图片优化
  assetPrefix: process.env.NODE_ENV === 'production' ? '/homepage-dashboard' : '',
}
```

### 路径修复

`scripts/fix-paths.js` 会自动修复静态文件中的资源路径。

## 🌐 访问应用

部署成功后，您可以通过以下地址访问：

- **主页**: `https://yourusername.github.io/homepage-dashboard`
- **直接访问**: `https://yourusername.github.io/homepage-dashboard/index.html`

## 📱 功能验证

### 基本功能测试

1. **页面加载**: 确认应用正常加载，显示示例图片
2. **响应式设计**: 在不同设备上测试布局
3. **图片上传**: 测试文件上传功能
4. **数据同步**: 测试导入/导出功能

### 跨浏览器测试

1. **Chrome/Edge**: 完整功能测试
2. **Firefox/Safari**: 基础功能测试
3. **移动端**: 响应式布局测试

## 🔍 故障排除

### 常见问题

#### 1. 部署失败
- 检查 GitHub Actions 日志
- 确认 `package.json` 中的脚本正确
- 验证 Node.js 版本兼容性

#### 2. 资源加载失败
- 检查 `assetPrefix` 配置
- 确认路径修复脚本正常运行
- 验证相对路径设置

#### 3. 功能异常
- 检查浏览器控制台错误
- 确认静态模式检测逻辑
- 验证 localStorage 功能

### 调试命令

```bash
# 本地测试静态构建
npm run export
cd out
python -m http.server 8000  # 或使用其他静态服务器

# 检查构建输出
ls -la out/
cat out/index.html | grep -E "(href|src)="
```

## 🚀 高级配置

### 自定义域名

1. 在仓库根目录创建 `CNAME` 文件
2. 添加您的域名（如 `example.com`）
3. 在域名提供商处配置 DNS

### 环境变量

如需使用环境变量，在 GitHub 仓库设置中添加 Secrets：

1. Settings → Secrets and variables → Actions
2. 添加所需的环境变量
3. 在 workflow 中引用

## 📊 监控和分析

### GitHub Pages 统计

- 访问量统计
- 流量来源分析
- 用户行为追踪

### 性能优化

- 启用 CDN 加速
- 压缩静态资源
- 优化图片格式

## 🎉 部署完成

恭喜！您的图片管理应用已成功部署到 GitHub Pages。

现在您可以：
- 📱 在任何设备上访问应用
- 🌐 分享给其他用户使用
- 🔄 享受跨浏览器数据同步功能
- 📸 管理您的图片收藏

---

**需要帮助？** 请查看 [GitHub Pages 官方文档](https://docs.github.com/en/pages) 或提交 Issue。