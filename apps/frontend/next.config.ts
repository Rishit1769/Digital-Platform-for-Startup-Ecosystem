import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Safely derive __dirname in an ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendOrigin = (process.env.INTERNAL_API_ORIGIN || 'http://127.0.0.1:5000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  transpilePackages: ['@startup-ecosystem/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: '/media',
        destination: `${backendOrigin}/api/media`,
      },
    ];
  },
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
};

export default nextConfig;
