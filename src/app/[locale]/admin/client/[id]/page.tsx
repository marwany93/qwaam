import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin';
import {
  getTraineeDetails,
  getAssignedWorkouts,
  getAssignedMeals,
} from '@/actions/assignment-actions';
import { getWorkouts, getMeals } from '@/actions/library-actions';
import { getTraineeProgressLogsByDate } from '@/actions/progress-actions';
import {
  UserCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import SessionManagerCard from '@/components/admin/SessionManagerCard';
import TraineeTabsWrapper from '@/components/admin/TraineeTabsWrapper';
import { Link } from '@/i18n/navigation';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function TraineeDetailPage({ params }: PageProps) {
  const { locale, id: traineeUid } = await params;
  setRequestLocale(locale);

  // Get coach UID from the session cookie for the chat component
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qwaam_session')?.value!;
  const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  const coachUid = decodedClaims.uid;

  // Parallel fetch — trainee details + both library contents for assignment picker
  const [trainee, allWorkouts, allMeals] = await Promise.all([
    getTraineeDetails(traineeUid),
    getWorkouts(),
    getMeals(),
  ]);

  if (!trainee) notFound();

  const assignedWorkoutIds = trainee.traineeData?.assignedWorkouts ?? [];
  const assignedMealIds = trainee.traineeData?.assignedMeals ?? [];

  const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

  // Resolve IDs to full objects for the Assignments Tab
  const [assignedWorkouts, assignedMeals, progressLogs] = await Promise.all([
    getAssignedWorkouts(assignedWorkoutIds),
    getAssignedMeals(assignedMealIds),
    getTraineeProgressLogsByDate(traineeUid, todayDate)
  ]);

  const joinDate = new Date(trainee.createdAt as number).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm font-bold text-text-muted" aria-label="Breadcrumb" dir="rtl">
        <Link href="/admin" className="hover:text-qwaam-pink transition-colors">
          المتدربون
        </Link>
        <ChevronRightIcon className="w-4 h-4 opacity-40 rotate-180" />
        <span className="text-text-main">{trainee.name}</span>
      </nav>

      {/* ── Top Overview Grid (Profile + Session Management) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trainee Profile Card (Takes 2 columns) */}
        <div className="lg:col-span-2 bg-qwaam-white rounded-3xl border border-border-light shadow-sm flex flex-col overflow-hidden">
          {/* Pink accent stripe */}
          <div className="h-2 bg-gradient-to-r from-qwaam-pink to-pink-300" />
          <div className="p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 h-full" dir="rtl">
            <div className="w-20 h-20 rounded-2xl bg-qwaam-yellow/20 flex items-center justify-center shrink-0 shadow-sm border border-qwaam-yellow/30">
              <UserCircleIcon className="w-12 h-12 text-yellow-600 opacity-80" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-black text-text-main leading-tight">{trainee.name}</h1>
              <p className="text-text-muted font-bold text-base mt-1" dir="ltr" style={{ textAlign: 'right' }}>
                {trainee.email}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-extrabold border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 block animate-pulse" />
                  نشط قيد التدريب
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-text-muted text-xs font-extrabold border border-border-light">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  انضم {joinDate}
                </span>
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div className="bg-qwaam-pink-light rounded-2xl px-6 py-4 border border-qwaam-pink/20">
                <p className="text-3xl font-black text-qwaam-pink">{assignedWorkouts.length}</p>
                <p className="text-xs font-black text-text-muted uppercase tracking-widest mt-1">برامج</p>
              </div>
              <div className="bg-yellow-50 rounded-2xl px-6 py-4 border border-qwaam-yellow/30">
                <p className="text-3xl font-black text-yellow-600">{assignedMeals.length}</p>
                <p className="text-xs font-black text-text-muted uppercase tracking-widest mt-1">وجبات</p>
              </div>
            </div>
          </div>
        </div>

        {/* Session Manager Card (Takes 1 column) */}
        <div className="lg:col-span-1 h-full">
          <SessionManagerCard 
            traineeUid={traineeUid}
            totalSessions={trainee.sessionTracking?.totalSessions ?? 12}
            remainingSessions={trainee.sessionTracking?.remainingSessions ?? 12}
            planStatus={trainee.sessionTracking?.planStatus ?? 'active'}
          />
        </div>

      </div>

      {/* ── Main Tab System Client Wrapper ── */}
      <TraineeTabsWrapper 
        traineeUid={traineeUid}
        traineeName={trainee.name}
        assignedWorkouts={assignedWorkouts}
        assignedMeals={assignedMeals}
        allWorkouts={allWorkouts}
        allMeals={allMeals}
        coachUid={coachUid}
        progressLogs={progressLogs}
      />

    </div>
  );
}
