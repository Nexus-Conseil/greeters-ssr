import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    deviceSizes: [390, 480, 640, 768, 844, 1024, 1280, 1366, 1536, 1920, 2560, 3840],
    imageSizes: [64, 96, 128, 160, 200, 256, 320, 400, 520, 840],
    qualities: [60, 70, 76, 100],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
