// src/app/[locale]/client/profile/page.tsx
// Server Component — fetches trainee data and renders the full profile UI.
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  Heart,
  AlertTriangle,
  Flame,
  Dumbbell,
  TrendingUp,
  Scale,
  Ruler,
  FileText,
  Camera,
  Pill,
  Cigarette,
  Baby,
  Users,
} from 'lucide-react';

import { getCurrentTrainee } from '@/actions/client-actions';
import { InfoCard, InfoRow, Badge } from '@/components/profile/InfoCard';
import MeasurementsGrid from '@/components/profile/MeasurementsGrid';
import ImagePreview from '@/components/profile/ImagePreview';
import { Link } from '@/i18n/navigation';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'profile' });
  return { title: t('title') };
}

// ── Goal display helper ───────────────────────────────────────────────────────
const GOAL_ICONS: Record<string, string> = {
  fatBurn: '🔥',
  gainMuscle: '💪',
  gainWeight: '⚡',
};

// ── Chronic diseases i18n key map ─────────────────────────────────────────────
// Matches the keys stored by the onboarding wizard
const CHRONIC_LABELS: Record<string, string> = {
  diabetes: 'ضغط / سكر',
  anemia: 'أنيميا',
  stomachGerms: 'ميكروب المعدة',
  colon: 'قولون',
  stomachUlcers: 'حموضة / قرحة',
  insulinResistance: 'مقاومة الأنسولين',
  pcos: 'تكيسات مبايض',
  thyroid: 'غدة درقية',
  heart: 'أمراض قلب',
  other: 'أخرى',
};

const SUPPLEMENT_LABELS: Record<string, string> = {
  whey: 'بروتين واي',
  creatine: 'كرياتين',
  preWorkout: 'ما قبل التمرين',
  vitamins: 'فيتامينات',
  none: 'لا شيء',
};

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('profile');

  const trainee = await getCurrentTrainee();

  if (!trainee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-2xl">⚠️</div>
        <h2 className="text-xl font-black text-text-main">{t('loadError')}</h2>
        <Link href="/client" className="text-sm font-bold text-qwaam-pink hover:underline">
          العودة للوحة التحكم
        </Link>
      </div>
    );
  }

  // Safely extract onboarding data — may be undefined for coach-created accounts
  const ob = (trainee as any).onboarding ?? {};

  const joinedDate = new Date(trainee.createdAt as number).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // BMI calculation
  const bmi =
    ob.weight && ob.height
      ? (ob.weight / Math.pow(ob.height / 100, 2)).toFixed(1)
      : null;

  const initials = trainee.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('');

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500 max-w-4xl mx-auto">

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-qwaam-pink to-pink-600 rounded-3xl p-8 text-white overflow-hidden shadow-xl shadow-qwaam-pink/20">
        {/* Background blobs */}
        <div className="absolute top-[-40%] end-[-10%] w-72 h-72 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute bottom-[-30%] start-[-5%] w-48 h-48 bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-3xl font-black text-white shadow-lg shrink-0">
            {initials}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black tracking-tight mb-1 truncate">{trainee.name}</h1>
            <p className="text-pink-100 font-bold text-sm flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 shrink-0" />
              <span dir="ltr">{trainee.email}</span>
            </p>
            <p className="text-pink-200 font-bold text-xs flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              {t('joined')}: {joinedDate}
            </p>
          </div>

          {/* Right Section: BMI & Actions */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 shrink-0 self-stretch sm:self-auto justify-end">
            {bmi && (
              <div className="bg-white/15 rounded-2xl px-5 py-3.5 text-center backdrop-blur-sm border border-white/20 w-full sm:w-auto">
                <p className="text-pink-200 text-[10px] font-black uppercase tracking-widest mb-1">{t('bmi')}</p>
                <p className="text-3xl font-black">{bmi}</p>
              </div>
            )}
            <Link href="/client/profile/edit" className="bg-white text-qwaam-pink hover:bg-pink-50 transition-colors rounded-xl px-5 py-2 text-sm font-bold shadow-sm border border-white text-center w-full sm:w-auto">
              {t('editProfile')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Personal Info ── */}
        <InfoCard title={t('personal')} icon={User}>
          <InfoRow label={t('name')} value={trainee.name} />
          <InfoRow label={t('email')} value={trainee.email} />
          <InfoRow label={t('phone')} value={ob.phone} fallback={t('notSet')} />
          <InfoRow
            label={t('dob')}
            value={ob.dateOfBirth
              ? new Date(ob.dateOfBirth).toLocaleDateString('ar-SA')
              : undefined}
            fallback={t('notSet')}
          />
          <InfoRow
            label={t('maritalStatus')}
            value={ob.maritalStatus === 'married' ? t('married') : ob.maritalStatus === 'single' ? t('single') : undefined}
            fallback={t('notSet')}
          />

          {/* Marriage badges */}
          {ob.maritalStatus === 'married' && (
            <div className="flex flex-wrap gap-2 pt-3">
              {ob.isPregnant && (
                <Badge label={t('pregnant')} variant="pink" />
              )}
              {ob.isNursing && (
                <Badge label={t('nursing')} variant="yellow" />
              )}
              {ob.hasChildren && (
                <Badge label={t('hasChildren')} variant="gray" />
              )}
            </div>
          )}
        </InfoCard>

        {/* ── Health Status ── */}
        <InfoCard title={t('health')} icon={Heart} iconColor="text-red-500">
          {/* Injuries */}
          <div className="py-3 border-b border-border-light">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-text-muted flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                {t('injuries')}
              </span>
              <Badge
                label={ob.hasInjuries ? t('yes') : t('no')}
                variant={ob.hasInjuries ? 'red' : 'green'}
              />
            </div>
            {ob.hasInjuries && ob.injuryDetails && (
              <p className="text-xs font-bold text-text-muted bg-gray-50 rounded-xl p-3 mt-2 leading-relaxed border border-border-light">
                {ob.injuryDetails}
              </p>
            )}
          </div>

          {/* Chronic Diseases */}
          <div className="py-3 border-b border-border-light">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-text-muted">{t('chronicDiseases')}</span>
              <Badge
                label={ob.hasChronicDiseases ? t('yes') : t('no')}
                variant={ob.hasChronicDiseases ? 'red' : 'green'}
              />
            </div>
            {ob.hasChronicDiseases && ob.chronicDiseases?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {ob.chronicDiseases.map((key: string) => (
                  <Badge
                    key={key}
                    label={CHRONIC_LABELS[key] ?? key}
                    variant="red"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Smoking */}
          <div className="pt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-text-muted flex items-center gap-2">
              <Cigarette className="w-4 h-4" />
              {t('smoking')}
            </span>
            <Badge
              label={ob.isSmoker ? t('smoker') : t('nonSmoker')}
              variant={ob.isSmoker ? 'red' : 'green'}
            />
          </div>
        </InfoCard>

        {/* ── Goals & Lifestyle ── */}
        <InfoCard title={t('goals')} icon={Flame} iconColor="text-orange-500">
          {/* Goal card */}
          {ob.primaryGoal && (
            <div className="flex items-center gap-4 p-4 bg-qwaam-pink-light rounded-2xl border border-qwaam-pink/20 mb-4">
              <span className="text-3xl">{GOAL_ICONS[ob.primaryGoal] ?? '🎯'}</span>
              <div>
                <p className="text-[10px] font-black text-qwaam-pink uppercase tracking-widest mb-0.5">{t('goal')}</p>
                <p className="font-black text-qwaam-pink text-base">{t(ob.primaryGoal as any)}</p>
              </div>
            </div>
          )}

          {/* Workout days */}
          {ob.workoutDaysPerWeek && (
            <div className="flex items-center justify-between py-3 border-b border-border-light">
              <span className="text-sm font-bold text-text-muted flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                {t('workoutDays')}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-text-main">{ob.workoutDaysPerWeek}</span>
                <span className="text-xs font-bold text-text-muted">{t('daysPerWeek')}</span>
              </div>
            </div>
          )}

          {/* Supplements */}
          {ob.currentSupplements?.length > 0 && (
            <div className="py-3 border-b border-border-light">
              <p className="text-sm font-bold text-text-muted mb-2 flex items-center gap-2">
                <Pill className="w-4 h-4" />
                {t('supplements')}
              </p>
              <div className="flex flex-wrap gap-2">
                {ob.currentSupplements.map((s: string) => (
                  <Badge
                    key={s}
                    label={SUPPLEMENT_LABELS[s] ?? s}
                    variant={s === 'none' ? 'gray' : 'yellow'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          <div className="pt-3">
            <p className="text-sm font-bold text-text-muted mb-2">{t('experience')}</p>
            <p className="text-sm font-bold text-text-main bg-gray-50 rounded-xl p-3 leading-relaxed border border-border-light">
              {ob.sportsExperience || t('noExperience')}
            </p>
          </div>
        </InfoCard>

        {/* ── Body Stats ── */}
        <InfoCard title={t('body')} icon={Scale}>
          {/* Weight / Height pills */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-50 rounded-2xl border border-border-light p-4 text-center">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{t('weight')}</p>
              <p className="text-3xl font-black text-text-main leading-none">
                {ob.weight ?? '—'}
                <span className="text-xs font-bold text-text-muted ms-1">{t('kg')}</span>
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl border border-border-light p-4 text-center">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{t('height')}</p>
              <p className="text-3xl font-black text-text-main leading-none">
                {ob.height ?? '—'}
                <span className="text-xs font-bold text-text-muted ms-1">{t('cm')}</span>
              </p>
            </div>
          </div>

          {/* Body description */}
          {ob.bodyDescription && (
            <div className="mb-4">
              <p className="text-sm font-bold text-text-muted mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t('bodyDesc')}
              </p>
              <p className="text-sm font-bold text-text-main bg-gray-50 rounded-xl p-3 leading-relaxed border border-border-light">
                {ob.bodyDescription}
              </p>
            </div>
          )}
        </InfoCard>

      </div>

      {/* ── Measurements (full width) ────────────────────────────────────────── */}
      <InfoCard title={t('measurements')} icon={Ruler}>
        <MeasurementsGrid measurements={ob.measurements} />
      </InfoCard>

      {/* ── Media Gallery (full width) ───────────────────────────────────────── */}
      <InfoCard title={t('media')} icon={Camera}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-sm font-black text-text-muted mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('inbody')}
            </p>
            <ImagePreview
              src={ob.inbodyUrl ?? ''}
              label={t('inbody')}
              noImageLabel={t('noImage')}
              viewFullLabel={t('viewFull')}
              closeLabel={t('close')}
            />
          </div>
          <div>
            <p className="text-sm font-black text-text-muted mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              {t('bodyPhoto')}
            </p>
            <ImagePreview
              src={ob.bodyPhotoUrl ?? ''}
              label={t('bodyPhoto')}
              noImageLabel={t('noImage')}
              viewFullLabel={t('viewFull')}
              closeLabel={t('close')}
            />
          </div>
        </div>
      </InfoCard>

    </div>
  );
}
