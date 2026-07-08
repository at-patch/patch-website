import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
