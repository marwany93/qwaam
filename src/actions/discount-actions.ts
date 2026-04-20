'use server';

import { getAdminDb } from '@/lib/firebase-admin';

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
