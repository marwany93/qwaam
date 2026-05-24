import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getTrainees, getCoaches } from '@/actions/admin-actions';
import TraineesManager from '@/components/admin/TraineesManager';
import { verifyAdminAccess } from '@/lib/auth-utils';
import { Users } from 'lucide-react';
import type { Metadata } from 'next';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: t('traineesList') };
}

export default async function AdminTraineesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const adminClaims = await verifyAdminAccess();

  // getTrainees() already returns newest-first (orderBy createdAt desc).
  // All client-side filtering, pagination, and search happens inside
  // <TraineesManager />.
  const [trainees, coaches] = await Promise.all([
    getTrainees(),
    getCoaches(),
  ]);

  const pendingCount = trainees.filter((tr) => !tr.traineeData?.assignedCoachUid).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10 animate-in fade-in duration-500" dir="rtl">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-4 border-b border-border-light pb-4">
        <div className="w-12 h-12 bg-pink-100 text-qwaam-pink rounded-2xl flex items-center justify-center shadow-sm">
          <Users className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-text-main">{t('admin.traineesList')}</h1>
          <p className="text-sm font-bold text-text-muted mt-1">
            {trainees.length} {t('admin.trainees')}
            {pendingCount > 0 && (
              <>
                {' · '}
                <span className="text-red-600 font-black">
                  {pendingCount} {t('admin.pendingAssignment')}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <TraineesManager
        trainees={trainees}
        coaches={coaches}
        adminUid={adminClaims.uid}
        locale={locale}
      />
    </div>
  );
}
