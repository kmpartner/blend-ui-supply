/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Note: Required for static builds
  },
  trailingSlash: true,
};

export default nextConfig
