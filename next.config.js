/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Match the actual precomputed WebP widths used by NewsImage's loader.
    deviceSizes: [640, 1200],
    imageSizes: [240],
    domains: ['images.unsplash.com', 'logo.clearbit.com'],
  },
  async headers() {
    return [
      {
        source: '/news-images/:image',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
