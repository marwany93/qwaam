'use client';

import { useState } from 'react';
import MealSearch from '@/components/admin/library/MealSearch';
import MyMeals from '@/components/admin/library/MyMeals';
import {
  MagnifyingGlassIcon,
  BookmarkIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

type TabKey = 'search' | 'custom' | 'planner';

interface Tab {
  key: TabKey;
  label: string;
  icon: typeof MagnifyingGlassIcon;
}

const TABS: Tab[] = [
  { key: 'search',  label: 'البحث عن وجبات (Spoonacular)', icon: MagnifyingGlassIcon },
  { key: 'custom',  label: 'وجباتي الخاصة',                icon: BookmarkIcon },
  { key: 'planner', label: 'بناء خطة غذائية',              icon: Squares2X2Icon },
];

export default function MealsManager() {
  const [active, setActive] = useState<TabKey>('search');

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Tab bar ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto" role="tablist">
          {TABS.map((tab) => {
            const isActive = active === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 font-black text-sm whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-qwaam-pink text-qwaam-pink bg-qwaam-pink-light/40'
                    : 'border-transparent text-text-muted hover:text-text-main hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active tab content ────────────────────────────── */}
      <div className="animate-in fade-in duration-200">
        {active === 'search' && <MealSearch />}

        {active === 'custom' && <MyMeals />}

        {active === 'planner' && (
          <div className="bg-white rounded-3xl p-12 border border-dashed border-border-light text-center">
            <span className="text-5xl block mb-4">🗓️</span>
            <h3 className="font-black text-text-main text-lg mb-2">قريباً</h3>
            <p className="font-bold text-text-muted text-sm">قريباً: تجميع وجبات في خطة غذائية</p>
          </div>
        )}
      </div>
    </div>
  );
}
