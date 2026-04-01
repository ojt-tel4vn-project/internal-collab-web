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

if (process.env.NODE_ENV === "development" && process.env.VERCEL !== "1") {
  void import("@opennextjs/cloudflare")
    .then((module) => module.initOpenNextCloudflareForDev())
    .catch((error) => {
      console.warn("Unable to initialize OpenNext Cloudflare dev context.", error);
    });
}

if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
  import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}
