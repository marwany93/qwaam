import { setRequestLocale } from 'next-intl/server';
import { getWorkouts, getMeals } from '@/actions/library-actions';
import LibraryContent from '@/components/admin/LibraryContent';

type PageProps = { params: Promise<{ locale: string }> };

export default async function LibraryPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Securely fetch both content databases directly via the Next.js Server App process
  // Promises run in parallel yielding fastest rendering
  const [workouts, meals] = await Promise.all([
    getWorkouts(),
    getMeals()
  ]);

  return <LibraryContent workouts={workouts} meals={meals} />;
}
