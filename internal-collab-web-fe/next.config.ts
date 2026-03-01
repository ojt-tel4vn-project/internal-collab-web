import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.betterup.com",
        pathname: "/hubfs/**",
      },
    ],
  },
};

export default nextConfig;
