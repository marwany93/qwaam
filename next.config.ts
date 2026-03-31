import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // حماية Firebase زي ما اتفقنا
  serverExternalPackages: [
    'firebase-admin',
    'firebase-admin/app',
    'firebase-admin/auth',
    'firebase-admin/firestore',
  ],

  // 🚀 البديل الرسمي للـ .htaccess (توجيه مخفي من السيرفر مباشرة)
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/ar',
      },
    ];
  },
};

export default withNextIntl(nextConfig);