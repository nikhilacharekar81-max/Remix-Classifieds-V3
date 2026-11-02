import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'motion'],
  },
  onDemandEntries: {
    // Prevent dev server from disposing compiled routes (such as app/[city]/page)
    // when DISABLE_HMR=true disables the active-page WebSocket ping.
    maxInactiveAge: 24 * 60 * 60 * 1000,
    pagesBufferLength: 100,
  },
  generateBuildId: async () => {
    return (
      process.env.NEXT_BUILD_ID ||
      process.env.K_REVISION ||
      process.env.COMMIT_SHA ||
      'fivepa-cloudrun-build'
    );
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value:
              process.env.NODE_ENV === 'production'
                ? 'public, max-age=31536000, immutable'
                : 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;

