'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/solid';
import type { OnboardingData } from '@/types';

interface Props {
  onboarding?: OnboardingData | null;
}

/**
 * Coach-facing "registration info" card on the trainee detail page.
 * Surfaces the FULL onboarding data the trainee entered at signup (or the
 * coach entered on their behalf via addClient): personal, health, goals &
 * training, body/InBody, plus the trained-before answer + previous-guide
 * photos (Issue #5). Display-only, read strictly from the stored `onboarding`
 * object. Missing/optional fields are omitted rather than rendered as blank.
 */
export default function RegistrationCard({ onboarding }: Props) {
  const t = useTranslations('coach');
  const [lightbox, setLightbox] = useState<string | null>(null);
  // Collapsed by default so the card doesn't dominate the trainee detail page.
  const [open, setOpen] = useState(false);

  const o = onboarding ?? {};
  const yesNo = (v?: boolean) => (v ? t('yes') : t('no'));

  const maritalLabel = (v?: string) =>
    v === 'single' ? t('maritalSingle') : v === 'married' ? t('maritalMarried') : undefined;

  const goalLabel = (v?: string) =>
    v === 'fatBurn'
      ? t('goalFatBurn')
      : v === 'gainMuscle'
        ? t('goalGainMuscle')
        : v === 'gainWeight'
          ? t('goalGainWeight')
          : undefined;

  // A labelled read-only row. Renders nothing when `value` is empty so we never
  // show blank rows or raw undefined/null.
  const Row = ({
    label,
    value,
    ltr = false,
    testId,
  }: {
    label: string;
    value?: ReactNode;
    ltr?: boolean;
    testId?: string;
  }) => {
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);
    if (isEmpty) return null;
    return (
      <div
        data-testid={testId}
        className="flex items-start justify-between gap-3 py-2 border-b border-border-light/70 last:border-b-0"
      >
        <span className="text-sm font-bold text-text-muted shrink-0">{label}</span>
        <span
          className="text-sm font-black text-text-main text-left min-w-0 break-words"
          dir={ltr ? 'ltr' : undefined}
        >
          {value}
        </span>
      </div>
    );
  };

  // Section wrapper. Callers gate rendering with an explicit `has*` predicate
  // (a <Row/> element is a truthy object even when it renders null, so we can't
  // auto-detect emptiness from children).
  const Section = ({
    title,
    children,
    testId,
  }: {
    title: string;
    children: ReactNode;
    testId?: string;
  }) => (
    <div data-testid={testId} className="bg-gray-50/60 border border-border-light rounded-2xl px-4 py-3">
      <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
        {title}
      </h4>
      <div>{children}</div>
    </div>
  );

  const Thumb = ({ url, label }: { url?: string; label: string }) => {
    if (!url) return null;
    return (
      <button
        type="button"
        onClick={() => setLightbox(url)}
        className="relative aspect-square w-24 rounded-xl overflow-hidden border border-border-light bg-gray-100 group"
        aria-label={label}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>
    );
  };

  const measurements = o.measurements ?? {};
  const measurementRows: Array<[string, number | undefined]> = [
    [t('mChest'), measurements.chest],
    [t('mShoulders'), measurements.shoulders],
    [t('mWaist'), measurements.waist],
    [t('mAbdomen'), measurements.abdomen],
    [t('mGlutes'), measurements.glutes],
    [t('mRightThigh'), measurements.rightThigh],
    [t('mLeftThigh'), measurements.leftThigh],
    [t('mRightCalf'), measurements.rightCalf],
    [t('mLeftCalf'), measurements.leftCalf],
    [t('mRightArm'), measurements.rightArm],
    [t('mLeftArm'), measurements.leftArm],
  ];
  const presentMeasurements = measurementRows.filter(
    ([, v]) => typeof v === 'number' && !Number.isNaN(v),
  );

  const guidePhotos = (o.previousGuidesPhotos ?? []).filter(Boolean);

  // Per-section presence — render a section only if at least one of its fields
  // carries a value (booleans count when explicitly true/false).
  const isBool = (v: unknown) => typeof v === 'boolean';
  const isNum = (v: unknown) => typeof v === 'number' && !Number.isNaN(v);
  const hasPersonal =
    !!o.dateOfBirth || !!o.phone || !!maritalLabel(o.maritalStatus) ||
    isBool(o.isPregnant) || isBool(o.isNursing) || isBool(o.hasChildren);
  const hasHealth =
    isBool(o.hasInjuries) || !!o.injuryDetails || isBool(o.hasChronicDiseases) ||
    (o.chronicDiseases?.length ?? 0) > 0 || isBool(o.isSmoker);
  const hasGoals =
    !!goalLabel(o.primaryGoal) || isNum(o.workoutDaysPerWeek) || !!o.sportsExperience ||
    (o.currentSupplements?.length ?? 0) > 0 || isBool(o.trainedBefore);
  const hasBody = isNum(o.weight) || isNum(o.height) || !!o.bodyDescription;

  return (
    <>
      <section
        dir="rtl"
        data-testid="coach-registration-card"
        className="bg-white rounded-3xl border border-border-light shadow-sm p-6 sm:p-8 space-y-4"
      >
        {/* Header — click to expand/collapse. Title + icon stay visible. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          data-testid="registration-toggle"
          className="w-full flex items-center gap-3 text-right"
        >
          <span className="w-10 h-10 rounded-2xl bg-qwaam-pink-light text-qwaam-pink flex items-center justify-center border border-qwaam-pink/20 shrink-0">
            <ClipboardDocumentCheckIcon className="w-5 h-5" />
          </span>
          <h3 className="text-lg font-black text-text-main flex-1">{t('registrationTitle')}</h3>
          <ChevronDownIcon
            className={`w-5 h-5 text-text-muted transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
        <div data-testid="coach-onboarding-section" className="space-y-4">
          {/* ── Personal ── */}
          {hasPersonal && (
          <Section title={t('sectionPersonal')} testId="onboarding-section-personal">
            <Row label={t('dateOfBirth')} value={o.dateOfBirth} ltr testId="onboarding-dateOfBirth" />
            <Row label={t('phone')} value={o.phone} ltr testId="onboarding-phone" />
            <Row label={t('maritalStatus')} value={maritalLabel(o.maritalStatus)} testId="onboarding-maritalStatus" />
            {typeof o.isPregnant === 'boolean' && (
              <Row label={t('isPregnant')} value={yesNo(o.isPregnant)} />
            )}
            {typeof o.isNursing === 'boolean' && (
              <Row label={t('isNursing')} value={yesNo(o.isNursing)} />
            )}
            {typeof o.hasChildren === 'boolean' && (
              <Row label={t('hasChildren')} value={yesNo(o.hasChildren)} />
            )}
          </Section>
          )}

          {/* ── Health ── */}
          {hasHealth && (
          <Section title={t('sectionHealth')} testId="onboarding-section-health">
            {typeof o.hasInjuries === 'boolean' && (
              <Row label={t('hasInjuries')} value={yesNo(o.hasInjuries)} />
            )}
            {o.hasInjuries === true && (
              <Row label={t('injuryDetails')} value={o.injuryDetails} />
            )}
            {typeof o.hasChronicDiseases === 'boolean' && (
              <Row label={t('hasChronicDiseases')} value={yesNo(o.hasChronicDiseases)} />
            )}
            {o.hasChronicDiseases === true && (
              <Row label={t('chronicDiseases')} value={(o.chronicDiseases ?? []).join('، ')} />
            )}
            {typeof o.isSmoker === 'boolean' && (
              <Row label={t('isSmoker')} value={yesNo(o.isSmoker)} />
            )}
          </Section>
          )}

          {/* ── Goals & Training ── */}
          {hasGoals && (
          <Section title={t('sectionGoals')} testId="onboarding-section-goals">
            <Row label={t('primaryGoal')} value={goalLabel(o.primaryGoal)} testId="onboarding-primaryGoal" />
            <Row
              label={t('workoutDaysPerWeek')}
              value={typeof o.workoutDaysPerWeek === 'number' ? o.workoutDaysPerWeek : undefined}
              ltr
              testId="onboarding-workoutDaysPerWeek"
            />
            <Row label={t('sportsExperience')} value={o.sportsExperience} />
            <Row label={t('currentSupplements')} value={(o.currentSupplements ?? []).join('، ')} />
            <Row label={t('trainedBeforeQuestion')} value={typeof o.trainedBefore === 'boolean' ? yesNo(o.trainedBefore) : undefined} />
          </Section>
          )}

          {/* ── Body & measurements ── */}
          {hasBody && (
          <Section title={t('sectionBody')} testId="onboarding-section-body">
            <Row
              label={t('weight')}
              value={typeof o.weight === 'number' ? o.weight : undefined}
              ltr
            />
            <Row
              label={t('height')}
              value={typeof o.height === 'number' ? o.height : undefined}
              ltr
            />
            <Row label={t('bodyDescription')} value={o.bodyDescription} />
          </Section>
          )}

          {/* ── Measurements grid (only present values) ── */}
          {presentMeasurements.length > 0 && (
            <div
              data-testid="onboarding-section-measurements"
              className="bg-gray-50/60 border border-border-light rounded-2xl px-4 py-3"
            >
              <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-2">
                {t('measurementsTitle')}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {presentMeasurements.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-2 bg-white border border-border-light rounded-lg px-3 py-1.5"
                  >
                    <span className="text-xs font-bold text-text-muted">{label}</span>
                    <span className="text-sm font-black text-text-main" dir="ltr">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Images: InBody + body photo ── */}
          {(o.inbodyUrl || o.bodyPhotoUrl) && (
            <div className="bg-gray-50/60 border border-border-light rounded-2xl px-4 py-3">
              <div className="flex flex-wrap gap-4">
                {o.inbodyUrl && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-black text-text-muted">{t('inbody')}</p>
                    <Thumb url={o.inbodyUrl} label={t('inbody')} />
                  </div>
                )}
                {o.bodyPhotoUrl && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-black text-text-muted">{t('bodyPhoto')}</p>
                    <Thumb url={o.bodyPhotoUrl} label={t('bodyPhoto')} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Previous-guide photos (only when trained before) ── */}
          {o.trainedBefore === true && (
            <div
              data-testid="coach-guide-photos"
              className="bg-gray-50/60 border border-border-light rounded-2xl px-4 py-3"
            >
              <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-3">
                {t('previousGuidesTitle')}
              </h4>
              {guidePhotos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {guidePhotos.map((url, i) => (
                    <Thumb key={i} url={url} label={`${t('previousGuidesTitle')} ${i + 1}`} />
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-text-muted">{t('noPreviousGuides')}</p>
              )}
            </div>
          )}
        </div>
        )}
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors"
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt="preview"
              className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
