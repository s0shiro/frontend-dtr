const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${BACKEND_BASE_URL}/api/auth/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_BASE_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
