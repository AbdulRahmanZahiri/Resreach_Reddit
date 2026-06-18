import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* react-plotly.js is incompatible with Strict Mode's double-mount in dev:
     it throws "Cannot read properties of undefined (reading '_scrollZoom')"
     when Plotly's resize handler fires on an already-purged chart. */
  reactStrictMode: false,
};

export default nextConfig;
