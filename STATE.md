# Qwaam — Project State (Dynamic Memory)

> **Last Updated: 2026-06-15**
> Update this file at the end of every session via `UPDATE MEMORY`.

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

- **`console.log("Busting Vercel Cache - v2")` in `session/route.ts` (P3)**
  - Debug artifact at bottom of file — should be removed before any release

---

## ⏭️ Immediate Next Steps

1. **Fix `ClientsList` Firestore query** — Add composite index in Firebase Console, then restore the indexed `where()` query and remove manual client-side filtering + debug logs.
2. **Wire coach name to Sidebar** — Pass coach `name` (from `decodedClaims` or a Firestore fetch) down through `admin/layout.tsx` → `<Sidebar>` prop.
3. **Implement `unreadCount` increment on trainee-send** — The current system tracks unread reactively but the increment logic (trainee side sending a message) needs verification/implementation in the client portal.
4. **Build `/admin/messages`** — Aggregated messages view (currently nav item exists but route is a stub).
5. **Build `/client` dashboard** — Trainee portal: view assigned workouts/meals, send messages.
