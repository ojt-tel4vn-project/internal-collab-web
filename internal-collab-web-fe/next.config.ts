import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.betterup.com",
        pathname: "/hubfs/**",
      },
      {
        protocol: "https",
        hostname: "betterup.com",
        pathname: "/hubfs/**",
      },
    ],
  },
};

if (process.env.NODE_ENV === "development" && process.env.VERCEL !== "1") {
  const importOpenNextCloudflare = new Function(
    "specifier",
    "return import(specifier)",
  ) as (specifier: string) => Promise<{ initOpenNextCloudflareForDev?: () => void }>;

  void importOpenNextCloudflare("@opennextjs/cloudflare")
    .then((module) => module.initOpenNextCloudflareForDev?.())
    .catch((error) => {
      console.warn("Unable to initialize OpenNext Cloudflare dev context.", error);
    });
}

export default nextConfig;
