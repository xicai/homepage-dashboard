/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用开发模式下的调试面板
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // 禁用开发工具
  experimental: {
    // 禁用开发者工具面板
    devOverlays: false,
  },
}

module.exports = nextConfig