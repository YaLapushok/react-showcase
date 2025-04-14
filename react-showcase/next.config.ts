import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/v0/:path*",
                destination: "http://api:42424/api/v0/:path*",
            },
        ];
    }
};

export default nextConfig;
