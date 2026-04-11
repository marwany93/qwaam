import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getTrainees, getCoaches } from '@/actions/admin-actions';
import AssignCoachDropdown from '@/components/admin/AssignCoachDropdown';
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

  const [trainees, coaches] = await Promise.all([
    getTrainees(),
    getCoaches()
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10 animate-in fade-in duration-500">
      
      {/* ── Page Header ── */}
      <div className="flex items-center gap-4 border-b border-border-light pb-4">
        <div className="w-12 h-12 bg-pink-100 text-qwaam-pink rounded-2xl flex items-center justify-center shadow-sm">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-main">{t('admin.traineesList')}</h1>
          <p className="text-sm font-bold text-text-muted mt-1">
            {trainees.length} {t('admin.trainees')}
          </p>
        </div>
      </div>

      {/* ── Trainees DataGrid ── */}
      {trainees.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-border-light shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-text-muted">{t('admin.noTraineesFound')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-gray-50 border-b border-border-light">
                <tr>
                  <th className="px-6 py-4 text-start text-xs font-black text-text-muted uppercase tracking-wider">{t('admin.name')}</th>
                  <th className="px-6 py-4 text-start text-xs font-black text-text-muted uppercase tracking-wider">{t('admin.email')}</th>
                  <th className="px-6 py-4 text-start text-xs font-black text-text-muted uppercase tracking-wider">{t('admin.primaryGoal')}</th>
                  <th className="px-6 py-4 text-start text-xs font-black text-text-muted uppercase tracking-wider">{t('admin.coach')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {trainees.map((trainee) => {
                  const ob = (trainee as any).onboarding || {};
                  const isAssigned = !!trainee.traineeData?.assignedCoachUid;
                  const assignedCoach = coaches.find(c => c.uid === trainee.traineeData?.assignedCoachUid);

                  return (
                    <tr key={trainee.uid} className={`transition-colors ${isAssigned ? 'hover:bg-gray-50/50' : 'bg-red-50/40 hover:bg-red-50/80 border-s-4 border-red-400'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-sm text-text-main">{trainee.name}</div>
                          {!isAssigned && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-sm">
                              {t('admin.pendingAssignment')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted mt-1">{new Date(trainee.createdAt as number).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main direction-ltr text-start">
                        {trainee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ob.primaryGoal ? (
                          <span className="px-3 py-1 bg-qwaam-pink-light text-qwaam-pink text-xs font-bold rounded-full">
                            {t(`onboarding.step4.goals.${ob.primaryGoal}`)}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">{t('profile.notSet')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAssigned ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-main">{assignedCoach?.name || t('admin.coach')}</span>
                            <span className="text-xs text-green-600 font-bold">{t('admin.assigned')}</span>
                          </div>
                        ) : (
                          <AssignCoachDropdown traineeUid={trainee.uid} coaches={coaches} adminUid={adminClaims.uid} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
