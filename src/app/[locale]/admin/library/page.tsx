import { setRequestLocale } from 'next-intl/server';
import { getExercises, getWorkouts } from '@/actions/library-actions';
import LibraryContent from '@/components/admin/LibraryContent';

type PageProps = { params: Promise<{ locale: string }> };

export default async function LibraryPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Meals are now managed inside the Meals tab by <MealsManager />, which
  // fetches from the `custom_meals` collection on the client. No legacy
  // `meals` fetch needed here.
  const [exercises, workouts] = await Promise.all([
    getExercises(),
    getWorkouts(),
  ]);

  return <LibraryContent exercises={exercises} workouts={workouts} />;
}
