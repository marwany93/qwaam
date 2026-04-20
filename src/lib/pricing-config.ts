/**
 * Qwaam Pricing Configuration
 * ────────────────────────────
 * Centralized config for all pricing plans.
 * Location → Type → Plans[]
 */

export type PlanLocation = 'home' | 'gym';
export type PlanType = 'live' | 'schedule';

export interface Plan {
  id: string;
  sessions?: number;     // for live plans
  days?: number;          // for schedule plans
  price: number;          // EGP
  popular?: boolean;
}

export interface PlanCategory {
  location: PlanLocation;
  type: PlanType;
  plans: Plan[];
}

export const NUTRITION_ADDON_PRICE = 200; // EGP

export const PRICING_CONFIG: PlanCategory[] = [
  // ── HOME + LIVE ──────────────────────────
  {
    location: 'home',
    type: 'live',
    plans: [
      { id: 'home-live-8', sessions: 8, price: 550 },
      { id: 'home-live-12', sessions: 12, price: 780 },
      { id: 'home-live-16', sessions: 16, price: 1000, popular: true },
      { id: 'home-live-20', sessions: 20, price: 1200 },
    ],
  },
  // ── HOME + SCHEDULE ──────────────────────
  {
    location: 'home',
    type: 'schedule',
    plans: [
      { id: 'home-sched-2', days: 2, price: 300 },
      { id: 'home-sched-3', days: 3, price: 330 },
      { id: 'home-sched-5', days: 5, price: 370, popular: true },
      { id: 'home-sched-7', days: 7, price: 400 },
    ],
  },
  // ── GYM + LIVE ───────────────────────────
  {
    location: 'gym',
    type: 'live',
    plans: [
      { id: 'gym-live-8', sessions: 8, price: 450 },
      { id: 'gym-live-12', sessions: 12, price: 630 },
      { id: 'gym-live-16', sessions: 16, price: 800, popular: true },
      { id: 'gym-live-20', sessions: 20, price: 950 },
    ],
  },
  // ── GYM + SCHEDULE ──────────────────────
  {
    location: 'gym',
    type: 'schedule',
    plans: [
      { id: 'gym-sched-2', days: 2, price: 200 },
      { id: 'gym-sched-3', days: 3, price: 230 },
      { id: 'gym-sched-5', days: 5, price: 270, popular: true },
      { id: 'gym-sched-7', days: 7, price: 300 },
    ],
  },
];

/**
 * Helper to get plans filtered by location + type.
 */
export function getPlans(location: PlanLocation, type: PlanType): Plan[] {
  return (
    PRICING_CONFIG.find((c) => c.location === location && c.type === type)
      ?.plans ?? []
  );
}

/**
 * Finds a plan across all categories by its ID.
 */
export function findPlanById(planId: string): Plan | undefined {
  for (const category of PRICING_CONFIG) {
    const found = category.plans.find((p) => p.id === planId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Extracts the maximum workout days allowed by a plan.
 * - Schedule plans: uses the `days` field directly (e.g., home-sched-5 → 5)
 * - Live plans: extracts the trailing number from the ID as a fallback (sessions count)
 * - Falls back to 7 if parsing fails (no restriction).
 */
export function getMaxDaysFromPlan(planId: string): number {
  const plan = findPlanById(planId);
  if (plan?.days) return plan.days;

  // Fallback: parse trailing number from ID (e.g., "gym-live-12" → 12 is sessions, not days)
  // For live plans, we don't restrict days — return 7
  if (planId.includes('live')) return 7;

  const match = planId.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 7;
}

