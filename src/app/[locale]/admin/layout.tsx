import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin';
import { setRequestLocale } from 'next-intl/server';
import Sidebar from '@/components/admin/Sidebar';

type AdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Admin Portal Layout — Server-Side Auth Guard + Sidebar Shell
 * Security: Validates Custom Claim (role === 'coach') via firebase-admin.
 */
export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qwaam_session')?.value;

  if (!sessionCookie) {
    redirect(`/${locale}/login?redirect=/${locale}/admin`);
  }

  try {
    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);

    if (decodedClaims.role !== 'coach') {
      redirect(`/${locale}/unauthorized`);
    }

    // Auth passed — Render App Shell Architecture
    return (
      <div className="bg-background flex min-h-screen text-text-main">
        {/* Persistent Desktop Sidebar */}
        <Sidebar coachUid={decodedClaims.uid} />
        
        {/* Main Interface Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
          
          {/* Main Layout Container */}
          <main className="flex-1 p-8 md:p-12 relative z-10 bg-[url('/ui/noise.png')]">
            {children}
          </main>
          
          {/* Global Ambient Background Decoration (optional) */}
          <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-qwaam-pink-light/60 to-transparent -z-0 pointer-events-none" />
        </div>
      </div>
    );
  } catch (error) {
    redirect(`/${locale}/login?redirect=/${locale}/admin&reason=session_expired`);
  }
}
