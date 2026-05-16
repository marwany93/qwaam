import { setRequestLocale } from 'next-intl/server';
import MealsManager from '@/components/admin/content-library/MealsManager';

type PageProps = { params: Promise<{ locale: string }> };

export default async function ContentLibraryMealsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">

      {/* Page header */}
      <header>
        <h1 className="text-3xl font-black text-text-main mb-2">مكتبة الوجبات</h1>
        <p className="text-text-muted font-bold text-sm">
          استكشف وصفات Spoonacular واحفظها لاستخدامها لاحقاً في خطط الوجبات الخاصة بمتدربيك.
        </p>
      </header>

      <MealsManager />
    </div>
  );
}
