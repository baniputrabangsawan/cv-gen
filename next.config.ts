import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  // Type checking is the first command in `pnpm build`; this avoids a duplicate
  // Next.js child-process check in restricted build environments.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
