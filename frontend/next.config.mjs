/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@readmesh/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-markdown'],
  },
};

export default nextConfig;
