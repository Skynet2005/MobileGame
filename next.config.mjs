/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify is now enabled by default in Next.js 15+
  typescript: {
    // We'll handle errors in development
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
