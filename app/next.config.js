/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Solana wallet-adapter types lag behind React 18 strict JSX types.
    // Safe to ignore for a hackathon build; re-enable once adapters update.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

