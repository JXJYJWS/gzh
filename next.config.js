/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mmbiz.qpic.cn',
      },
      {
        protocol: 'http',
        hostname: 'mmbiz.qpic.cn',
      },
      {
        protocol: 'https',
        hostname: 'wx.qlogo.cn',
      },
      {
        protocol: 'http',
        hostname: 'wx.qlogo.cn',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
