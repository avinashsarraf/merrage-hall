import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // self-contained server.js for the Docker/production image
  output: "standalone",
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
