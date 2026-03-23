/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Remove X-Powered-By header for security
    poweredByHeader: false,

    experimental: {
        missingSuspenseWithCSRBailout: false,
    },

    // Image optimization: whitelist external domains
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: '**.supabase.in',
            },
        ],
        // Optimize image quality and formats
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60 * 60 * 24, // 24 hours
    },

    // Security headers applied to all routes
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                ],
            },
        ];
    },

    // Logging: helpful for debugging in production
    logging: {
        fetches: {
            fullUrl: process.env.NODE_ENV === 'development',
        },
    },
};

export default nextConfig;
