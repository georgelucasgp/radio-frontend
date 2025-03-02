/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // Configuração para resolver problemas com WebSocket na Vercel
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        bufferutil: require.resolve('bufferutil'),
        'utf-8-validate': require.resolve('utf-8-validate'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
