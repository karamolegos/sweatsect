import type { NextConfig } from "next";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

const nextConfig: NextConfig = {
  // Required for Cloudflare Pages Edge Runtime
  experimental: {},
};

// Set up Cloudflare platform bindings in dev
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

export default nextConfig;
