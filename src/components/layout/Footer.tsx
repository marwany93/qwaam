import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  const currentYear = new Date().getFullYear();

  const links = [
    { href: '/packages', label: tNav('packages') },
    { href: '/classes', label: tNav('classes') },
    { href: '/meals', label: tNav('meals') },
    { href: '/science', label: tNav('science') },
  ] as const;

  return (
    <footer className="bg-qwaam-pink-light border-t border-border-light mt-auto">
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
              <Image
                src="/brand/logo-pink.png"
                alt="Qwaam"
                width={150}
                height={50}
                className="w-auto h-auto"
              />
            </Link>
            <p className="text-text-muted text-lg leading-relaxed font-medium">
              {t('tagline')}
            </p>
          </div>

          {/* Nav Links */}
          <nav>
            <ul className="flex flex-col sm:flex-row flex-wrap gap-x-12 gap-y-4">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-text-main font-bold text-base hover:text-qwaam-pink transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border-light flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-sm font-bold text-center sm:text-left">
            © {currentYear} Qwaam. {t('rights')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
