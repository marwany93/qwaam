import Link from 'next/link';
import type { Metadata } from 'next';
import './globals.css'; // السطر ده مهم جداً عشان الـ Tailwind يشتغل هنا

export const metadata: Metadata = {
  title: '404 — Page Not Found | Qwaam',
};

/**
 * Global 404 page dynamically resolved inside the Root Layout App tree.
 */
export default function NotFound() {
  return (
    // ضفنا الـ html والـ body مع مانع تعارض الإضافات (زي Grammarly)
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="min-h-screen flex items-center justify-center bg-qwaam-white outline-none flex-col relative overflow-hidden text-center p-6 w-full">
          {/* Immersive Qwaam Ambient Gradients */}
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-qwaam-pink/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-qwaam-yellow/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-lg mx-auto">
            <span className="text-8xl mb-6 opacity-80 block grayscale select-none">🔍</span>
            <h1 className="text-8xl font-black text-qwaam-pink mb-3 tracking-tighter drop-shadow-sm">404</h1>
            <h2 className="text-3xl font-extrabold text-text-main mb-4">عذراً! الصفحة غير موجودة</h2>
            <p className="text-text-muted font-bold text-base mb-10 leading-relaxed">
              يبدو أنك ضللت الطريق. الصفحة التي تبحث عنها غير متوفرة أو تم نقلها. لكن لا تقلق، طريق العودة سهل وممهد.
            </p>

            <Link
              href="/"
              className="inline-flex justify-center items-center rounded-2xl bg-text-main px-8 py-4 text-lg font-bold text-white hover:-translate-y-1 shadow-lg shadow-text-main/20 hover:shadow-xl transition-all"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}