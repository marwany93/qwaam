import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getClients } from '@/actions/admin-actions';
import AddClientButton from '@/components/admin/AddClientButton';
import ClientsList from '@/components/admin/ClientsList';

type PageProps = { params: Promise<{ locale: string }> };

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  // Hard intercept Session State to dynamically inject current Coach boundary mappings
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qwaam_session')?.value;
  if (!sessionCookie) return null; // Fallback boundary check
  
  const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);

  // Fetch initial base arrays sequentially enforcing robust hydration boundaries
  const clients = await getClients();

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-black text-text-main tracking-tight pb-1">
             {t('trainees') || 'إدارة البرنامج'}
          </h1>
          <p className="text-text-muted font-bold text-lg">تحكم كامل في تقدم المتدربين والخطط</p>
        </div>
        
        {/* Client Side Modal Trigger Component */}
        <AddClientButton />
      </div>

      {/* ── Dashboard Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'إجمالي المتدربين', value: clients.length, icon: '⚡', color: 'bg-qwaam-yellow text-text-main' },
          { label: 'برامج مكتملة هذا الشهر', value: '14', icon: '🏆', color: 'bg-qwaam-pink-light text-qwaam-pink border border-qwaam-pink/20' },
          { label: 'نشاط الروبوت المحادثة', value: 'مفعل', icon: '💬', color: 'bg-text-main text-white' }, 
        ].map((stat, i) => (
          <div
            key={i}
            className="p-8 rounded-3xl bg-qwaam-white border border-border-light shadow-sm hover:shadow-md transition-shadow flex items-center gap-5"
          >
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-4xl font-black text-text-main tracking-tight leading-none mb-1.5">{stat.value}</p>
              <p className="text-text-muted text-sm font-bold tracking-wide">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Real-Time Reactive Roster List ── */}
      <ClientsList coachUid={decodedClaims.uid} />

    </div>
  );
}
