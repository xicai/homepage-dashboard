/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出配置
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // GitHub Pages 部署配置
  // 使用环境变量来控制是否启用 basePath
  assetPrefix: process.env.GITHUB_ACTIONS ? '/homepage-dashboard' : '',
  basePath: process.env.GITHUB_ACTIONS ? '/homepage-dashboard' : '',
  // 静态导出优化配置
  experimental: {
    // 启用静态导出优化
    optimizeCss: false,
  },
}

module.exports = nextConfig