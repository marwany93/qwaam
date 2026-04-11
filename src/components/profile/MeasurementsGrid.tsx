// src/components/profile/MeasurementsGrid.tsx
// Server component — renders the optional detailed body measurements grid.
import { getTranslations } from 'next-intl/server';

const MEASUREMENT_KEYS = [
  'chest',
  'shoulders',
  'waist',
  'abdomen',
  'glutes',
  'rightThigh',
  'leftThigh',
  'rightCalf',
  'leftCalf',
  'rightArm',
  'leftArm',
] as const;

type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];

interface Props {
  measurements?: Partial<Record<MeasurementKey, number>>;
}

export default async function MeasurementsGrid({ measurements }: Props) {
  const t = await getTranslations('profile');

  const hasAny = measurements && Object.values(measurements).some((v) => v !== undefined && v !== null);

  if (!hasAny) {
    return (
      <p className="text-sm font-bold text-text-muted py-4 text-center">{t('noMeasurements')}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {MEASUREMENT_KEYS.map((key) => {
        const val = measurements?.[key];
        if (val === undefined || val === null) return null;
        return (
          <div
            key={key}
            className="bg-gray-50 rounded-2xl border border-border-light p-3.5 flex flex-col items-center justify-center text-center gap-1"
          >
            <span className="text-xs font-bold text-text-muted">{t(key as any)}</span>
            <span className="text-lg font-black text-text-main leading-none">
              {val}
              <span className="text-xs font-bold text-text-muted ms-0.5">{t('cm')}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
