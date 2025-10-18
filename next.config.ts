import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Permitir build mesmo com erros de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permitir build mesmo com erros de TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
