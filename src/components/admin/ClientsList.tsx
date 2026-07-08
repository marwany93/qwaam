'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import type { QwaamUser } from '@/types';
import { isAwaitingScheduleUpload } from '@/lib/subscription-utils';
import { Link } from '@/i18n/navigation';
import {
  UserCircleIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronRightIcon as ChevronRightOutline,
  ChevronLeftIcon as ChevronLeftOutline,
} from '@heroicons/react/24/outline';
import { mapFirestoreError } from '@/lib/firestore-errors';
import DeleteUserModal from '@/components/admin/DeleteUserModal';

interface Props {
  coachUid: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

export default function ClientsList({ coachUid }: Props) {
  const t = useTranslations('coach');
  const [clients, setClients] = useState<QwaamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  // Filter / pagination state
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);

  // Delete modal target
  const [toDelete, setToDelete] = useState<QwaamUser | null>(null);

  // ── Firestore listener ────────────────────────────────────
  useEffect(() => {
    if (!coachUid) return;

    // orderBy createdAt desc is satisfied by the composite index
    // (role ASC, traineeData.assignedCoachUid ASC, createdAt DESC)
    // already declared in firestore.indexes.json.
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'trainee'),
      where('traineeData.assignedCoachUid', '==', coachUid),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roster: QwaamUser[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        } as QwaamUser;
      });
      setClients(roster);
      setError('');
      setIsPermissionError(false);
      setLoading(false);
    }, (err) => {
      const mapped = mapFirestoreError(err);
      console.error('ClientsList query error:', err);
      setError(mapped.userMessage);
      setIsPermissionError(mapped.isPermissionDenied);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [coachUid, retryCount]);

  // ── Local filter (search) ─────────────────────────────────
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((c) =>
      c.name?.toLowerCase().includes(needle) || c.email?.toLowerCase().includes(needle),
    );
  }, [clients, search]);

  // ── Pagination ────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paged = filtered.slice(pageStart, pageStart + pageSize);

  // Reset to page 1 when the filter or page size changes
  useEffect(() => { setPage(1); }, [search, pageSize]);

  // ── Token-refresh retry ──────────────────────────────────
  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      if (auth.currentUser) await auth.currentUser.getIdToken(true);
    } catch (e) {
      console.warn('Token refresh failed:', e);
    }
    setRetrying(false);
    setLoading(true);
    setError('');
    setIsPermissionError(false);
    setRetryCount((c) => c + 1);
  }, []);

  // ── Render: error ─────────────────────────────────────────
  if (!loading && error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 text-center font-bold space-y-4" dir="rtl">
        <p>{error}</p>
        {isPermissionError && (
          <p className="text-xs font-bold text-red-600/70">
            قد يكون السبب أن صلاحية المدرّب لم تنتشر بعد. اضغطي إعادة المحاولة لتحديث الصلاحيات.
          </p>
        )}
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-black shadow-md hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {retrying ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري التحديث...</>
          ) : (
            <><ArrowPathIcon className="w-4 h-4" />إعادة المحاولة</>
          )}
        </button>
      </div>
    );
  }

  // ── Render: loading ───────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-qwaam-white rounded-3xl border border-border-light shadow-sm overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-qwaam-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Render: empty (no trainees at all) ────────────────────
  if (clients.length === 0) {
    return (
      <div className="bg-qwaam-white rounded-3xl border border-border-light shadow-sm py-24 px-6 text-center text-text-muted flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
          <span className="text-5xl block grayscale opacity-50">👥</span>
        </div>
        <h3 className="text-2xl font-black text-text-main mb-3">لا يوجد متدربين بعد</h3>
        <p className="text-base max-w-sm font-medium">
          برنامجك جاهز تماماً. أضف متدربتك الأولى عن طريق الزر في الأعلى وأرسلي لها رابط الدخول!
        </p>
      </div>
    );
  }

  // ── Render: list ──────────────────────────────────────────
  return (
    <>
      <div className="bg-qwaam-white rounded-3xl border border-border-light shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar: search + page size */}
        <div className="px-5 py-4 border-b border-border-light bg-gray-50/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3" dir="rtl">
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
          <div className="py-16 text-center text-text-muted" dir="rtl">
            <p className="font-bold text-sm">لم نجد متدرّبة تطابق &quot;{search}&quot;.</p>
          </div>
        ) : (
          <>
            {/* Table — tightened: smaller padding, sticky header, neutral hover */}
            <div className="overflow-x-auto">
              <table className="w-full text-right bg-qwaam-white text-sm">
                <thead className="bg-gray-50 border-b border-border-light text-text-muted text-[11px] uppercase font-black tracking-wider">
                  <tr>
                    <th className="px-5 py-3">المتدرّبة</th>
                    <th className="px-5 py-3 w-32">الحالة</th>
                    <th className="px-5 py-3 w-40">تاريخ الانضمام</th>
                    <th className="px-5 py-3 w-28 text-left">الإجراءات</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-light">
                  {paged.map((client) => {
                    const unread = client.traineeData?.unreadCount || 0;
                    const awaitingSchedule = isAwaitingScheduleUpload(client.traineeData?.subscription);
                    return (
                      <tr key={client.uid} className="hover:bg-qwaam-pink-light/15 transition-colors group">
                        {/* Trainee column */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-qwaam-yellow/20 text-text-main flex items-center justify-center shrink-0 relative">
                              <UserCircleIcon className="w-5 h-5 opacity-70" />
                              {unread > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white items-center justify-center text-[7px] font-black text-white leading-none">
                                    {unread > 9 ? '9+' : unread}
                                  </span>
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-text-main group-hover:text-qwaam-pink transition-colors truncate">
                                {client.name}
                              </div>
                              <div className="text-[11px] font-bold text-text-muted truncate" dir="ltr" style={{ textAlign: 'right' }}>
                                {client.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col items-start gap-1.5">
                            {client.traineeData?.subscription?.status === 'pending_payment' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-800 text-[11px] font-extrabold border border-yellow-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 block animate-pulse" />
                                في انتظار الدفع
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[11px] font-extrabold border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 block animate-pulse" />
                                نشطة
                              </span>
                            )}

                            {/* Coach reminder: paid + active schedule plan, no schedule uploaded yet */}
                            {awaitingSchedule && (
                              <span
                                title={t('awaitingScheduleTooltip')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-qwaam-yellow/20 text-yellow-800 text-[11px] font-extrabold border border-qwaam-yellow"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 block animate-pulse" />
                                {t('awaitingScheduleBadge')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-3.5 text-text-muted font-bold text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 opacity-60" />
                            {new Date(client.createdAt as number).toLocaleDateString('ar-SA')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-left">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setToDelete(client)}
                              title="حذف نهائي"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-border-light text-text-muted hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/admin/client/${client.uid}`}
                              title="فتح الملف"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-border-light text-text-main group-hover:bg-qwaam-pink group-hover:border-qwaam-pink group-hover:text-white transition-all relative"
                            >
                              <ChevronLeftIcon className="w-4 h-4" />
                              {unread > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 border border-white shadow-sm" />
                              )}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pager */}
            <div className="px-5 py-3 border-t border-border-light bg-gray-50/60 flex items-center justify-between gap-3 text-xs font-bold text-text-muted" dir="rtl">
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
                  <ChevronRightOutline className="w-4 h-4" />
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
                  <ChevronLeftOutline className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hard-delete confirmation modal */}
      {toDelete && (
        <DeleteUserModal
          open={!!toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={() => {
            // Optimistic local removal — the onSnapshot listener will also
            // remove it on the next tick, but this avoids the flicker.
            setClients((prev) => prev.filter((c) => c.uid !== toDelete.uid));
          }}
          uid={toDelete.uid}
          name={toDelete.name}
          email={toDelete.email}
        />
      )}
    </>
  );
}
