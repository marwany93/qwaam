'use client';

import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/solid';

type TabKey = 'today' | 'progress';

interface Props {
  todayContent: ReactNode;
  progressContent: ReactNode;
  initialTab?: TabKey;
}

const TABS: Array<{ key: TabKey; label: string; Icon: typeof CalendarDaysIcon }> = [
  { key: 'today',    label: 'اليوم',  Icon: CalendarDaysIcon },
  { key: 'progress', label: 'تطوري', Icon: ChartBarIcon },
];

/**
 * Trainee dashboard tabs — switches between "Today" (daily check-ins, plan,
 * subscription, chat) and "My Progress" (weight chart, photo gallery,
 * log-entry trigger).
 *
 * Server-rendered subtrees come in via props so the heavy card markup stays
 * out of the client bundle — this component only ships the tab UI + motion.
 */
export default function DashboardTabs({
  todayContent, progressContent, initialTab = 'today',
}: Props) {
  const [active, setActive] = useState<TabKey>(initialTab);

  return (
    <div dir="rtl">

      {/* ── Tab bar — pill-style, qwaam-pink active state ────────────── */}
      <div
        role="tablist"
        aria-label="أقسام لوحة المتدرّبة"
        className="inline-flex p-1.5 bg-white rounded-full border border-border-light shadow-sm gap-1"
      >
        {TABS.map(({ key, label, Icon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(key)}
              className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {isActive && (
                // Sliding pink pill — the layoutId on the motion.span makes
                // it animate smoothly between buttons when the tab changes.
                <motion.span
                  layoutId="dashboard-tab-pill"
                  className="absolute inset-0 bg-qwaam-pink rounded-full shadow-md shadow-qwaam-pink/25"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {/* Icons + label render above the pill via z-index */}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active panel ─────────────────────────────────────────────── */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.section
            key={active}
            role="tabpanel"
            // Subtle slide-in: from the right for "today" (RTL natural), from
            // the left for "progress" so direction of travel matches the
            // tab order visually
            initial={{ opacity: 0, x: active === 'today' ? 16 : -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: active === 'today' ? -16 : 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-10"
          >
            {active === 'today' ? todayContent : progressContent}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  );
}
