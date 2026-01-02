/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
}

module.exports = nextConfig
