'use client';

import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';
import {
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import AssignmentsTab from '@/components/admin/AssignmentsTab';
import TraineeChat from '@/components/admin/TraineeChat';
import type { Workout, Meal } from '@/types';

interface Props {
  traineeUid: string;
  traineeName: string;
  assignedWorkouts: Workout[];
  assignedMeals: Meal[];
  allWorkouts: Workout[];
  allMeals: Meal[];
  coachUid: string;
  progressLogs: any[];
}

export default function TraineeTabsWrapper({
  traineeUid,
  traineeName,
  assignedWorkouts,
  assignedMeals,
  allWorkouts,
  allMeals,
  coachUid,
  progressLogs,
}: Props) {
  return (
    <TabGroup>
      <TabList className="flex gap-1 bg-white p-2 rounded-2xl border border-border-light shadow-sm mb-2" dir="rtl">
        {[
          { label: 'نظرة عامة', icon: ClipboardDocumentListIcon },
          { label: 'التعيينات', icon: ClipboardDocumentListIcon },
          { label: 'المحادثة', icon: ChatBubbleLeftRightIcon },
        ].map((tab) => (
          <Tab
            key={tab.label}
            className={({ selected }) =>
              `flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-extrabold outline-none transition-all ${
                selected
                  ? 'bg-qwaam-pink-light text-qwaam-pink shadow-sm ring-1 ring-qwaam-pink/20'
                  : 'text-text-muted hover:bg-gray-50 hover:text-text-main'
              }`
            }
          >
            <tab.icon className="w-5 h-5 shrink-0" />
            {tab.label}
          </Tab>
        ))}
      </TabList>

      <TabPanels>

        {/* ── Overview Panel ── */}
        <TabPanel className="space-y-5 outline-none focus:outline-none mt-2">
          
          {/* Daily Progress Widget */}
          <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm" dir="rtl">
            <h3 className="text-lg font-extrabold text-text-main mb-4 flex items-center gap-2">
              <span className="text-qwaam-pink">🎯</span> إنجاز اليوم
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1 bg-qwaam-pink-light/30 border border-qwaam-pink/20 rounded-xl p-4 flex justify-between items-center">
                 <div>
                   <p className="text-text-muted font-bold text-xs uppercase tracking-widest mb-1">التمارين</p>
                   <p className="text-xl font-black text-qwaam-pink">{progressLogs.filter(p => p.type === 'workout').length} <span className="text-sm font-bold opacity-70">/ {assignedWorkouts.length}</span></p>
                 </div>
                 <span className="text-3xl grayscale opacity-40">🏋️‍♂️</span>
               </div>
               <div className="flex-1 bg-yellow-50 border border-yellow-200/50 rounded-xl p-4 flex justify-between items-center">
                 <div>
                   <p className="text-text-muted font-bold text-xs uppercase tracking-widest mb-1">الوجبات</p>
                   <p className="text-xl font-black text-yellow-600">{progressLogs.filter(p => p.type === 'meal').length} <span className="text-sm font-bold opacity-70">/ {assignedMeals.length}</span></p>
                 </div>
                 <span className="text-3xl grayscale opacity-40">🥗</span>
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: 'إجمالي التمارين المعينة', value: assignedWorkouts.reduce((a, w) => a + (w.exercises?.length || 0), 0), suffix: 'حركة', color: 'text-qwaam-pink', bg: 'bg-qwaam-pink-light' },
              { label: 'إجمالي السعرات اليومية', value: assignedMeals.reduce((a, m) => a + (m.calories || 0), 0), suffix: 'kcal', color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'وقت التمرين الإجمالي', value: assignedWorkouts.reduce((a, w) => a + (w.duration || 0), 0), suffix: 'دقيقة', color: 'text-text-main', bg: 'bg-gray-50' },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl p-6 border border-border-light/50 shadow-sm`} dir="rtl">
                <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-3">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black ${stat.color}`}>{stat.value}</span>
                  <span className="text-sm font-bold text-text-muted">{stat.suffix}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Macro Breakdown */}
          {assignedMeals.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm" dir="rtl">
              <h3 className="text-lg font-extrabold text-text-main mb-5">توزيع الماكروز اليومي</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'البروتين', value: assignedMeals.reduce((a, m) => a + m.macros.protein, 0), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                  { label: 'الكاربوهيدرات', value: assignedMeals.reduce((a, m) => a + m.macros.carbs, 0), color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                  { label: 'الدهون', value: assignedMeals.reduce((a, m) => a + m.macros.fats, 0), color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
                ].map((macro) => (
                  <div key={macro.label} className={`${macro.bg} rounded-xl p-5 border ${macro.border}`}>
                    <p className="text-xs font-black text-text-muted mb-2">{macro.label}</p>
                    <span className={`text-3xl font-black ${macro.color}`}>{macro.value}</span>
                    <span className="text-xs font-bold text-text-muted block mt-1">جرام</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabPanel>

        {/* ── Assignments Panel ── (Client Component for interactivity) */}
        <TabPanel className="space-y-8 bg-white rounded-2xl p-8 border border-border-light shadow-sm outline-none focus:outline-none mt-2">
          <AssignmentsTab
            traineeUid={traineeUid}
            assignedWorkouts={assignedWorkouts}
            assignedMeals={assignedMeals}
            allWorkouts={allWorkouts}
            allMeals={allMeals}
          />
        </TabPanel>

        {/* ── Real-Time Chat Panel ── */}
        <TabPanel className="outline-none focus:outline-none mt-2">
          <TraineeChat
            coachUid={coachUid}
            traineeUid={traineeUid}
            traineeName={traineeName}
          />
        </TabPanel>

      </TabPanels>
    </TabGroup>
  );
}
