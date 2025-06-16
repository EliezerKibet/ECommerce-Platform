/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // Simple solution: Allow all external images (for development)
        unoptimized: true,

        // Alternative: Specific domain configuration
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

        // Legacy domains format (fallback)
        domains: ['localhost'],

        // Image optimization settings
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    // Add any other Next.js configurations here
    reactStrictMode: true,
    swcMinify: true,
}

module.exports = nextConfig