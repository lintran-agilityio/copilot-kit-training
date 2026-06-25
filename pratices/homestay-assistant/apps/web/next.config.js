/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/constants", "@repo/shared", "agent"],
  serverExternalPackages: [
    "@mastra/libsql",
    "@libsql/client",
    "libsql",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
