'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { DISCOUNT_CAP } from '@/lib/pricing-config';

// ── Weighted Discount Algorithm ────────────────────────────────────────────────
// Weights: 20% → 50%, 25% → 30%, 30% → 15%, 40% → 5%
const DISCOUNT_WEIGHTS = [
  { discount: 20, weight: 50 },
  { discount: 25, weight: 30 },
  { discount: 30, weight: 15 },
  { discount: 40, weight: 5  },
] as const;

function rollDiscount(): number {
  const totalWeight = DISCOUNT_WEIGHTS.reduce((s, d) => s + d.weight, 0); // 100
  const roll = Math.random() * totalWeight;
  let cumulative = 0;
  for (const tier of DISCOUNT_WEIGHTS) {
    cumulative += tier.weight;
    if (roll < cumulative) return tier.discount;
  }
  return DISCOUNT_WEIGHTS[0].discount; // fallback
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function spinDiscountWheel(email: string, phone: string): Promise<
  { success: true; discount: number; isRepeat: boolean } |
  { success: false; error: string }
> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPhone = phone.trim();

  // Basic validation
  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { success: false, error: 'يرجى إدخال بريد إلكتروني صحيح.' };
  }
  if (!trimmedPhone || trimmedPhone.length < 8) {
    return { success: false, error: 'يرجى إدخال رقم هاتف صحيح.' };
  }

  try {
    const db = getAdminDb();
    
    // Check 1: Existing Users (App users collection)
    const usersCol = db.collection('users');
    const existingUser = await usersCol.where('email', '==', trimmedEmail).limit(1).get();
    if (!existingUser.empty) {
      return { success: false, error: 'هذا البريد الإلكتروني مسجل لدينا بالفعل. الخصم متاح للمشتركين الجدد فقط.' };
    }

    // Check 2: Previous Spins (Discount Leads collection)
    const leadsCol = db.collection('discount_leads');
    // Using Promise.all for parallel queries
    const [existingByEmail, existingByPhone] = await Promise.all([
      leadsCol.where('email', '==', trimmedEmail).limit(1).get(),
      leadsCol.where('phone', '==', trimmedPhone).limit(1).get()
    ]);

    if (!existingByEmail.empty) {
      const data = existingByEmail.docs[0].data();
      return { success: true, discount: data.discountPercentage as number, isRepeat: true };
    }
    
    if (!existingByPhone.empty) {
      const data = existingByPhone.docs[0].data();
      return { success: true, discount: data.discountPercentage as number, isRepeat: true };
    }

    // Completely new user: roll and store
    const discountPercentage = rollDiscount();
    await leadsCol.add({
      email: trimmedEmail,
      phone: trimmedPhone,
      discountPercentage,
      createdAt: new Date(),
    });

    return { success: true, discount: discountPercentage, isRepeat: false };

  } catch (err: any) {
    console.error('[spinDiscountWheel] error:', err);
    return { success: false, error: 'حدث خطأ غير متوقع. حاولي مرة أخرى.' };
  }
}

/**
 * Server-authoritative discount lookup for the FIRST-subscription price.
 * ─────────────────────────────────────────────────────────────────────
 * Reads the real discount the wheel recorded at spin time from
 * `discount_leads` — NEVER from anything the client/URL sent. Matches a lead
 * by email (trimmed + lowercased, exactly as `spinDiscountWheel` stores it) OR
 * by phone (trimmed). Guarantees:
 *   - No matching lead (spun with a different contact, or never spun) → 0
 *     (official price). Fully automatic, no coach approval.
 *   - Multiple matching leads with differing values → take the LOWEST, to be
 *     safe (never hand out the more generous one on ambiguity).
 *   - Hard cap at DISCOUNT_CAP (40%) regardless of what is stored.
 *   - Any error → 0 (fail closed to official price).
 *
 * Returns an integer-ish percentage in [0, 40].
 */
export async function getRecordedDiscount(
  email?: string | null,
  phone?: string | null,
): Promise<number> {
  const trimmedEmail = (email ?? '').trim().toLowerCase();
  const trimmedPhone = (phone ?? '').trim();
  if (!trimmedEmail && !trimmedPhone) return 0;

  try {
    const db = getAdminDb();
    const leads = db.collection('discount_leads');

    const [byEmail, byPhone] = await Promise.all([
      trimmedEmail ? leads.where('email', '==', trimmedEmail).get() : null,
      trimmedPhone ? leads.where('phone', '==', trimmedPhone).get() : null,
    ]);

    const values: number[] = [];
    for (const snap of [byEmail, byPhone]) {
      if (!snap) continue;
      for (const doc of snap.docs) {
        const v = Number(doc.data().discountPercentage);
        if (Number.isFinite(v) && v > 0) values.push(v);
      }
    }
    if (!values.length) return 0;

    // Lowest on ambiguity + hard cap at 40%.
    const lowest = Math.min(...values);
    return Math.max(0, Math.min(lowest, DISCOUNT_CAP));
  } catch (err) {
    console.error('[getRecordedDiscount] error (failing closed to 0):', err);
    return 0;
  }
}
