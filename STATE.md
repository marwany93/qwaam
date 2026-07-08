# Qwaam — Project State (Dynamic Memory)

> **Last Updated: 2026-07-08**
> Update this file at the end of every session via `UPDATE MEMORY`.

---

## ✅ Recently Completed

- **Issue #3 — Manual meal plans connected to the client (Path B)** (2026-07-08)
  - **Path B**: `meal_plans` is now the source of the trainee's diet and is read by the client. Revived the previously-dead `MealPlanBuilder`; supports single-day and multi-day plans, manual authoring, and the +200 EGP nutrition gate is now actually enforced.
  - **Data model** (`types/index.ts`): `MealPlanMealRow` (new) enriches each plan row with `description` + full macros (`protein`/`carbs`/`fats`, plural) + a stable `id` + `source`. `MealPlanDay.meals` is now `MealPlanMealRow[]`. `MealPlan` gains optional plan-level `eatingWindow?: {start,end}` ("HH:MM" 24h). Legacy rows (`mealName`, no macros) stay readable — normalized to `description ?? mealName ?? '—'`, missing macros → 0. No migration.
  - `src/lib/meal-utils.ts` (new) — `normalizeMealRow`, `sumMacros`, `fastingHours` (24 − eating-window length, handles overnight). Pure, shared by builder + client table.
  - **Row ids**: minted once server-side in `createMealPlan` as `row_<uuid>`; client `tmp-*` placeholders are always reassigned; existing `row_*` ids preserved across edits/reorders. Adherence logs keyed `plan:{planId}:{rowId}` (never reuse a meal-doc id).
  - **Actions** (`meal-plan-actions.ts`): `createMealPlan` normalizes rows (coerces macros, maps singular `fat`→`fats` at the saved-meal boundary), persists `eatingWindow`, recomputes totals server-side. New `getAssignedMealPlan()` — **gate enforcement point #1**: reads `subscription.dietAdded`, returns `{dietAdded:false, plan:null}` WITHOUT querying `meal_plans` when locked; else returns newest assigned plan (sorted in memory, no index). Uses Admin SDK (bypasses rules).
  - **Coach UI** (`MealPlanBuilder.tsx`): manual rows (mealType + description + 4 macros typed directly), saved-meal dropdown prefills a new row (`fat`→`fats`), optional eating-window inputs, add/remove days. All strings via the `nutrition` i18n namespace.
  - **Client UI**: `MealPlanTable.tsx` (new) — desktop table / mobile stacked cards, eating-window header, day selector only when `days.length>1`, per-row adherence toggle, daily total row. `client/page.tsx` Diet Module — **gate enforcement point #2**: locked/upsell when `!dietAdded`; table when a plan exists; legacy `assignedMeals` cards as grandfather fallback; else awaiting state. Today-summary meal counts mirror the same source.
  - New `nutrition` i18n namespace (ar + en). `tsc --noEmit` clean per commit (6 commits). `meals` library + `assignedMeals` path left intact (fallback + Spoonacular saving). Dead `AddMealModal.tsx` left untouched.

- **Issue #2 — Muscle-group exercise library** (2026-07-08)
  - `TargetMuscle` enum expanded to the canonical taxonomy (Chest, Back, Trapezius, Shoulders, Biceps, Triceps, Forearms, Abs, Core, Glutes, Quadriceps, Hamstrings, Adductors, Abductors, Calves, Full Body, Cardio) + legacy `Legs`/`Arms` kept valid. **No backfill** — legacy-tagged exercises stay until re-tagged via the edit form.
  - `src/lib/exercise-taxonomy.ts` (new) — `MUSCLE_ORDER`, `MUSCLE_FORM_OPTIONS` (excludes legacy), `MUSCLE_AR`, `EQUIPMENT_AR`, `EQUIPMENT_LIST`, `muscleLabel`/`equipmentLabel`. Single source shared by form/browser/picker. Storage stays English; Arabic is display-only.
  - `src/components/admin/library/ExerciseBrowser.tsx` (new) — reusable muscle-grouped accordion (hides empty groups, legacy last with badge), equipment filter chips, text search. `view` mode (edit/delete) for the Exercises tab; `select` mode (toggle) for the workout builder.
  - `LibraryContent.tsx` — Exercises tab uses ExerciseBrowser; add/edit dropdowns localized (no legacy options); inline `AddWorkoutModal` picker replaced with the select-mode browser (build+assign flow unchanged).
  - Deleted dead `src/components/admin/AddWorkoutModal.tsx`. New `library` i18n namespace (ar+en). `tsc --noEmit` clean per commit.

- **Coach "awaiting schedule" indicator** (2026-07-08)
  - Derived, read-only badge ("لم يُرفع الجدول بعد" / "No schedule yet") for trainees who PAID + activated a month-based schedule plan but whose schedule hasn't been uploaded yet (`billingModel==='duration'` + `status==='active'` + `scheduleStartAt` null).
  - `src/lib/subscription-utils.ts` (new) — `isAwaitingScheduleUpload(subscription)`.
  - Shown in `ClientsList.tsx` (status column) and `AssignmentsTab.tsx` header (prop threaded via `TraineeTabsWrapper` from `admin/client/[id]/page.tsx`).
  - New `coach` i18n namespace (ar + en). Uses existing qwaam-yellow/amber tokens. `tsc --noEmit` clean.

- **Issue #1 — Month-based Schedule subscriptions** (2026-07-08)
  - Scope: only Schedule plans (have `days`, no `sessions`) move to a one-calendar-month duration model; **Live plans untouched**. Discriminator: `isSchedulePlan(planId)` in `pricing-config.ts`.
  - `types/index.ts` — subscription gains `billingModel`, `scheduleStartAt`, `scheduleEndsAt`, `renewalReminderSentAt`.
  - `src/lib/date-utils.ts` (new) — `addOneMonth` (Asia/Riyadh, calendar-month clamp), `formatDateRiyadh`, `ONE_DAY_MS`.
  - Lifecycle server actions branch schedule → duration: `confirmTraineePayment`, `submitOnboarding` (stays `pending_payment` until coach confirms), `renewTraineePlan` (resets period + migrates grandfathered legacy clients). `assignWorkout` anchors `scheduleStartAt`/`scheduleEndsAt` **once** on the coach's first upload.
  - Client UI: `ScheduleStatusCard.tsx` + `ScheduleAlert.tsx` (new) render dates instead of session counts; `client/page.tsx` branches by `billingModel`. New `schedule` i18n namespace in `ar.json` + `en.json` (ar + en).
  - Vercel Cron: `vercel.json` + `src/app/api/cron/subscription-reminders/route.ts` (nodejs, `CRON_SECRET`-guarded) — 7-day reminder email (`RenewalReminderTemplate.tsx`) + expiry flip. Composite index added to `firestore.indexes.json` (`users`: role + subscription.billingModel + subscription.scheduleEndsAt).
  - **New env var: `CRON_SECRET`** (Vercel + local `.env`).
  - Grandfather: no migration/backfill — legacy schedule clients keep session-count UI until they renew.
  - TypeScript: `tsc --noEmit` clean per commit.

---

## ✅ Recently Completed

- **6-Step Onboarding Wizard** (Session: ef19391e)
  - Installed: `react-hook-form`, `zod`, `@hookform/resolvers`, `framer-motion`
  - `src/lib/onboarding-schema.ts` — per-field Zod schema + `fullOnboardingSchema`; `STEP_FIELDS[]` array for scoped `trigger()` calls
  - `src/types/index.ts` — `OnboardingFormData`, `MaritalStatus`, `PrimaryGoal` types added
  - `src/lib/firebase.ts` — `storage` export added (`getStorage`)
  - `src/actions/onboarding-actions.ts` — `checkEmailExists()` Server Action via firebase-admin
  - `src/components/onboarding/ui/FormField.tsx` — shared `FormField`, `BooleanToggle`, `CheckboxItem` primitives
  - `src/components/onboarding/StepEmail.tsx` — Step 1: email with async gatekeeper
  - `src/components/onboarding/StepPersonal.tsx` — Step 2: personal info, conditional marriage checkboxes
  - `src/components/onboarding/StepHealth.tsx` — Step 3: injuries, chronic diseases grid, smoking toggle
  - `src/components/onboarding/StepGoals.tsx` — Step 4: goal cards, days slider, supplements
  - `src/components/onboarding/StepBody.tsx` — Step 5: weight/height, file uploads w/ preview, measurements accordion
  - `src/components/onboarding/StepAccount.tsx` — Step 6: password w/ strength meter + show/hide
  - `src/components/onboarding/OnboardingWizard.tsx` — master orchestrator: FormProvider, framer-motion slide transitions, Firebase Auth+Storage+Firestore transaction
  - `src/app/[locale]/onboarding/page.tsx` — route at `/onboarding`
  - `messages/ar.json` + `messages/en.json` — full `onboarding` i18n namespace added
  - TypeScript: 0 errors confirmed (`tsc --noEmit`)

---

## ✅ Recently Completed

- **Real-Time Notification System** (Session: 2924c073)
  - `users/{uid}.traineeData.unreadCount` field established as atomic counter
  - `TraineeChat.tsx` — resets `unreadCount` to `0` on chat open (via `updateDoc` in message `useEffect`)
  - `ClientsList.tsx` — per-trainee unread badge on avatar + dot on chevron (live `onSnapshot`)
  - `Sidebar.tsx` — summed `totalUnread` badge on "Trainees" and "Messages" nav items (live `onSnapshot`)

- **Vercel Edge Deployment Fix** (Session: 8079f744)
  - Removed `__dirname` / Node globals from i18n message loading
  - Refactored to use standard dynamic imports for i18n
  - Set routing to `as-needed` locale prefix
  - `session/route.ts` explicitly declared `export const runtime = 'nodejs'`
  - Middleware confirmed Edge-safe (no firebase-admin imports)

- **Firebase Admin dual-mode init** (pre-history)
  - Local: reads `firebase-key.json` via `require()`
  - Production: reads `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` env vars

---

## 🐛 Active Bugs / Tech Debt

- **`ClientsList.tsx` — Missing Firestore composite index (P1) — ✅ RESOLVED (2026-06-15)**
  - The composite index `(role ASC, traineeData.assignedCoachUid ASC, createdAt DESC)` now exists in `firestore.indexes.json`.
  - `ClientsList.tsx` now uses the proper server-side indexed query: `query(collection(db,'users'), where('role','==','trainee'), where('traineeData.assignedCoachUid','==',coachUid), orderBy('createdAt','desc'))` — no more full-collection read / client-side coach filtering. (Local `useMemo` filtering remains, but only for the in-page search box, not for coach scoping.)

- **`TraineeChat.tsx` — Unread reset fires on every message render, not just initial open (P2)**
  - `updateDoc` resetting `unreadCount` is inside `useEffect([messages])` — fires on every new message received
  - Acceptable for now but causes unnecessary writes; should be tied to tab-focus or mount only

- **`Sidebar.tsx` — Coach avatar is hardcoded as `"C"` (P3)**
  - Should display actual coach name initial from decoded session claims
  - No coach name is passed to `Sidebar` currently

- **`console.log("Busting Vercel Cache - v2")` in `session/route.ts` (P3) — ✅ RESOLVED (2026-06-15)**
  - Debug artifact removed. (Note: a decorated `console.error("🚨 🔥 SERVER ERROR DETAILS:", ...)` remains inside the POST catch block — legitimate error logging, left in place.)

- **InstaPay-only payment copy — ✅ DONE (2026-06-15)**
  - Payment flow is InstaPay-only. Removed leftover "Vodafone Cash / محفظة إلكترونية / e-wallet" wording from `transferInstruction` (ar+en) and `PendingPaymentBanner.tsx`. `RenewalWizard.tsx` is the canonical reference. Remaining mentions of "wallet" are code comments only (storage.rules, admin-actions.ts, OnboardingWizard.tsx).

---

## ⏭️ Immediate Next Steps

1. **Wire coach name to Sidebar** — Pass coach `name` (from `decodedClaims` or a Firestore fetch) down through `admin/layout.tsx` → `<Sidebar>` prop.
2. **Implement `unreadCount` increment on trainee-send** — The current system tracks unread reactively but the increment logic (trainee side sending a message) needs verification/implementation in the client portal.
3. **Build `/admin/messages`** — Aggregated messages view (currently nav item exists but route is a stub).
4. **Build `/client` dashboard** — Trainee portal: view assigned workouts/meals, send messages.
