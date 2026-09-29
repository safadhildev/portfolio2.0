import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config) => {
    config.module.rules.unshift({
      test: /[/\\]icon-sources\.ts$/,
      enforce: "pre",
      loader: path.join(__dirname, "lib/icon-sources-loader.cjs"),
    });
    return config;
  },
};

export default nextConfig;
