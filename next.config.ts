import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Free up RAM by quickly purging inactive pages from memory
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 2,
  },
  experimental: {
    // Restrict worker counts based on available system memory to prevent freezing
    memoryBasedWorkersCount: true,
    // Optimize heavy packages so Next.js only transforms and holds imported items in RAM
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "clsx",
      "tailwind-merge",
    ],
    // Cap Turbopack memory usage (512 MB)
    turbopackMemoryLimit: 512 * 1024 * 1024,
    // Enable memory optimizations if webpack is used
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
