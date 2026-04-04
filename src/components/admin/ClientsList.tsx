'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { QwaamUser } from '@/types';
import { Link } from '@/i18n/navigation';
import { UserCircleIcon, CalendarIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

interface Props {
  coachUid: string;
}

export default function ClientsList({ coachUid }: Props) {
  const [clients, setClients] = useState<QwaamUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coachUid) return;

    console.log("💡 The Coach UID searching for trainees is:", coachUid);

    // 🚨 الضربة القاضية: هنجيب كوليكشن الـ users بالكامل من غير أي فلاتر
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 1. هنشوف الداتا بيز فيها كام يوزر أصلاً (عشان نتأكد إننا في المشروع الصح)
      console.log("📦 Total docs found in users collection:", snapshot.size);

      const roster: QwaamUser[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // 2. هنطبع كل داتا بتيجي عشان نشوفها بعنينا
        console.log(`🔍 Examining Doc [${doc.id}]:`, data);

        // 3. الفلتر اليدوي (عشان نتجاوز أي مشاكل في الفهارس بتاعت فايربيس)
        const isTrainee = data.role === 'trainee';
        const isMyTrainee = data.traineeData?.assignedCoachUid === coachUid;

        if (isTrainee && isMyTrainee) {
          roster.push({
            uid: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
          } as QwaamUser);
        }
      });

      roster.sort((a, b) => (b.createdAt as number) - (a.createdAt as number));
      setClients(roster);
      setLoading(false);
    },
      (error) => {
        console.error("🔥 Firebase Query Error:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [coachUid]);

  if (loading) {
    return (
      <div className="bg-qwaam-white rounded-3xl border border-border-light shadow-sm overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-qwaam-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-qwaam-white rounded-3xl border border-border-light shadow-sm overflow-hidden flex flex-col">
      {clients.length === 0 ? (

        <div className="py-24 px-6 text-center text-text-muted flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
            <span className="text-5xl block grayscale opacity-50">👥</span>
          </div>
          <h3 className="text-2xl font-black text-text-main mb-3">لا يوجد متدربين بعد</h3>
          <p className="text-base max-w-sm font-medium mb-8">
            برنامجك جاهز تماماً. أضف متدربك الأول عن طريق الزر في الأعلى وأرسل له رابط الدخول!
          </p>
        </div>

      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right bg-qwaam-white">
            <thead className="bg-gray-50/80 border-b border-border-light text-text-muted text-xs uppercase font-black tracking-wider">
              <tr>
                <th className="px-8 py-5">المتدرب</th>
                <th className="px-8 py-5">الحالة</th>
                <th className="px-8 py-5">تاريخ الانضمام</th>
                <th className="px-8 py-5 text-left w-32">الإدارة</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-light">
              {clients.map(client => {
                const unread = client.traineeData?.unreadCount || 0;
                return (
                  <tr key={client.uid} className="hover:bg-qwaam-pink-light/20 transition-all cursor-pointer group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-qwaam-yellow/20 text-text-main flex items-center justify-center shrink-0 relative">
                          <UserCircleIcon className="w-6 h-6 opacity-70" />

                          {/* Real-time Unread Notification Badge mapped directly to the Trainee's Avatar */}
                          {unread > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white items-center justify-center text-[8px] font-black text-white leading-none">
                                {unread > 9 ? '9+' : unread}
                              </span>
                            </span>
                          )}

                        </div>
                        <div>
                          <div className="font-extrabold text-base text-text-main group-hover:text-qwaam-pink transition-colors">
                            {client.name}
                          </div>
                          <div className="text-xs font-bold text-text-muted block mt-0.5" dir="ltr" style={{ textAlign: "right" }}>
                            {client.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-extrabold border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 block animate-pulse" />
                        نشط قيد التدريب
                      </span>
                    </td>

                    <td className="px-8 py-6 text-text-muted font-bold text-sm flex items-center gap-2 mt-4 md:mt-0 h-full">
                      <CalendarIcon className="w-4 h-4 opacity-50" />
                      {new Date(client.createdAt as number).toLocaleDateString('ar-SA')}
                    </td>

                    <td className="px-8 py-6 text-left">
                      <Link
                        href={`/admin/client/${client.uid}`}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border border-border-light text-text-main group-hover:bg-qwaam-pink group-hover:border-qwaam-pink group-hover:text-white transition-all shadow-sm group-hover:shadow-md relative"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />

                        {/* Subtle contextual hint badge overriding the chevron on Unreads */}
                        {unread > 0 && (
                          <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                        )}

                      </Link>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
