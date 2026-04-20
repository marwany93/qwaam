import { setRequestLocale } from 'next-intl/server';
import { getExercises, getWorkouts, getMeals } from '@/actions/library-actions';
import LibraryContent from '@/components/admin/LibraryContent';

type PageProps = { params: Promise<{ locale: string }> };

export default async function LibraryPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch all three collections in parallel for fastest load
  const [exercises, workouts, meals] = await Promise.all([
    getExercises(),
    getWorkouts(),
    getMeals(),
  ]);

  return <LibraryContent exercises={exercises} workouts={workouts} meals={meals} />;
}
