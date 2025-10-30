/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/fresh-store',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig

