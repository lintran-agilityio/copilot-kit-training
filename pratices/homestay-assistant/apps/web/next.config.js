import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  transpilePackages: ["@repo/constants"],
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: skip typecheck during `next build` to cut peak RAM on Render.
    // Run `pnpm --filter web check-types` in CI locally instead.
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackMemoryOptimizations: true,
    cpus: 1,
    memoryBasedWorkersCount: true,
    // lucide-react is optimized by default; radix-ui umbrella is not.
    optimizePackageImports: ["radix-ui"],
  },
  serverExternalPackages: [
    "@ag-ui/client",
    "@ag-ui/mastra",
    "@mastra/client-js",
    "@copilotkit/runtime",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
