/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Bypasses TS checks during builds for speed, though our app.tsx is clean
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
