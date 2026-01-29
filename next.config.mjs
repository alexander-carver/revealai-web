/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Enable modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Increase minimum cache time for better performance
    minimumCacheTTL: 31536000, // 1 year
  },
  // Allow webhook routes to access raw body
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Security and cache headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
  // Turbopack configuration (Next.js 16+)
  // Empty config acknowledges Turbopack is in use
  // Supabase functions are excluded via tsconfig.json
  turbopack: {},
  // Keep webpack config for backwards compatibility if using --webpack flag
  webpack: (config) => {
    // Ignore Supabase Edge Functions (Deno files)
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    config.module.rules.push({
      test: /supabase\/functions\/.*\.ts$/,
      use: 'ignore-loader',
    });
    return config;
  },
};

export default nextConfig;

