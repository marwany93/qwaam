'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  getPlans,
  NUTRITION_ADDON_PRICE,
  type PlanLocation,
  type PlanType,
  type Plan,
} from '@/lib/pricing-config';

// ── Icon Components ─────────────────────────────────────────────
function HomeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function GymIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function VideoIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function CalendarIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function CheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function SparklesIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

// ── Toggle Switch Component ─────────────────────────────────────
function ToggleSwitch<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="relative inline-flex bg-gray-100 rounded-2xl p-1.5 gap-1">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              relative z-10 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300
              ${isActive
                ? 'bg-white text-qwaam-pink shadow-md shadow-qwaam-pink/10'
                : 'text-text-muted hover:text-text-main'
              }
            `}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Plan Card Component ─────────────────────────────────────────
function PlanCard({
  plan,
  isSelected,
  onSelect,
  isLive,
  t,
}: {
  plan: Plan;
  isSelected: boolean;
  onSelect: () => void;
  isLive: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const label = isLive
    ? `${plan.sessions} ${t('sessions')}`
    : `${plan.days} ${t('days')}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      className={`
        cursor-pointer group relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 h-full
        ${isSelected
          ? 'border-qwaam-pink bg-qwaam-pink-light shadow-lg shadow-qwaam-pink/15 scale-[1.02]'
          : 'border-border-light bg-white hover:border-qwaam-pink/40 hover:shadow-md'
        }
        ${plan.popular ? 'ring-2 ring-qwaam-yellow/50' : ''}
      `}
    >
      {/* Popular badge - عايم في النص على الخط العلوي بالظبط */}
      {plan.popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-qwaam-yellow text-[11px] font-black text-text-main shadow-md whitespace-nowrap z-20 flex items-center gap-1">
          <SparklesIcon className="w-3.5 h-3.5" />
          {t('popular')}
        </div>
      )}

      {/* Selection indicator */}
      <div
        className={`
          w-6 h-6 rounded-full border-2 mb-4 flex items-center justify-center transition-all duration-200
          ${isSelected
            ? 'border-qwaam-pink bg-qwaam-pink'
            : 'border-gray-300 group-hover:border-qwaam-pink/50'
          }
        `}
      >
        {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
      </div>

      {/* Plan details */}
      <p className="text-lg font-extrabold text-text-main mb-1">{label}</p>
      <p className="text-sm text-text-muted mb-4">
        {isLive ? t('perMonth') : t('perWeek')}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mt-auto">
        <span className={`text-3xl font-black ${isSelected ? 'text-qwaam-pink' : 'text-text-main'} transition-colors`}>
          {plan.price}
        </span>
        <span className="text-sm font-bold text-text-muted">{t('currency')}</span>
      </div>
    </div>
  );
}

// ── Main Pricing Client Component ───────────────────────────────
export default function PricingClient() {
  const t = useTranslations('pricing');

  const [location, setLocation] = useState<PlanLocation>('home');
  const [type, setType] = useState<PlanType>('live');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [addDiet, setAddDiet] = useState(false);

  const plans = useMemo(() => getPlans(location, type), [location, type]);

  // Reset plan when location/type changes
  const handleLocationChange = (v: PlanLocation) => {
    setLocation(v);
    setSelectedPlan(null);
  };
  const handleTypeChange = (v: PlanType) => {
    setType(v);
    setSelectedPlan(null);
  };

  const totalPrice = useMemo(() => {
    if (!selectedPlan) return 0;
    return selectedPlan.price + (addDiet ? NUTRITION_ADDON_PRICE : 0);
  }, [selectedPlan, addDiet]);

  const subscribeHref = selectedPlan
    ? `/onboarding?plan=${selectedPlan.id}&total=${totalPrice}&diet=${addDiet}`
    : '/onboarding';

  return (
    <div className="min-h-screen bg-gradient-to-b from-qwaam-pink-light via-white to-white pb-32">
      {/* ── Hero Header ─────────────────────────── */}
      <div className="pt-24 pb-12 text-center px-6">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-qwaam-yellow text-text-main text-xs font-black mb-6 shadow-sm">
          <SparklesIcon className="w-4 h-4" />
          {t('badge')}
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-text-main mb-3 leading-tight">
          {t('title')}
        </h1>
        <p className="text-text-muted text-lg md:text-xl max-w-xl mx-auto font-medium leading-relaxed">
          {t('subtitle')}
        </p>
      </div>

      <div className="container mx-auto px-6 max-w-3xl">

        {/* ── Step 1: Location Toggle ─────────── */}
        <div className="mb-10">
          <p className="text-sm font-bold text-text-muted mb-3 flex items-center gap-2">
            <span className="inline-flex w-6 h-6 rounded-full bg-qwaam-pink text-white text-xs font-black items-center justify-center">1</span>
            {t('chooseLocation')}
          </p>
          <div className="flex justify-center">
            <ToggleSwitch
              options={[
                { value: 'home' as PlanLocation, label: t('home'), icon: <HomeIcon className="w-4 h-4" /> },
                { value: 'gym' as PlanLocation, label: t('gym'), icon: <GymIcon className="w-4 h-4" /> },
              ]}
              value={location}
              onChange={handleLocationChange}
            />
          </div>
        </div>

        {/* ── Step 2: Type Toggle ─────────────── */}
        <div className="mb-10">
          <p className="text-sm font-bold text-text-muted mb-3 flex items-center gap-2">
            <span className="inline-flex w-6 h-6 rounded-full bg-qwaam-pink text-white text-xs font-black items-center justify-center">2</span>
            {t('chooseType')}
          </p>
          <div className="flex justify-center">
            <ToggleSwitch
              options={[
                { value: 'live' as PlanType, label: t('live'), icon: <VideoIcon className="w-4 h-4" /> },
                { value: 'schedule' as PlanType, label: t('schedule'), icon: <CalendarIcon className="w-4 h-4" /> },
              ]}
              value={type}
              onChange={handleTypeChange}
            />
          </div>
          <p className="text-center text-xs text-text-muted mt-2 font-medium">
            {type === 'live' ? t('liveDesc') : t('scheduleDesc')}
          </p>
        </div>

        {/* ── Step 3: Plan Cards ──────────────── */}
        <div className="mb-10">
          <p className="text-sm font-bold text-text-muted mb-4 flex items-center gap-2">
            <span className="inline-flex w-6 h-6 rounded-full bg-qwaam-pink text-white text-xs font-black items-center justify-center">3</span>
            {t('choosePlan')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan?.id === plan.id}
                onSelect={() => setSelectedPlan(plan)}
                isLive={type === 'live'}
                t={t}
              />
            ))}
          </div>
        </div>

        {/* ── Step 4: Nutrition Add-on ────────── */}
        <div className="mb-8">
          <p className="text-sm font-bold text-text-muted mb-3 flex items-center gap-2">
            <span className="inline-flex w-6 h-6 rounded-full bg-qwaam-pink text-white text-xs font-black items-center justify-center">4</span>
            {t('addonsTitle')}
          </p>
          <button
            type="button"
            onClick={() => setAddDiet((d) => !d)}
            className={`
              w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300
              ${addDiet
                ? 'border-qwaam-pink bg-qwaam-pink-light shadow-md shadow-qwaam-pink/10'
                : 'border-border-light bg-white hover:border-qwaam-pink/30'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div
                className={`
                  w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                  ${addDiet ? 'bg-qwaam-pink border-qwaam-pink' : 'border-gray-300'}
                `}
              >
                {addDiet && <CheckIcon className="w-4 h-4 text-white" />}
              </div>
              <div className="text-start">
                <p className="font-bold text-text-main">{t('nutritionAddon')}</p>
                <p className="text-xs text-text-muted">{t('nutritionAddonDesc')}</p>
              </div>
            </div>
            <span className="font-black text-qwaam-pink text-sm whitespace-nowrap">
              +{NUTRITION_ADDON_PRICE} {t('currency')}
            </span>
          </button>
        </div>
      </div>

      {/* ── Sticky Summary Bar ───────────────── */}
      <div
        className={`
          fixed bottom-0 inset-x-0 z-50 transition-all duration-500
          ${selectedPlan ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
        `}
      >
        <div className="bg-white/80 backdrop-blur-xl border-t border-border-light shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="container mx-auto px-6 max-w-3xl py-4 flex items-center justify-between gap-4">
            {/* Summary */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-text-muted">{t('summary')}:</span>
                {selectedPlan && (
                  <span className="text-xs font-bold bg-qwaam-pink-light text-qwaam-pink px-2 py-0.5 rounded-full">
                    {type === 'live'
                      ? `${selectedPlan.sessions} ${t('sessions')}`
                      : `${selectedPlan.days} ${t('days')}`}
                  </span>
                )}
                {addDiet && (
                  <span className="text-xs font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                    🥗 {t('nutritionAddon')}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-text-main">{totalPrice}</span>
                <span className="text-sm font-bold text-text-muted">{t('currency')}</span>
              </div>
            </div>

            {/* Subscribe Button */}
            <Link
              href={subscribeHref}
              className={`
                px-8 py-3.5 rounded-2xl font-black text-white transition-all duration-300 text-sm shadow-lg shadow-qwaam-pink/25
                ${selectedPlan
                  ? 'bg-qwaam-pink hover:bg-pink-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-qwaam-pink/30'
                  : 'bg-gray-300 pointer-events-none'
                }
              `}
            >
              {t('subscribe')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
