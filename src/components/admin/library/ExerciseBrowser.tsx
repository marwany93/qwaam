'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Exercise, TargetMuscle, Equipment } from '@/types';
import {
  MUSCLE_ORDER,
  EQUIPMENT_LIST,
  LEGACY_MUSCLES,
  muscleLabel,
  equipmentLabel,
} from '@/lib/exercise-taxonomy';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';

type Mode = 'view' | 'select';

interface Props {
  exercises: Exercise[];
  mode?: Mode;
  /** view mode */
  onEdit?: (ex: Exercise) => void;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
  /** select mode */
  selectedIds?: Set<string>;
  onToggle?: (ex: Exercise) => void;
}

const LEGACY_SET = new Set<TargetMuscle>(LEGACY_MUSCLES);

/**
 * Reusable muscle-grouped exercise browser. Groups by `targetMuscle` in the
 * canonical MUSCLE_ORDER, hides empty groups, and shows legacy Legs/Arms only
 * if such exercises exist (already last in MUSCLE_ORDER). Secondary equipment
 * filter chips + text search narrow the view.
 *
 * - `view` mode: read-only cards with edit/delete actions (Exercises tab).
 * - `select` mode: clickable cards that toggle membership (workout builder).
 */
export default function ExerciseBrowser({
  exercises,
  mode = 'view',
  onEdit,
  onDelete,
  deletingId,
  selectedIds,
  onToggle,
}: Props) {
  const locale = useLocale();
  const t = useTranslations('library');

  const [search, setSearch] = useState('');
  const [equip, setEquip] = useState<Equipment | 'all'>('all');
  // Accordion: groups open by default; closing adds the muscle to this set.
  const [closed, setClosed] = useState<Set<TargetMuscle>>(new Set());

  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const byMuscle = new Map<TargetMuscle, Exercise[]>();

    for (const ex of exercises) {
      if (
        needle &&
        !(
          ex.nameAr?.toLowerCase().includes(needle) ||
          ex.nameEn?.toLowerCase().includes(needle)
        )
      ) {
        continue;
      }
      if (equip !== 'all' && ex.equipment !== equip) continue;

      const m = (ex.targetMuscle ?? 'Full Body') as TargetMuscle;
      if (!byMuscle.has(m)) byMuscle.set(m, []);
      byMuscle.get(m)!.push(ex);
    }

    // Canonical order, empty groups dropped (legacy already last in MUSCLE_ORDER).
    return MUSCLE_ORDER.filter((m) => byMuscle.has(m)).map((m) => ({
      muscle: m,
      items: byMuscle.get(m)!,
      legacy: LEGACY_SET.has(m),
    }));
  }, [exercises, search, equip]);

  function toggleGroup(m: TargetMuscle) {
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Search + equipment filter ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border-2 border-border-light text-sm font-bold outline-none focus:border-qwaam-pink transition-colors"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={equip === 'all'} onClick={() => setEquip('all')}>
            {t('allEquipment')}
          </FilterChip>
          {EQUIPMENT_LIST.map((eq) => (
            <FilterChip key={eq} active={equip === eq} onClick={() => setEquip(eq)}>
              {equipmentLabel(eq, locale)}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* ── Groups ────────────────────────────────────────────────────────── */}
      {groups.length === 0 ? (
        <div className="py-14 text-center text-text-muted font-bold text-sm">{t('noResults')}</div>
      ) : (
        <div className="space-y-3">
          {groups.map(({ muscle, items, legacy }) => {
            const isOpen = !closed.has(muscle);
            return (
              <div key={muscle} className="border border-border-light rounded-2xl overflow-hidden bg-white">
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(muscle)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-black text-text-main text-sm">{muscleLabel(muscle, locale)}</span>
                    <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-qwaam-pink-light text-qwaam-pink text-[11px] font-black">
                      {items.length}
                    </span>
                    {legacy && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {t('legacyTag')}
                      </span>
                    )}
                  </span>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? '' : '-rotate-90'}`}
                  />
                </button>

                {/* Cards */}
                {isOpen && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((ex) =>
                      mode === 'select' ? (
                        <SelectCard
                          key={ex.id}
                          ex={ex}
                          locale={locale}
                          selected={!!selectedIds?.has(ex.id)}
                          onToggle={() => onToggle?.(ex)}
                          addedLabel={t('added')}
                          statLabels={{ sets: t('sets'), reps: t('reps'), rest: t('rest') }}
                          watchLabel={t('watchVideo')}
                        />
                      ) : (
                        <ViewCard
                          key={ex.id}
                          ex={ex}
                          locale={locale}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          deleting={deletingId === ex.id}
                          statLabels={{ sets: t('sets'), reps: t('reps'), rest: t('rest') }}
                          watchLabel={t('watchVideo')}
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all ${
        active
          ? 'bg-qwaam-pink text-white border-qwaam-pink shadow-sm'
          : 'bg-white text-text-muted border-border-light hover:border-qwaam-pink/40'
      }`}
    >
      {children}
    </button>
  );
}

type StatLabels = { sets: string; reps: string; rest: string };

function CardBody({
  ex,
  locale,
  statLabels,
  watchLabel,
}: {
  ex: Exercise;
  locale: string;
  statLabels: StatLabels;
  watchLabel: string;
}) {
  return (
    <>
      <div>
        <h4 className="font-black text-text-main text-base leading-tight">{ex.nameAr}</h4>
        <p className="text-xs font-bold text-text-muted" dir="ltr">{ex.nameEn}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="bg-gray-100 text-gray-600 text-[11px] font-black px-2.5 py-1 rounded-full">
          {equipmentLabel(ex.equipment, locale)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mt-auto">
        <StatChip label={statLabels.sets} value={String(ex.defaultSets)} />
        <StatChip label={statLabels.reps} value={ex.defaultReps} ltr />
        <StatChip label={statLabels.rest} value={`${ex.defaultRest}ث`} ltr />
      </div>
      {ex.videoUrl && (
        <a
          href={ex.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-bold text-qwaam-pink underline underline-offset-2 hover:text-pink-600 transition-colors"
        >
          ▶ {watchLabel}
        </a>
      )}
    </>
  );
}

function ViewCard({
  ex,
  locale,
  onEdit,
  onDelete,
  deleting,
  statLabels,
  watchLabel,
}: {
  ex: Exercise;
  locale: string;
  onEdit?: (ex: Exercise) => void;
  onDelete?: (id: string) => void;
  deleting?: boolean;
  statLabels: StatLabels;
  watchLabel: string;
}) {
  return (
    <div className="group bg-white rounded-2xl border-2 border-border-light p-5 hover:border-qwaam-pink/40 hover:shadow-md transition-all relative flex flex-col gap-3">
      <div className="absolute top-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        {onEdit && (
          <button
            onClick={() => onEdit(ex)}
            className="p-1.5 rounded-lg text-text-muted hover:text-qwaam-pink hover:bg-qwaam-pink-light transition-colors"
            title="تعديل"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(ex.id)}
            disabled={deleting}
            className="p-1.5 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="حذف"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <CardBody ex={ex} locale={locale} statLabels={statLabels} watchLabel={watchLabel} />
    </div>
  );
}

function SelectCard({
  ex,
  locale,
  selected,
  onToggle,
  addedLabel,
  statLabels,
  watchLabel,
}: {
  ex: Exercise;
  locale: string;
  selected: boolean;
  onToggle: () => void;
  addedLabel: string;
  statLabels: StatLabels;
  watchLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`text-right bg-white rounded-2xl border-2 p-5 transition-all relative flex flex-col gap-3 ${
        selected
          ? 'border-qwaam-pink bg-qwaam-pink-light/40 shadow-md shadow-qwaam-pink/15'
          : 'border-border-light hover:border-qwaam-pink/40 hover:shadow-md'
      }`}
    >
      <span className="absolute top-3 left-3">
        {selected ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-qwaam-pink">
            <CheckSolid className="w-4 h-4" />
            {addedLabel}
          </span>
        ) : (
          <CheckCircleIcon className="w-5 h-5 text-border-light" />
        )}
      </span>
      <CardBody ex={ex} locale={locale} statLabels={statLabels} watchLabel={watchLabel} />
    </button>
  );
}

function StatChip({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="bg-gray-50 border border-border-light/50 rounded-xl py-2 flex flex-col items-center gap-0.5 flex-1">
      <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">{label}</span>
      <span className="font-black text-sm text-text-main" dir={ltr ? 'ltr' : undefined}>{value}</span>
    </div>
  );
}
