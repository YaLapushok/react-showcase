/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://api:42424/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
