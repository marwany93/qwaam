'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { QwaamUser } from '@/types';
import AssignCoachDropdown from '@/components/admin/AssignCoachDropdown';
import DeleteUserModal from '@/components/admin/DeleteUserModal';
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface Coach {
  uid: string;
  name: string;
}

interface Props {
  trainees: QwaamUser[];
  coaches: Coach[];
  adminUid: string;
  locale: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

/**
 * Global trainees management — search + paginate + assign coach.
 * Data arrives pre-sorted (newest first) from the Server Component via
 * getTrainees() which uses orderBy('createdAt', 'desc'). All filtering
 * happens locally on this already-sorted array.
 */
export default function TraineesManager({ trainees, coaches, adminUid, locale }: Props) {
  const t = useTranslations();

  // Local mirror of the prop so we can optimistically remove rows on delete
  // without waiting for a Server Component re-render.
  const [localTrainees, setLocalTrainees] = useState<QwaamUser[]>(trainees);
  // Keep local state in sync if the parent prop changes (e.g. router.refresh()).
  useEffect(() => { setLocalTrainees(trainees); }, [trainees]);

  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);

  // Hard-delete modal target
  const [toDelete, setToDelete] = useState<QwaamUser | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return localTrainees;
    return localTrainees.filter((tr) =>
      tr.name?.toLowerCase().includes(needle) || tr.email?.toLowerCase().includes(needle),
    );
  }, [localTrainees, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paged = filtered.slice(pageStart, pageStart + pageSize);

  // Reset to page 1 when filter/page-size changes
  useEffect(() => { setPage(1); }, [search, pageSize]);

  // ── Empty: no trainees at all ─────────────────────────────
  if (localTrainees.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-border-light shadow-sm" dir="rtl">
        <span className="text-5xl block grayscale opacity-50 mb-3">👥</span>
        <p className="font-bold text-text-muted">{t('admin.noTraineesFound')}</p>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden flex flex-col" dir="rtl">

      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-border-light bg-gray-50/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحثي بالاسم أو البريد..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white border border-border-light focus:border-qwaam-pink focus:ring-0 outline-none text-sm font-bold transition-colors"
          />
        </div>

        {/* Page size */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-black text-text-muted whitespace-nowrap">عرض</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
            className="px-3 py-2 rounded-xl bg-white border border-border-light focus:border-qwaam-pink outline-none text-sm font-black"
          >
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-xs font-black text-text-muted whitespace-nowrap">لكل صفحة</span>
        </div>
      </div>

      {/* Filtered-empty state */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-text-muted">
          <p className="font-bold text-sm">لم نجد متدرّبة تطابق &quot;{search}&quot;.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right bg-white text-sm">
              <thead className="bg-gray-50 border-b border-border-light text-text-muted text-[11px] uppercase font-black tracking-wider">
                <tr>
                  <th className="px-5 py-3">{t('admin.name')}</th>
                  <th className="px-5 py-3">{t('admin.email')}</th>
                  <th className="px-5 py-3 w-40">{t('admin.primaryGoal')}</th>
                  <th className="px-5 py-3 w-72 text-left">{t('admin.coach')}</th>
                  <th className="px-5 py-3 w-16 text-left">{t('admin.actions')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border-light">
                {paged.map((trainee) => {
                  const ob = (trainee as any).onboarding || {};
                  const isAssigned = !!trainee.traineeData?.assignedCoachUid;
                  const assignedCoach = coaches.find((c) => c.uid === trainee.traineeData?.assignedCoachUid);

                  return (
                    <tr
                      key={trainee.uid}
                      className={`transition-colors ${
                        isAssigned
                          ? 'hover:bg-qwaam-pink-light/15'
                          : 'bg-red-50/40 hover:bg-red-50/80 border-s-4 border-red-400'
                      }`}
                    >
                      {/* Name + join date */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-extrabold text-text-main">{trainee.name}</div>
                          {!isAssigned && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-md whitespace-nowrap">
                              {t('admin.pendingAssignment')}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-muted mt-1 font-bold">
                          {new Date(trainee.createdAt as number).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 text-[12px] font-bold text-text-main" dir="ltr" style={{ textAlign: 'right' }}>
                        {trainee.email}
                      </td>

                      {/* Goal */}
                      <td className="px-5 py-3.5">
                        {ob.primaryGoal ? (
                          <span className="inline-block px-2.5 py-1 bg-qwaam-pink-light text-qwaam-pink text-[11px] font-black rounded-full">
                            {t(`onboarding.step4.goals.${ob.primaryGoal}`)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-muted font-bold">{t('profile.notSet')}</span>
                        )}
                      </td>

                      {/* Coach / assignment dropdown */}
                      <td className="px-5 py-3.5 text-left">
                        {isAssigned ? (
                          <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-bold text-text-main">
                              {assignedCoach?.name || t('admin.coach')}
                            </span>
                            <span className="text-[11px] text-green-600 font-black">
                              {t('admin.assigned')}
                            </span>
                          </div>
                        ) : (
                          <AssignCoachDropdown
                            traineeUid={trainee.uid}
                            coaches={coaches}
                            adminUid={adminUid}
                          />
                        )}
                      </td>

                      {/* Actions — hard delete */}
                      <td className="px-5 py-3.5 text-left">
                        <button
                          type="button"
                          onClick={() => setToDelete(trainee)}
                          title="حذف نهائي"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-border-light text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pager */}
          <div className="px-5 py-3 border-t border-border-light bg-gray-50/60 flex items-center justify-between gap-3 text-xs font-bold text-text-muted">
            <span>
              عرض <span className="text-text-main font-black">{pageStart + 1}</span>
              {' – '}
              <span className="text-text-main font-black">{Math.min(pageStart + pageSize, filtered.length)}</span>
              {' من '}
              <span className="text-text-main font-black">{filtered.length}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-border-light disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="السابق"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 rounded-lg bg-white border border-border-light font-black text-text-main">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-border-light disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="التالي"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>

    {/* Hard-delete confirmation modal — requires typing the email to confirm */}
    {toDelete && (
      <DeleteUserModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={() => {
          // Optimistic local removal so the row disappears immediately
          // without waiting for a router.refresh() round-trip.
          setLocalTrainees((prev) => prev.filter((tr) => tr.uid !== toDelete.uid));
        }}
        uid={toDelete.uid}
        name={toDelete.name}
        email={toDelete.email}
      />
    )}
    </>
  );
}
