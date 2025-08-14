# 图片管理应用 📸

一个基于 Next.js 的静态图片管理应用，支持跨浏览器数据同步和本地文件管理。

## 🌟 特性

- ✅ **静态部署**: 完全静态化，可部署到 GitHub Pages
- ✅ **跨浏览器同步**: 智能数据同步机制
- ✅ **本地文件管理**: 支持 File System Access API
- ✅ **响应式设计**: 适配所有设备
- ✅ **现代浏览器优化**: Chrome/Edge 完整功能支持
- ✅ **传统浏览器兼容**: Firefox/Safari 回退支持

## 🚀 在线演示

访问 GitHub Pages 部署版本：[https://yourusername.github.io/homepage-dashboard](https://yourusername.github.io/homepage-dashboard)

## 📦 本地开发

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建静态文件
```bash
npm run export
```

构建完成后，静态文件将生成在 `out/` 目录中。

## 🌐 GitHub Pages 部署

### 自动部署（推荐）

1. **Fork 或克隆此仓库**
2. **推送到 GitHub**
3. **启用 GitHub Pages**：
   - 进入仓库 Settings → Pages
   - Source 选择 "GitHub Actions"
4. **自动构建**：每次推送到 main 分支时自动部署

### 手动部署

```bash
# 构建静态文件
npm run export

# 部署到 gh-pages 分支
npx gh-pages -d out
```

## 🔧 配置说明

### Next.js 配置
项目已配置为静态导出模式：
- `output: 'export'` - 启用静态导出
- `trailingSlash: true` - 兼容静态托管
- `images: { unoptimized: true }` - 禁用图片优化

### 路径修复
自动修复静态文件中的资源路径，确保在 GitHub Pages 上正常工作。

## 📱 功能说明

### 图片上传
- **现代浏览器**: 使用 File System Access API 直接保存到指定文件夹
- **传统浏览器**: 下载文件，手动移动到 uploads 文件夹

### 数据同步
- **自动同步**: 应用启动时自动加载共享数据
- **手动同步**: 导出/导入 JSON 文件实现跨浏览器同步

### 文件结构
```
out/
├── index.html              # 应用入口
├── data/
│   └── bookmarks.json      # 共享数据文件
├── uploads/                # 图片存储目录
│   └── example.jpg         # 示例图片
└── _next/                  # Next.js 静态资源
```

## 🛠️ 技术栈

- **框架**: Next.js 15.2.4
- **UI**: Tailwind CSS + shadcn/ui
- **图标**: Lucide React
- **部署**: GitHub Pages
- **CI/CD**: GitHub Actions

## 📋 浏览器支持

| 浏览器 | 版本 | 功能支持 |
|--------|------|----------|
| Chrome | 86+ | 完整功能 |
| Edge | 86+ | 完整功能 |
| Firefox | 最新 | 基础功能 |
| Safari | 最新 | 基础功能 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)