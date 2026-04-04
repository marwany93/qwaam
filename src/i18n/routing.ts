import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // اللغات المدعومة
  locales: ['ar', 'en'],

  // اللغة الأساسية
  defaultLocale: 'ar',

  // إخفاء الـ Prefix مع اللغة الأساسية (عشان اللينكات تبقى نضيفة)
  localePrefix: 'as-needed',

  // 👈 التريكة هنا: إجبار الموقع يبدأ بالعربي للكل وتجاهل لغة المتصفح
  localeDetection: false,
});