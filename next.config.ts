import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* react-plotly.js is incompatible with Strict Mode's double-mount in dev:
     it throws "Cannot read properties of undefined (reading '_scrollZoom')"
     when Plotly's resize handler fires on an already-purged chart. */
  reactStrictMode: false,
  /* configure-pages@v5's auto basePath injection doesn't parse next.config.ts,
     so it must be set explicitly to match the GitHub Pages project path. */
  output: "export",
  basePath: "/Research_Reddit",
  images: { unoptimized: true },
};

export default nextConfig;
