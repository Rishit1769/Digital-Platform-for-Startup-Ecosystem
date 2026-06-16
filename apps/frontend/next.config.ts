import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Safely derive __dirname in an ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  transpilePackages: ['@startup-ecosystem/shared'],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
};

export default nextConfig;
