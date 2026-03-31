import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import Image from 'next/image';

export default function Navbar() {
  const t = useTranslations('nav');

  const marketingLinks = [
    { href: '/', label: t('home') },
    { href: '/packages', label: t('packages') },
    { href: '/classes', label: t('classes') },
    { href: '/meals', label: t('meals') },
    { href: '/science', label: t('science') },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full bg-qwaam-white shadow-sm border-b border-border-light">
      <nav className="container mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <div className="relative h-12 w-32">
            <Image
              src="/brand/logo-pink.png"
              alt="Qwaam"
              fill
              priority
              className="object-contain"
            />
          </div>
        </Link>

        {/* Main Navigation Links */}
        <ul className="hidden md:flex items-center gap-8">
          {marketingLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm font-bold text-text-main hover:text-qwaam-pink transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right-side controls */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          <Link
            href="/client"
            className="hidden md:inline-flex items-center px-6 py-2.5 rounded-full text-sm font-bold bg-qwaam-pink text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            {t('client')}
          </Link>
        </div>
      </nav>
    </header>
  );
}
