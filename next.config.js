const isProd = process.env.NODE_ENV === 'production'

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self'${isProd ? '' : " 'unsafe-eval'"} 'unsafe-inline' https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ')

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspDirectives,
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

if (isProd) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  })
}

const devOrigins = process.env.NEXT_PUBLIC_DEV_ORIGINS
  ? process.env.NEXT_PUBLIC_DEV_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : []

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: devOrigins.length ? devOrigins : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icons/icon-192x192.svg',
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optimize for faster dev and smaller bundle
  compiler: {
    // Remove ALL console logs in production for security
    removeConsole: process.env.NODE_ENV === 'production',
  },
  reactStrictMode: true,
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
  },
  // Next.js 16 uses Turbopack by default; empty config acknowledges this
  turbopack: {},
  // Exclude server-only packages from client bundle (works with both bundlers)
  serverExternalPackages: ['onnxruntime-node', '@xenova/transformers'],
  // Webpack fallback config (used when explicitly running with --webpack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
        '@xenova/transformers': false,
      }
    }
    return config
  },
}

module.exports = nextConfig
