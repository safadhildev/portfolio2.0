import type { NextConfig } from "next";
import path from "path";
import { RESUME_FILE } from "./lib/resume.ts";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        source: `/${RESUME_FILE}`,
        headers: [
          {
            key: "Content-Disposition",
            value: `inline; filename="${RESUME_FILE}"`,
          },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
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
