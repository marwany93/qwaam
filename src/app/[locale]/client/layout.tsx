import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase-admin';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import ClientLogoutButton from '@/components/client/ClientLogoutButton';

type ClientLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Trainee Portal Layout — Server-Side Auth Guard Shell
 * Security: Validates Custom Claim (role === 'trainee') strictly via firebase-admin.
 */
export default async function ClientLayout({ children, params }: ClientLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('qwaam_session')?.value;

  if (!sessionCookie) {
    redirect(`/${locale}/login?redirect=/${locale}/client`);
  }

  try {
    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);

    if (decodedClaims.role !== 'trainee') {
      redirect(`/${locale}/unauthorized`);
    }

    // Auth Passed — Build the clean Trainee Portal Structure
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-text-main" dir="rtl">
        
        {/* Isolated Client Navigation Bar */}
        <header className="bg-white border-b border-border-light shadow-sm sticky top-0 z-40 bg-white/90 backdrop-blur-md">
           <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              
              <Link href={`/client`} className="hover:opacity-80 transition-all">
                <Image src="/brand/logo-pink.png" alt="Qwaam Client" width={110} height={35} className="w-auto h-8" />
              </Link>
              
              <div className="flex items-center gap-2 sm:gap-4">
                 
                 {/* Trainee Sign Out Tool */}
                 <ClientLogoutButton />

                 <button 
                  className="w-10 h-10 rounded-full bg-qwaam-yellow text-text-main border-2 border-border-light flex items-center justify-center font-black text-sm uppercase shadow-sm"
                 >
                    {decodedClaims.email?.charAt(0) || 'U'}
                 </button>
              </div>

           </div>
        </header>

        {/* Dynamic Trainee Content Views */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
           {children}
        </main>
        
      </div>
    );
  } catch (error) {
    redirect(`/${locale}/login?redirect=/${locale}/client&reason=session_expired`);
  }
}
