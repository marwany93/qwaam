'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import {
  UsersIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Sidebar({ coachUid }: { coachUid: string }) {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!coachUid) return;

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'trainee'),
      where('traineeData.assignedCoachUid', '==', coachUid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let unread = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        unread += data.traineeData?.unreadCount || 0;
      });
      setTotalUnread(unread);
    });

    return () => unsubscribe();
  }, [coachUid]);

  // Navigation Items focusing on core Admin tools
  const navItems = [
    { name: t('trainees') || 'المتدربون', href: '/admin', icon: UsersIcon, badge: totalUnread },
    { name: t('library') || 'المكتبة', href: '/admin/library', icon: BookOpenIcon },
    { name: t('messages') || 'الرسائل', href: '/admin/messages', icon: ChatBubbleLeftRightIcon, badge: totalUnread },
    { name: t('settings') || 'الإعدادات', href: '/admin/settings', icon: Cog6ToothIcon },
  ];

  return (
    <aside className="w-64 h-screen bg-qwaam-white border-e border-border-light flex flex-col sticky top-0 shrink-0 shadow-sm z-20">

      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-border-light">
        <Link href="/">
          <Image
            src="/brand/logo-pink.png"
            alt="Qwaam Admin Tools"
            width={120}
            height={40}
            priority
            className="w-auto h-8"
          />
        </Link>
      </div>

      {/* Primary Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          // Check if active (exact match or deeper route for the section)
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive
                  ? 'bg-qwaam-pink-light text-qwaam-pink shadow-sm'
                  : 'text-text-muted hover:bg-gray-50 hover:text-text-main'
                }`}
            >
              <item.icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-qwaam-pink' : 'text-text-muted'}`} />
              <span className="flex-1">{item.name}</span>

              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] items-center justify-center flex font-black px-2 py-0.5 rounded-full shadow-sm">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin Quick Profile Footer */}
      <div className="p-4 border-t border-border-light bg-gray-50/50">
        <div className="flex items-center gap-3 px-4 py-2">
          {/* Avatar Base */}
          <div className="w-10 h-10 rounded-full bg-qwaam-yellow text-text-main flex items-center justify-center font-black text-lg shadow-sm">
            C
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-text-main leading-tight">الكابتن</p>
            {/* Quick logout trigger calling our secure session DELETE route */}
            <button
              onClick={async () => {
                await fetch('/api/auth/session', { method: 'DELETE' });
                window.location.href = '/login';
              }}
              className="text-xs font-bold text-text-muted hover:text-qwaam-pink transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>

    </aside>
  );
}
