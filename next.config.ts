import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The persistent Turbopack build cache can contain serialized compiler
  // inputs, including values from the build environment. It is not needed in
  // CI and can cause Netlify's secret scanner to inspect stale secret values.
  experimental: {
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
