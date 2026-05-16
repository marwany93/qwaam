import { setRequestLocale } from 'next-intl/server';
import MealSearch from '@/components/meals/MealSearch';

type PageProps = { params: Promise<{ locale: string }> };

export default async function AdminMealsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">

      {/* Page header */}
      <header>
        <h1 className="text-3xl font-black text-text-main mb-2">استكشاف الوصفات</h1>
        <p className="text-text-muted font-bold text-sm">
          ابحث في قاعدة بيانات Spoonacular عن وصفات بقيم غذائية كاملة. الحصة اليومية محدودة (50 نقطة)، فاحرص على استخدامها بحكمة.
        </p>
      </header>

      <MealSearch />
    </div>
  );
}
