/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/constants", "@repo/shared", "agent"],
  serverExternalPackages: [
    "@mastra/libsql",
    "@libsql/client",
    "libsql",
  ],
};

export default nextConfig;
