/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/whiteboard-app2' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/whiteboard-app2/' : '',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
