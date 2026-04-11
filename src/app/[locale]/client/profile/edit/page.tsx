// src/app/[locale]/client/profile/edit/page.tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentTrainee } from '@/actions/client-actions';
import EditProfileForm from '@/components/profile/EditProfileForm';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'profile' });
  return { title: t('editProfile') };
}

export default async function EditProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('profile');

  const trainee = await getCurrentTrainee();

  if (!trainee) {
    redirect(`/${locale}/login`);
  }

  // Pre-fill with the entire onboarding document if it exists.
  // Default values for missing properties are handled by the Zod resolver in EditProfileForm.
  const ob = (trainee as any).onboarding || {};

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 pb-10 space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex items-center gap-4 border-b border-border-light pb-4">
        <div className="w-12 h-12 bg-qwaam-pink-light text-qwaam-pink rounded-2xl flex items-center justify-center text-xl shadow-sm border border-qwaam-pink/20">
          ✏️
        </div>
        <div>
          <h1 className="text-2xl font-black text-text-main">{t('editProfile')}</h1>
          <p className="text-sm font-bold text-text-muted mt-1">{trainee.name}</p>
        </div>
      </div>

      {/* ── Edit Form ── */}
      <EditProfileForm 
        uid={trainee.uid}
        defaultData={{ ...ob, name: trainee.name }}
        currentInbody={ob.inbodyUrl}
        currentPhoto={ob.bodyPhotoUrl}
      />
      
    </div>
  );
}
