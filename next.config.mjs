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
  // Add headers to prevent aggressive caching and force fresh loads
  async headers() {
    return [
      {
        // Force no-cache for HTML pages
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Allow caching of static assets (Next.js handles versioning)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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

