/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "*.trycloudflare.com",
  ],
};

module.exports = nextConfig;
