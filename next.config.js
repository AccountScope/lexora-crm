/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  transpilePackages: ["lucide-react"],
  reactStrictMode: true,
};

module.exports = nextConfig;
