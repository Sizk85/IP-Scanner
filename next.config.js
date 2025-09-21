/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  // Disable automatic icon detection to prevent build errors
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig