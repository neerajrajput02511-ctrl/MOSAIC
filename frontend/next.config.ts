import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS === "true";
const repoName = "MOSAIC";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? (isGithubPages ? `/${repoName}` : ""),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
