/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  allowedDevOrigins: ['192.168.0.104'],
};


export default nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
// };

// module.exports = nextConfig;