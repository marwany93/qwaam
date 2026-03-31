import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for React
  reactStrictMode: true,

  // Experimental features
  experimental: {
    // Server Actions are enabled by default in Next.js 14+
  },
};

export default withNextIntl(nextConfig);
