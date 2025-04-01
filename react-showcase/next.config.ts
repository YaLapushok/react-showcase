import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://api:42424/:path*",
            },
        ];
    }
};

export default nextConfig;
