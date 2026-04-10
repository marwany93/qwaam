# Qwaam — Software Requirements Specification (SRS)

> **STATUS: Living document. Treat as immutable source of truth for architecture and business rules.**

---

## 1. System Overview

**Qwaam** is a bilingual (Arabic-first, RTL) online fitness coaching platform connecting Coaches with Trainees. It is a Next.js 14+ App Router application deployed on Vercel.

### Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (custom design tokens) |
| Auth | Firebase Auth (Custom Claims via firebase-admin) |
| Database | Cloud Firestore |
| Session | HttpOnly Cookie (`qwaam_session`) — 14-day expiry |
| i18n | next-intl (`ar` default, `en` secondary), `as-needed` prefix |
| Deployment | Vercel (Node.js runtime for all admin API routes) |
| Fonts | Cairo (Arabic/RTL), Inter (English/LTR) |

---

## 2. User Roles & Auth Flow

### Roles
- **`coach`** — Admin portal access (`/admin/**`). Manages trainees, library, chat.
- **`trainee`** — Client portal access (`/client/**`). Views assigned workouts/meals, chats with coach.

### Auth Flow
1. User logs in via Firebase Client SDK → receives short-lived `idToken`.
2. Client POSTs `idToken` to `POST /api/auth/session`.
3. `firebase-admin` exchanges token for a long-lived session cookie (`qwaam_session`, 14 days).
4. All subsequent page routes validate the session cookie server-side via `firebase-admin.verifySessionCookie()`.
5. Role is enforced via Firebase Custom Claims (`decodedClaims.role`).
6. Logout: `DELETE /api/auth/session` clears the cookie → redirect to `/login`.

### Auth Utilities
- `src/lib/firebase-admin.ts` — Initializes Admin SDK. Local: JSON key file. Production: env vars.
- `src/lib/auth-utils.ts` — `verifyAdminAccess()` (coach) and `verifyClientAccess()` (trainee).
- `src/app/api/auth/session/route.ts` — Session create/destroy API. **Runtime: nodejs** (NOT Edge).

---

## 3. Firestore Schema

### Collection: `users`
```
users/{uid}
  uid: string
  role: 'coach' | 'trainee'
  name: string
  email: string
  createdAt: Timestamp
  traineeData?: {
    assignedCoachUid: string        // Links trainee to coach
    unreadCount: number             // Atomic counter — messages from trainee coach hasn't read
    assignedWorkouts: string[]      // Array of Workout IDs
    assignedMeals: string[]         // Array of Meal IDs
    progress?: Record<string, any>  // Expandable metrics map
  }
```

### Collection: `messages`
```
messages/{messageId}
  chatId: string      // Format: "{coachUid}_{traineeUid}" — always coach first
  senderId: string
  receiverId: string
  text: string
  timestamp: Timestamp
```

### Collection: `workouts` (Library)
```
workouts/{workoutId}
  titleAr: string
  titleEn: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number (minutes)
  exercises: WorkoutExercise[]
  createdAt: Timestamp
```

### Collection: `meals` (Library)
```
meals/{mealId}
  nameAr: string
  nameEn: string
  calories: number
  macros: { protein, carbs, fats }
  imageUrl?: string
  createdAt: Timestamp
```

---

## 4. Route Architecture

### Public Routes (`/(public)`)
- `/` — Marketing landing page
- `/login` — Auth page (Firebase Client SDK)

### Admin Portal (`/admin/**`) — role: `coach`
- `/admin` — Dashboard: Trainee roster with real-time unread badges
- `/admin/library` — Manage workout/meal library
- `/admin/client/[uid]` — Individual trainee detail: tabs (Assignments, Chat, Progress)
- `/admin/messages` — Aggregated messages view (TBD)
- `/admin/settings` — Coach settings (TBD)

### Client Portal (`/client/**`) — role: `trainee`
- `/client` — Trainee dashboard (assigned workouts/meals)

### Auth boundary enforced at layout level:
- `src/app/[locale]/admin/layout.tsx` — `verifySessionCookie` + `role === 'coach'`
- `src/app/[locale]/client/layout.tsx` (assumed) — `role === 'trainee'`

---

## 5. Real-Time Notification System

### Architecture
- **Source of truth**: `users/{traineeUid}.traineeData.unreadCount` (Firestore atomic field)
- **Increment**: When a trainee sends a message (`addDoc` to `messages`), `unreadCount` is incremented via `updateDoc` with `increment(1)`.
- **Reset**: When coach opens `TraineeChat`, `useEffect` on message-load fires `updateDoc(users/{traineeUid}, { 'traineeData.unreadCount': 0 })`.
- **Reactive UI**:
  - `Sidebar.tsx` — `onSnapshot` on all coach's trainees → summed `totalUnread` badge on nav items.
  - `ClientsList.tsx` — `onSnapshot` on all coach's trainees → per-trainee avatar badge + chevron dot.

### Current `ClientsList` Query Note
The query currently fetches the **entire `users` collection** without server-side filters (workaround for missing Firestore composite index) and filters manually client-side. This is a **known tech debt** — must be replaced with a proper indexed query.

---

## 6. i18n Architecture (next-intl)
- Locales: `ar` (default), `en`
- Strategy: `as-needed` prefix — Arabic routes have no `/ar/` prefix; English routes use `/en/`.
- Middleware: Uses `createMiddleware(routing)` — Edge-compatible (no firebase-admin here).
- Message files: `messages/ar.json`, `messages/en.json`
- Navigation: Always import `Link`, `usePathname`, `redirect` from `@/i18n/navigation`.

---

## 7. Key Constraints & Invariants
1. `firebase-admin` can **ONLY** run in `nodejs` runtime — never Edge. All routes importing it must have `export const runtime = 'nodejs'`.
2. `firebase-admin` initialization: tries local JSON key first, falls back to env vars (Vercel production).
3. `chatId` is always formatted as `{coachUid}_{traineeUid}` — coach UID first. Never reverse.
4. Session cookie name: `qwaam_session`. Cookie is `HttpOnly`, `SameSite: lax`, `Secure` in production.
5. All admin Server Actions must call `verifyAdminAccess()` from `auth-utils.ts` at the top.
6. Firestore rules must match schema — `unreadCount` increments must be allowed for `trainee` senders.
