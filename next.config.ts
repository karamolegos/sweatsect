import type { NextConfig } from "next";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

const nextConfig: NextConfig = {
  // Required for Cloudflare Pages Edge Runtime
  experimental: {},
  // Cloudflare Pages has no Next.js image optimization service — serve
  // product images (sideloaded into WP media at api.sweatsect.com) as-is.
  images: { unoptimized: true },
};

// Set up Cloudflare platform bindings in dev.
// No top-level await — next.config.ts is transpiled to CJS where it's
// invalid; the app only reads env vars (no KV/R2 bindings), so racing is fine.
if (process.env.NODE_ENV === "development") {
  void setupDevPlatform();
}

export default nextConfig;
