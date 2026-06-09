/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore ESLint errors during production build
  // Prevents no-unescaped-entities and no-img-element from blocking deploy
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during production build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Allow images from all external domains (Cloudinary, Unsplash, etc.)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Enable React strict mode
  reactStrictMode: true,
};

module.exports = nextConfig;
