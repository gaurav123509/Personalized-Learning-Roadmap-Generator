const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep dev and prod build artifacts separate to avoid cache corruption.
  distDir: isProd ? '.next-prod' : '.next-dev',
};

export default nextConfig;
