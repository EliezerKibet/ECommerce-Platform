/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,

        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '5202',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'your-production-domain.com',
                pathname: '/**',
            }
        ],

        domains: ['localhost'],

        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    reactStrictMode: true,
    swcMinify: true,
}

module.exports = nextConfig