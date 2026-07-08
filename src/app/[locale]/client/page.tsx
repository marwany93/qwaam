import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getCurrentTrainee, fetchMyWorkouts, fetchMyMeals, getProgressHistory } from '@/actions/client-actions';
import { getAssignedMealPlan } from '@/actions/meal-plan-actions';
import { getMyProgressLogsByDate } from '@/actions/progress-actions';
import { normalizeMealRow } from '@/lib/meal-utils';
import MealPlanTable from '@/components/client/MealPlanTable';
import ClientChat from '@/components/client/ClientChat';
import ProgressToggleButton from '@/components/client/ProgressToggleButton';
import RenewalWizard from '@/components/client/RenewalWizard';
import WorkoutVideoButton from '@/components/client/WorkoutVideoButton';
import PendingPaymentBanner from '@/components/client/PendingPaymentBanner';
import ProgressLogTrigger from '@/components/client/ProgressLogTrigger';
import TraineeWeightChartCard from '@/components/client/TraineeWeightChartCard';
import ProgressGallery from '@/components/client/ProgressGallery';
import ReLoginButton from '@/components/client/ReLoginButton';
import SessionAlert from '@/components/client/SessionAlert';
import ScheduleAlert from '@/components/client/ScheduleAlert';
import ScheduleStatusCard from '@/components/client/ScheduleStatusCard';
import DashboardTabs from '@/components/client/DashboardTabs';
import { ONE_DAY_MS, formatDateRiyadh } from '@/lib/date-utils';
// import { getAdminAuth } from '@/lib/firebase-admin';

type PageProps = { params: Promise<{ locale: string }> };

export default async function ClientDashboard({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Core Data Fetch using isolated secure backend actions
  const trainee = await getCurrentTrainee();

  if (!trainee) {
    return (
      <div className="text-center py-24 flex flex-col items-center justify-center gap-5" dir="rtl">
        <span className="text-5xl">🔌</span>
        <h2 className="text-3xl font-black text-text-main">اتصال غير مستقر</h2>
        <p className="text-text-muted font-bold text-base max-w-md">
          يرجى تسجيل الدخول مرة أخرى للوصول لبياناتك. هذا يحدث عادةً عند انتهاء الجلسة بعد فترة طويلة من عدم النشاط.
        </p>
        <ReLoginButton />
      </div>
    );
  }

  // Safe Arrays
  const assignedWorkoutIds = trainee.traineeData?.assignedWorkouts || [];
  const assignedMealIds = trainee.traineeData?.assignedMeals || [];
  const coachUid = trainee.traineeData?.assignedCoachUid || '';

  const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });

  // Parallel Document Materializations
  const [workouts, meals, progressLogs, progressHistoryRes, mealPlanRes] = await Promise.all([
    fetchMyWorkouts(assignedWorkoutIds),
    fetchMyMeals(assignedMealIds),
    getMyProgressLogsByDate(todayDate),
    getProgressHistory(),
    getAssignedMealPlan(),
  ]);
  const weightHistory = progressHistoryRes.data ?? [];

  // ── Nutrition (Path B): gated meal-plan read + localized copy ────────────────
  const t = await getTranslations('nutrition');
  const dietAdded = mealPlanRes.dietAdded;
  const mealPlan = mealPlanRes.plan;
  const mealDoneIds = progressLogs.filter(p => p.type === 'meal').map(p => p.itemId);
  const mealDoneSet = new Set(mealDoneIds);

  const firstName = trainee.name.split(' ')[0] || 'بطل';

  // Completion counts derived from today's server-fetched progress logs
  const completedWorkouts = progressLogs.filter(p => p.type === 'workout').length;

  // Meal-progress source for the "today" summary mirrors the gated Diet Module:
  //   locked → hidden; plan present → its first day's rows; else legacy assignedMeals.
  let mealsTotal = 0;
  let mealsCompleted = 0;
  if (!dietAdded) {
    mealsTotal = 0;
    mealsCompleted = 0;
  } else if (mealPlan) {
    const firstDayRows = (mealPlan.days[0]?.meals ?? []).map((m, i) => normalizeMealRow(m, 0, i));
    mealsTotal = firstDayRows.length;
    mealsCompleted = firstDayRows.filter(r => mealDoneSet.has(`plan:${mealPlan.id}:${r.id}`)).length;
  } else {
    mealsTotal = meals.length;
    mealsCompleted = progressLogs.filter(p => p.type === 'meal').length;
  }

  // Maps Firestore meal type keys → Arabic label + motivating emoji
  const mealTypeMap: Record<string, { label: string; icon: string }> = {
    breakfast: { label: 'إفطار',       icon: '🌅' },
    lunch:     { label: 'غداء',        icon: '☀️' },
    dinner:    { label: 'عشاء',        icon: '🌙' },
    snack:     { label: 'وجبة خفيفة', icon: '🍎' },
  };

  const isPendingPayment = trainee.traineeData?.subscription?.status === 'pending_payment';

  // ── Month-based Schedule (duration model) derived state ──────────────────────
  // Only Schedule plans on the new model carry billingModel='duration'. Legacy
  // schedule clients (no marker) fall through to the session-count UI below.
  const sub = trainee.traineeData?.subscription;
  const isDurationSchedule = sub?.billingModel === 'duration';
  const scheduleStartAt = sub?.scheduleStartAt ?? null;
  const scheduleEndsAt = sub?.scheduleEndsAt ?? null;
  const nowMs = Date.now();

  const scheduleAwaiting = isDurationSchedule && scheduleStartAt == null;
  const msLeft = scheduleEndsAt != null ? scheduleEndsAt - nowMs : null;
  const scheduleEnded = isDurationSchedule && scheduleEndsAt != null && nowMs >= scheduleEndsAt;
  const scheduleAboutToEnd =
    isDurationSchedule && msLeft != null && msLeft > 0 && msLeft <= 7 * ONE_DAY_MS;
  const scheduleDaysRemaining = msLeft != null && msLeft > 0 ? Math.ceil(msLeft / ONE_DAY_MS) : 0;
  const scheduleTotalDays =
    scheduleStartAt != null && scheduleEndsAt != null
      ? Math.max(1, Math.round((scheduleEndsAt - scheduleStartAt) / ONE_DAY_MS))
      : 0;
  const scheduleProgressPct =
    scheduleTotalDays > 0
      ? Math.min(100, Math.max(0, Math.round(((scheduleTotalDays - scheduleDaysRemaining) / scheduleTotalDays) * 100)))
      : 0;
  const scheduleStartStr = scheduleStartAt != null ? formatDateRiyadh(scheduleStartAt, locale) : null;
  const scheduleEndStr = scheduleEndsAt != null ? formatDateRiyadh(scheduleEndsAt, locale) : null;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10" data-testid="client-dashboard">

      {/* ── Top alert — pending payment > schedule date alert > session balance ── */}
      {isPendingPayment ? (
        <PendingPaymentBanner
          amountPaid={trainee.traineeData?.subscription?.amountPaid}
          initialScreenshotUrl={trainee.traineeData?.subscription?.paymentScreenshotUrl}
        />
      ) : isDurationSchedule ? (
        // Date-based alert for month plans — only when ending within 7 days or ended
        (scheduleEnded || scheduleAboutToEnd) && scheduleEndStr && (
          <ScheduleAlert endDate={scheduleEndStr} ended={scheduleEnded} />
        )
      ) : (
        trainee.sessionTracking && (
          <SessionAlert sessionsRemaining={trainee.sessionTracking.remainingSessions ?? 0} />
        )
      )}

      {/* ── Graphic Greeting Banner ── */}
      <div className="bg-qwaam-pink rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-qwaam-pink/20 relative overflow-hidden flex flex-col justify-center">
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute top-[20%] right-[30%] w-48 h-48 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 leading-relaxed md:w-2/3">
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">أهلاً بك يا {firstName}! ⚡</h1>
          <p className="text-lg sm:text-2xl font-bold opacity-90 leading-tight">
            هذه بوابتك الخاصة. تتبع برامجك، وخطتك الغذائية، وتواصل مع مدربك مباشرة.
          </p>
        </div>
      </div>

      {/* ── Tabbed dashboard — switches between "Today" + "My Progress" ── */}
      <DashboardTabs
        todayContent={
          <>
      {/* Daily Progress Summary — high priority, top of Today tab */}
      {(workouts.length > 0 || mealsTotal > 0) && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm" dir="rtl">
          <h2 className="text-base font-black text-text-main mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-qwaam-pink-light flex items-center justify-center text-sm border border-qwaam-pink/20">📊</span>
            تقدم اليوم
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Workouts progress bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-text-muted uppercase tracking-wider">التمارين</span>
                <span className="text-sm font-black text-qwaam-pink">
                  {completedWorkouts} <span className="text-text-muted font-bold">/ {workouts.length}</span>
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-qwaam-pink rounded-full transition-all duration-500"
                  style={{ width: workouts.length === 0 ? '0%' : `${Math.round((completedWorkouts / workouts.length) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] font-bold text-text-muted mt-1.5">
                {completedWorkouts === workouts.length && workouts.length > 0
                  ? '🎉 أنجزت جميع تمارين اليوم!'
                  : `${workouts.length - completedWorkouts} تمرين متبقي`}
              </p>
            </div>

            {/* Meals progress bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-text-muted uppercase tracking-wider">الوجبات</span>
                <span className="text-sm font-black text-yellow-600">
                  {mealsCompleted} <span className="text-text-muted font-bold">/ {mealsTotal}</span>
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: mealsTotal === 0 ? '0%' : `${Math.round((mealsCompleted / mealsTotal) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] font-bold text-text-muted mt-1.5">
                {mealsCompleted === mealsTotal && mealsTotal > 0
                  ? '🎉 التزمت بكل وجباتك اليوم!'
                  : `${mealsTotal - mealsCompleted} وجبة متبقية`}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ── 2x1 Desktop Grid: training plan + live chat ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Center Content: Interactive Cards */}
        <div className="lg:col-span-2 space-y-12">

          {/* ── Month-based Schedule widget (duration model) — replaces the session
                 widget for these plans. Hidden while pending payment. ── */}
          {isDurationSchedule && !isPendingPayment && (
            <ScheduleStatusCard
              uid={trainee.uid}
              awaiting={scheduleAwaiting}
              ended={scheduleEnded}
              aboutToEnd={scheduleAboutToEnd}
              startDate={scheduleStartStr}
              endDate={scheduleEndStr}
              daysRemaining={scheduleDaysRemaining}
              progressPct={scheduleProgressPct}
            />
          )}

          {/* ── Trainee Session Progress Widget ── (Live + legacy session model) */}
          {!isDurationSchedule && trainee.sessionTracking && trainee.sessionTracking.totalSessions > 0 && (
            <section className="bg-qwaam-white rounded-3xl border border-border-light shadow-sm p-6 sm:p-8 relative overflow-hidden group">
              {/* Background decoration */}
              <div className="absolute top-0 end-0 w-32 h-32 bg-qwaam-pink-light rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                    <span className="text-2xl">⏳</span>
                    متابعة باقتك الحالية
                  </h2>
                  <p className="text-sm font-bold text-text-muted mt-1">
                    {trainee.sessionTracking.planStatus === 'finished'
                      ? 'لقد انتهت باقتك، يرجى التجديد للاستمرار'
                      : 'تابع استهلاك حصصك المتبقية'}
                  </p>
                </div>
                <div className="bg-gray-50 border border-border-light rounded-2xl px-5 py-3 text-center min-w-[120px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">المتبقي</p>
                  <p className={`text-2xl font-black leading-none ${trainee.sessionTracking.remainingSessions <= 2 ? 'text-red-500' : 'text-qwaam-pink'}`}>
                    {trainee.sessionTracking.remainingSessions} <span className="text-sm font-bold text-text-muted">حصص</span>
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black text-text-muted">
                  <span>اكتمل: {trainee.sessionTracking.totalSessions - trainee.sessionTracking.remainingSessions}</span>
                  <span>الإجمالي: {trainee.sessionTracking.totalSessions}</span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner flex" dir="ltr">
                  <div
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${trainee.sessionTracking.planStatus === 'finished' ? 'bg-green-500' : 'bg-gradient-to-r from-pink-400 to-qwaam-pink'}`}
                    style={{ width: `${((trainee.sessionTracking.totalSessions - trainee.sessionTracking.remainingSessions) / trainee.sessionTracking.totalSessions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Renewal wizard — shown when plan is finished or ≤2 sessions remain */}
              {(trainee.sessionTracking.planStatus === 'finished' || trainee.sessionTracking.remainingSessions <= 2) && (
                isPendingPayment
                  ? null
                  : <RenewalWizard uid={trainee.uid} />
              )}
            </section>
          )}

          {/* Workouts Module */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-qwaam-pink-light rounded-2xl flex items-center justify-center text-xl shrink-0 border border-qwaam-pink/20 text-qwaam-pink font-black shadow-sm">
                🏋️‍♂️
              </div>
              <h2 className="text-2xl font-black text-text-main">برامجك التدريبية المعينة</h2>
            </div>

            {workouts.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-dashed border-border-light text-center flex flex-col items-center justify-center min-h-[220px]">
                <span className="text-4xl opacity-50 grayscale mb-4">🕒</span>
                <p className="font-bold text-text-muted text-sm max-w-[200px]">مدربك يقوم بتجهيز خطتك الرياضية الآن...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {workouts.map(w => (
                  <div key={w.id} className="bg-white rounded-3xl p-6 border border-border-light shadow-sm hover:border-qwaam-pink hover:shadow-md hover:-translate-y-1 transition-all group">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="font-extrabold text-lg text-text-main truncate group-hover:text-qwaam-pink transition-colors">{w.titleAr}</h3>
                      <span className="shrink-0 bg-qwaam-pink-light text-qwaam-pink px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">{w.difficulty}</span>
                    </div>
                    <p className="font-bold text-xs text-text-muted mb-6 truncate" dir="ltr" style={{ textAlign: "right" }}>{w.titleEn}</p>

                    <div className="flex items-center justify-between text-sm bg-gray-50 px-5 py-3.5 rounded-2xl border border-border-light/50 mb-4">
                      <div className="font-black text-text-main flex items-center gap-2"><span className="text-qwaam-pink text-lg text-shadow-sm">⏱</span> {w.duration} دقيقة</div>
                      <div className="font-extrabold text-text-muted px-3 py-1 bg-white rounded-lg border border-border-light">{w.exercises?.length || 0} حركات</div>
                    </div>

                    {/* Exercise list with optional video links */}
                    {w.exercises && w.exercises.length > 0 && (
                      <ul className="space-y-2 mb-4">
                        {w.exercises.map((ex, idx) => (
                          <li key={ex.exerciseId || idx} className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded-xl px-3 py-2 border border-border-light/50">
                            <span className="font-bold text-text-main truncate">{ex.nameAr || ex.exerciseId}</span>
                            <div className="flex items-center gap-2 shrink-0 text-xs font-bold text-text-muted">
                              <span>{ex.sets}×{ex.reps}</span>
                              {ex.videoUrl && (
                                <WorkoutVideoButton
                                  videoUrl={ex.videoUrl}
                                  exerciseName={ex.nameAr || ex.exerciseId}
                                />
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <ProgressToggleButton
                      itemId={w.id}
                      type="workout"
                      date={todayDate}
                      initialState={progressLogs.some(log => log.itemId === w.id && log.type === 'workout')}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Diet Module — gated behind the +200 EGP nutrition add-on (dietAdded).
                Enforcement point #2 (getAssignedMealPlan is #1). */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-50 rounded-2xl flex items-center justify-center text-xl shrink-0 border border-yellow-200 text-yellow-600 font-black shadow-sm">
                🥗
              </div>
              <h2 className="text-2xl font-black text-text-main">{t('sectionTitle')}</h2>
            </div>

            {!dietAdded ? (
              /* Locked / upsell — nutrition add-on not purchased */
              <div className="bg-white rounded-3xl p-8 border border-dashed border-qwaam-pink/30 text-center flex flex-col items-center justify-center min-h-[220px]" dir="rtl" data-testid="nutrition-locked">
                <span className="text-4xl mb-4">🔒</span>
                <h3 className="font-black text-text-main text-lg mb-2">{t('lockedTitle')}</h3>
                <p className="font-bold text-text-muted text-sm max-w-md mx-auto">{t('locked')}</p>
              </div>
            ) : mealPlan ? (
              /* Path B — assigned meal plan as a table */
              <MealPlanTable plan={mealPlan} todayDate={todayDate} completedItemIds={mealDoneIds} />
            ) : meals.length === 0 ? (
              /* dietAdded but nothing assigned yet — awaiting state */
              <div className="bg-white rounded-3xl p-8 border border-dashed border-border-light text-center flex flex-col items-center justify-center min-h-[220px]">
                <span className="text-4xl opacity-50 grayscale mb-4">🕒</span>
                <p className="font-bold text-text-muted text-sm max-w-[200px]">{t('awaiting')}</p>
              </div>
            ) : (
              /* Grandfather fallback — legacy assignedMeals cards (no plan yet) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {meals.map(m => (
                  <div key={m.id} className="bg-white rounded-3xl border border-border-light shadow-sm flex flex-col overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="h-1.5 w-full bg-qwaam-yellow transition-all" />
                    <div className="p-6">
                      {/* Meal type badge — shows breakfast / lunch / dinner / snack */}
                      {m.type && mealTypeMap[m.type] && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-text-muted mb-2">
                          {mealTypeMap[m.type].icon} {mealTypeMap[m.type].label}
                        </span>
                      )}
                      <h3 className="font-extrabold text-lg text-text-main truncate mb-1">{m.nameAr}</h3>
                      <p className="font-bold text-xs text-text-muted mb-5 truncate" dir="ltr" style={{ textAlign: "right" }}>{m.nameEn}</p>

                      <div className="flex justify-between items-center bg-gray-50 border border-border-light/50 rounded-2xl p-4 mb-5 shadow-inner">
                        <span className="font-bold text-xs text-text-muted uppercase tracking-widest">مجموع الطاقة</span>
                        <span className="font-black text-xl text-text-main bg-white px-3 py-1.5 rounded-xl border border-border-light shadow-sm">{m.calories} <span className="text-[10px] uppercase text-text-muted ml-0.5">Kcal</span></span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-5">
                        <div className="bg-red-50 text-red-700 py-2.5 rounded-xl text-center leading-tight">
                          <span className="block text-[9px] uppercase font-black opacity-60 mb-1">PROTEIN</span>
                          <span className="font-black text-sm">{m.macros.protein}g</span>
                        </div>
                        <div className="bg-green-50 text-green-700 py-2.5 rounded-xl text-center leading-tight">
                          <span className="block text-[9px] uppercase font-black opacity-60 mb-1">CARBS</span>
                          <span className="font-black text-sm">{m.macros.carbs}g</span>
                        </div>
                        <div className="bg-yellow-50 text-yellow-700 py-2.5 rounded-xl text-center leading-tight">
                          <span className="block text-[9px] uppercase font-black opacity-60 mb-1">FATS</span>
                          <span className="font-black text-sm">{m.macros.fats}g</span>
                        </div>
                      </div>

                      <ProgressToggleButton
                        itemId={m.id}
                        type="meal"
                        date={todayDate}
                        initialState={progressLogs.some(log => log.itemId === m.id && log.type === 'meal')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Floating Live Chat Module */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 space-y-4">
            <h2 className="text-xl font-black text-text-main flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-qwaam-pink-light flex items-center justify-center text-lg text-qwaam-pink border border-qwaam-pink/20 shadow-sm">
                📱
              </span>
              الدعم المباشر
            </h2>
            <ClientChat coachUid={coachUid} traineeUid={trainee.uid} traineeName={trainee.name} />
          </div>
        </div>

      </div>
          </>
        }
        progressContent={
          <>
            {/* Weight chart — featured at the top of the Progress tab */}
            <TraineeWeightChartCard initialData={weightHistory} />

            {/* Privacy-blurred Before/After gallery */}
            <ProgressGallery entries={weightHistory} title="صور تقدمك" />

            {/* Log-entry trigger — last so it acts as the closing CTA */}
            <ProgressLogTrigger />
          </>
        }
      />

    </div>
  );
}
