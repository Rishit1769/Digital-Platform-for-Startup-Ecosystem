import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@startup-ecosystem/shared'],
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
