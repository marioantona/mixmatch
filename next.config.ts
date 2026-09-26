import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: let a second origin (two-profile group testing) and phones on the LAN load dev resources.
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
