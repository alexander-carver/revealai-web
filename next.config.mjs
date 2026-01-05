/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allow webhook routes to access raw body
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Add headers to prevent aggressive caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
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

