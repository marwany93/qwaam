# CLAUDE.md — Qwaam Project Brain

---

## ⚠️ CRITICAL PROTOCOL FOR CLAUDE CODE

**You must read this file before executing any task.**

Every single time you add a feature, refactor code, fix a bug, or change configuration, you **MUST update this file immediately** to document the change and keep this project memory 100% up-to-date. No exceptions.

---

## 0. Security & Git Hygiene

### Files That Must NEVER Be Committed
| File / Pattern | Reason |
|---------------|--------|
| `firebase-key.json`, `*.json.key` | Firebase service account private key — full Admin SDK access |
| `.env.local`, `.env.*.local`, `.env` | All secrets: Firebase config, Resend API key, Spoonacular key, etc. |
| `.claude/`, `.agent/` | AI session data, conversation history |

These are all listed in `.gitignore`. Before every commit, verify none of these are staged (`git status`).

### .gitignore Coverage (as of 2026-06-04)
- **Secrets:** `.env*`, `firebase-key.json`, `*.json.key`
- **Build/cache:** `.next/`, `out/`, `build/`, `.npm-cache/`, `tsconfig.tsbuildinfo`
- **AI tooling:** `.claude/`, `.agent/`
- **Reports/temp:** `lighthouse-report.json`, `*_REPORT.md`, `_bmad*/`
- **Dependencies:** `node_modules/`
- **OS/test:** `.DS_Store`, `Thumbs.db`, `playwright-report/`, `test-results/`

---

## 1. System Architecture Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 15.2.4 |
| UI Runtime | React | 19.1.0 |
| Language | TypeScript | 5.8.3 |
| Auth | Firebase Auth + Admin SDK (session cookies) | firebase 11.10 / firebase-admin 13.2 |
| Database | Firestore | via Firebase SDKs |
| Storage | Firebase Cloud Storage | via Firebase SDKs |
| Styling | Tailwind CSS v4 (CSS `@theme` config) | 4.1.3 |
| i18n | next-intl | 4.1.0 |
| Forms | react-hook-form + Zod | 7.72 / 4.3 |
| Email | Resend | 6.10 |
| Animation | Framer Motion | 12.38 |
| Charts | Recharts | 3.8 |
| Video | Zego Cloud UIKit | 2.17 |
| External API | Spoonacular (recipes) | REST |
| Build Bundler | Turbopack (dev) | — |

**Auth flow:** Firebase Auth (client) → POST `/api/auth/session` exchanges ID token for a 14-day HttpOnly session cookie → All server actions call `verifyAdminAccess()` / `verifyClientAccess()` which validate the session cookie and check the user's Firestore role.

---

## 2. Folder Directory Map

```
D:\Antigravity Qwaam\
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx                  # Root locale layout (next-intl provider)
│   │   │   ├── (public)/                   # Public routes (Navbar + Footer wrapper)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                # Home /
│   │   │   │   ├── packages/page.tsx       # /packages — Public pricing wizard
│   │   │   │   ├── classes/page.tsx        # /classes
│   │   │   │   ├── meals/page.tsx          # /meals
│   │   │   │   ├── science/page.tsx        # /science
│   │   │   │   ├── login/page.tsx          # /login
│   │   │   │   ├── onboarding/page.tsx     # /onboarding (multi-step signup)
│   │   │   │   └── reset-password/page.tsx
│   │   │   ├── client/                     # Trainee portal (auth-gated)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                # /client — Dashboard (Server Component)
│   │   │   │   ├── profile/page.tsx
│   │   │   │   └── profile/edit/page.tsx
│   │   │   ├── admin/                      # Coach dashboard (auth-gated)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── trainees/page.tsx
│   │   │   │   ├── client/[id]/page.tsx    # Individual trainee detail
│   │   │   │   └── library/page.tsx
│   │   │   └── unauthorized/page.tsx
│   │   ├── api/
│   │   │   ├── auth/session/route.ts       # POST = create cookie, DELETE = logout
│   │   │   ├── setup-admin/route.ts        # Dev util (promote to coach)
│   │   │   └── sync-roles/route.ts         # Sync roles → custom claims
│   │   └── globals.css                     # Tailwind v4 @theme config (custom tokens)
│   ├── actions/                            # ALL server actions ('use server')
│   │   ├── admin-actions.ts
│   │   ├── client-actions.ts
│   │   ├── assignment-actions.ts
│   │   ├── progress-actions.ts
│   │   ├── meal-plan-actions.ts
│   │   ├── library-actions.ts
│   │   ├── onboarding-actions.ts
│   │   ├── spoonacular-actions.ts
│   │   ├── discount-actions.ts
│   │   └── notification-actions.ts
│   ├── components/
│   │   ├── admin/                          # Coach dashboard components
│   │   │   └── library/                   # MealPlanBuilder, MealSearch, etc.
│   │   ├── client/                         # Trainee portal components
│   │   ├── onboarding/                     # 6-step wizard components
│   │   │   └── ui/FormField.tsx
│   │   ├── pricing/PricingClient.tsx       # Public packages page wizard
│   │   ├── profile/                        # InfoCard, EditProfileForm, etc.
│   │   ├── layout/                         # Navbar, Footer, LanguageSwitcher
│   │   ├── home/HomeClient.tsx
│   │   ├── providers/FirebaseProvider.tsx
│   │   └── ui/                             # Button, Card, PasswordInput
│   ├── lib/
│   │   ├── firebase.ts                     # Client SDK init (auth, firestore, storage, App Check)
│   │   ├── firebase-admin.ts               # Admin SDK singleton
│   │   ├── auth-utils.ts                   # verifyAdminAccess / verifyClientAccess
│   │   ├── firestore-serialize.ts          # Timestamps → millis (safe for RSC→Client boundary)
│   │   ├── pricing-config.ts               # ★ SINGLE SOURCE OF TRUTH for all plans
│   │   ├── onboarding-schema.ts            # Zod schemas for each onboarding step
│   │   ├── notification-service.ts
│   │   ├── mail-service.ts
│   │   └── firestore-errors.ts
│   ├── types/index.ts                      # All domain interfaces (QwaamUser, Plan, RenewalRequest, …)
│   └── i18n/                               # next-intl navigation helpers
├── messages/
│   ├── ar.json                             # Arabic translations (primary)
│   └── en.json                             # English translations
├── firestore.rules                         # Firestore security rules
├── firestore.indexes.json                  # Composite indexes
├── CLAUDE.md                               # ← THIS FILE
└── package.json
```

---

## 3. Core Business Logic

### Session Tracking
Each trainee's `users/{uid}` document contains a `sessionTracking` field:
```ts
sessionTracking: {
  totalSessions: number;      // Total sessions in the active plan
  usedSessions: number;       // Sessions consumed
  planStartDate: Timestamp;
  planEndDate: Timestamp;
  planId: string;             // e.g. "home-live-16"
}
```
`remainingSessions = totalSessions - usedSessions`

A `subscription.status` field on the user doc drives UI state:
- `'active'` — Normal training period
- `'pending_payment'` — Trainee has submitted a renewal request; awaiting coach approval
- `'finished'` — Sessions depleted or plan expired

### Renewal Request Flow
1. Trainee opens **RenewalWizard** (`src/components/client/RenewalWizard.tsx`)
2. Selects location → plan type → specific plan (Step 1)
3. Views InstaPay / Vodafone Cash payment details (Step 2)
4. Uploads proof screenshot via `PhotoUpload` (Step 3)
5. Clicks Submit → calls `createRenewalRequest(planId, proofUrl)` server action
6. Action writes to `renewal_requests` collection + sets `subscription.status = 'pending_payment'` on user doc
7. Coach approves in admin dashboard → `confirmTraineePayment()` action activates subscription + marks `renewal_request` as `fulfilled`

### RenewalWizard Visibility Rule (client/page.tsx)
```tsx
{(planStatus === 'finished' || remainingSessions <= 2) && !isPendingPayment && (
  <RenewalWizard uid={trainee.uid} />
)}
```

### SessionAlert Visibility Rule
```tsx
{sessionsRemaining <= 2 && !isPendingPayment && (
  <SessionAlert sessionsRemaining={sessionsRemaining} />
)}
```
`SessionAlert` is purely informational — no server actions, no CTA buttons. It only points users to the RenewalWizard below.

---

## 4. Pricing Rules — COMPLETE BREAKDOWN

All plans defined in `src/lib/pricing-config.ts`. **This is the single source of truth.**

Payment numbers (in `RenewalWizard.tsx`):
- InstaPay: `01001280161`
- Vodafone Cash: `01001280161`

Nutrition add-on (in `PricingClient.tsx` public wizard only): **+200 EGP** (`NUTRITION_ADDON_PRICE`)

### HOME + LIVE (video call sessions per month)
| Plan ID | Sessions | Price (EGP) | Popular |
|---------|----------|-------------|---------|
| `home-live-8` | 8 | 550 | — |
| `home-live-12` | 12 | 780 | — |
| `home-live-16` | 16 | 1000 | ⭐ Yes |
| `home-live-20` | 20 | 1200 | — |

### HOME + SCHEDULE (workout plan days per week)
| Plan ID | Days/Week | Price (EGP) | Popular |
|---------|-----------|-------------|---------|
| `home-sched-2` | 2 | 300 | — |
| `home-sched-3` | 3 | 330 | — |
| `home-sched-4` | 4 | 350 | — |
| `home-sched-5` | 5 | 370 | ⭐ Yes |
| `home-sched-7` | **6** | 400 | — |

⚠️ **Note:** `home-sched-7` has `days: 6` (not 7). The ID was kept as `-7` for Firestore backward compatibility with existing subscriptions.

### GYM + LIVE (video call sessions per month)
| Plan ID | Sessions | Price (EGP) | Popular |
|---------|----------|-------------|---------|
| `gym-live-8` | 8 | 450 | — |
| `gym-live-12` | 12 | 630 | — |
| `gym-live-16` | 16 | 800 | ⭐ Yes |
| `gym-live-20` | 20 | 950 | — |

### GYM + SCHEDULE (workout plan days per week)
| Plan ID | Days/Week | Price (EGP) | Popular |
|---------|-----------|-------------|---------|
| `gym-sched-2` | 2 | 200 | — |
| `gym-sched-3` | 3 | 230 | — |
| `gym-sched-4` | 4 | 350 | — |
| `gym-sched-5` | 5 | 270 | ⭐ Yes |
| `gym-sched-7` | **6** | 300 | — |

⚠️ **Note:** Same as home — `gym-sched-7` has `days: 6`. ID kept for backward compatibility.

---

## 5. Layout Design Standards

### Custom Color Tokens (defined in `src/app/globals.css` via `@theme`)
```css
--color-qwaam-pink: #EC4899          /* Primary buttons, active states, accents */
--color-qwaam-pink-light: #FDF2F8    /* Soft backgrounds, selected card fills */
--color-qwaam-yellow: #FBBF24        /* Badges, highlights, popular markers */
--color-text-main: #111827           /* Primary body text */
--color-text-muted: #4B5563          /* Secondary / placeholder text */
--color-border-light: #F3F4F6        /* Card borders, dividers */
```
**Font:** Cairo (Arabic-optimized), loaded via Google Fonts.

### RTL Layout
All user-facing UI is `dir="rtl"` by default. Arabic is the primary language. Use `dir="ltr"` only for phone numbers, prices, and numeric data.

### Responsive Grid Standard (RenewalWizard — inline wizard widget)
```tsx
// 4 plans (live): 1 perfect row on sm+
<div className="grid gap-3 grid-cols-2 sm:grid-cols-4">

// 5 plans (schedule): 1 perfect row on lg+, 2-col on mobile
<div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">

// Last odd card centering (5-plan case):
// col-span-2 w-[calc(50%-6px)] mx-auto sm:col-span-4 sm:w-[calc(25%-9px)] lg:col-span-1 lg:w-auto lg:mx-0
```

### Responsive Grid Standard (PricingClient — public /packages page)
```tsx
// Wrapper: container mx-auto px-6 max-w-3xl
// Step 3 plan cards (supports both 4 and 5 plans):
<div className="flex flex-wrap justify-center gap-6">
  {plans.map((plan) => (
    <div className="min-w-[150px] flex-1 max-w-[200px]">
      <PlanCard ... />
    </div>
  ))}
</div>
```

### Button Classes
- Primary CTA: `bg-qwaam-pink hover:bg-pink-600 text-white font-black rounded-xl py-3 transition-all`
- Secondary/Back: `bg-white border border-border-light text-text-muted hover:bg-gray-100 font-black rounded-xl`
- Disabled: `disabled:opacity-40 disabled:cursor-not-allowed`

### Card/Section Containers
- Widget cards: `bg-gray-50 border border-border-light rounded-2xl`
- Inner highlight cards: `bg-qwaam-pink-light border border-qwaam-pink/20 rounded-xl p-4`
- White info cards: `bg-white border border-border-light rounded-xl p-3`

### Step Indicator (RenewalWizard)
3-column `grid grid-cols-3 border-b border-border-light` bar:
- Active step: `bg-qwaam-pink text-white`
- Completed step: `bg-green-50 text-green-700` with `✓` prefix
- Future step: `bg-white text-text-muted`

---

## 6. Firestore Collections Reference

| Collection | Key Fields | Security |
|-----------|-----------|---------|
| `users` | uid, role, email, name, sessionTracking, traineeData, subscription, renewalRequest, activeRoomUrl | Self or owning coach |
| `renewal_requests` | traineeUid, planId, amount, proofUrl, status (`pending`\|`fulfilled`), createdAt | — (server-side write only) |
| `messages` | chatId (`coachUid_traineeUid`), senderId, receiverId, text, timestamp | Participants only |
| `exercises` | nameAr, nameEn, targetMuscle, equipment, videoUrl, defaults | Read: any authed; Write: coach |
| `workouts` | titleAr/En, difficulty, duration, exercises[] | Read: any authed; Write: coach |
| `meals` | nameAr/En, type, calories, macros, recipe, imageUrl | Read: any authed; Write: coach |
| `custom_meals` | title, calories, macros, sourceUrl, savedByCoachUid | Read: any authed; Write: owner coach |
| `meal_plans` | coachUid, assignedTo, name, days[], totalCalories | Coach or assigned trainee |
| `progress_logs` | traineeUid, itemId, type, date, status | Trainee or assigned coach |
| `trainee_progress` | traineeUid, date, weight, bodyFat, measurements, photos | Trainee or assigned coach |
| `session_logs` | traineeUid, action, oldValue, newValue, changedBy | Read: trainee+coach; Write: Admin SDK only |
| `discount_leads` | email, phone, discountPercentage, createdAt | Server-side write only |

**Composite Indexes** (`firestore.indexes.json`):
- `renewal_requests`: traineeUid ASC + status ASC

---

## 7. Server Action Auth Pattern

Every server action must start with one of these guards:
```ts
// Coach/Admin routes:
const { uid } = await verifyAdminAccess();

// Trainee routes:
const { uid } = await verifyClientAccess();
```
Both functions read the `__session` HttpOnly cookie, verify with Firebase Admin, and check the user's `role` in Firestore. They throw/return errors if unauthenticated or unauthorized.

---

## 8. Change Log

| Date | Change | Files Modified |
|------|--------|---------------|
| 2026-06-04 | Added `step="0.1"` to weight inputs | `StepBody.tsx`, `EditProfileForm.tsx` |
| 2026-06-04 | Added missing `profile.isPregnant` / `profile.isNursing` translation keys | `ar.json`, `en.json` |
| 2026-06-04 | Built full 3-step `RenewalWizard` with plan selection, payment details, proof upload | `RenewalWizard.tsx` (new), `client-actions.ts`, `admin-actions.ts`, `client/page.tsx` |
| 2026-06-04 | Added `createRenewalRequest` server action; removed auto-trigger actions | `client-actions.ts` |
| 2026-06-04 | `SessionAlert` stripped of all server actions — informational only | `SessionAlert.tsx` |
| 2026-06-04 | Added 4-day plans (350 EGP) to home+gym schedule; renamed 7-day → 6-day label (ID unchanged) | `pricing-config.ts` |
| 2026-06-04 | Fixed "ألفي العجلة" → "لفي العجلة" typo in public pricing | `PricingClient.tsx` |
| 2026-06-04 | Fixed RenewalWizard plan card grid: symmetrical responsive layout with per-breakpoint col math | `RenewalWizard.tsx` |
| 2026-06-04 | Added CLAUDE.md (this file); fixed PricingClient Step 3 grid for 5-plan support | `CLAUDE.md` (new), `PricingClient.tsx` |
| 2026-06-04 | Security audit: hardened `.gitignore` (added `.agent/`, `tsconfig.tsbuildinfo`, `.npm-cache/`, `*_REPORT.md`, `_bmad*/`, `lighthouse-report.json`); documented security rules in CLAUDE.md | `.gitignore`, `CLAUDE.md` |
