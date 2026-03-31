import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for React
  reactStrictMode: true,

  // Prevent firebase-admin and its native WASM binaries from being
  // bundled by the Next.js/Webpack edge bundler. Must stay as external
  // Node.js require() calls resolved at runtime by the Node process.
  serverExternalPackages: [
    'firebase-admin',
    'firebase-admin/app',
    'firebase-admin/auth',
    'firebase-admin/firestore',
  ],
};

export default withNextIntl(nextConfig);
