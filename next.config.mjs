/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.33.23.146"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
