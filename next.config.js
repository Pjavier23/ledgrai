/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tkljofxcndnwqyqrtrnx.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
