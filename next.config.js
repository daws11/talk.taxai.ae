/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore warnings about missing package.json in platform-specific packages
    config.infrastructureLogging = {
      level: 'error',
    };
    return config;
  },
  // ... existing code ...
}

module.exports = nextConfig 