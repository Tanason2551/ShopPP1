import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - Some versions of Next.js might not have this in the type yet
  allowedDevOrigins: ['192.168.20.231', 'localhost:3000'],
  experimental: {
  }
};

export default nextConfig;
