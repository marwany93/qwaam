'use server';

/**
 * Spoonacular Recipe API integration.
 *
 * Free tier = 50 points/day. complexSearch with addRecipeInformation
 * and addRecipeNutrition costs ~1 base point + 0.01 per result returned,
 * plus 0.05 for nutrition per result. With number=10 each call is ≈ 1.6 points,
 * so ~30 searches/day max. Keep number low.
 */

import { verifyAdminAccess } from '@/lib/auth-utils';

export interface SpoonacularNutrient {
  name: string;
  amount: number;
  unit: string;
}

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  sourceUrl?: string;
  sourceName?: string;
  readyInMinutes?: number;
  servings?: number;
  nutrition?: {
    nutrients: SpoonacularNutrient[];
  };
}

export interface SearchResult {
  success: boolean;
  data?: SpoonacularRecipe[];
  error?: string;
}

export async function searchRecipes(query: string): Promise<SearchResult> {
  // Gate behind admin access — trainees don't hit this directly.
  // Remove this line if you later expose the search to trainees too.
  await verifyAdminAccess();

  const trimmed = query?.trim();
  if (!trimmed) {
    return { success: false, error: 'يرجى إدخال كلمة بحث.' };
  }

  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    console.error('[spoonacular] SPOONACULAR_API_KEY is not set');
    return { success: false, error: 'Spoonacular API key is not configured.' };
  }

  const params = new URLSearchParams({
    apiKey,
    query: trimmed,
    addRecipeInformation: 'true',
    addRecipeNutrition: 'true',
    number: '10',
  });

  const url = `https://api.spoonacular.com/recipes/complexSearch?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      // Cache results for 1 hour — identical queries inside the window
      // do not burn quota points.
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      // 402 = quota exhausted, 401 = bad key, 429 = rate limit
      let userMessage = 'فشل البحث في Spoonacular.';
      if (res.status === 402) userMessage = 'تم استهلاك الحصة اليومية من Spoonacular. حاول غداً.';
      else if (res.status === 401) userMessage = 'مفتاح Spoonacular غير صالح.';
      else if (res.status === 429) userMessage = 'تجاوزت الحد المسموح من الطلبات. أعد المحاولة لاحقاً.';

      const body = await res.text().catch(() => '');
      console.error(`[spoonacular] ${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
      return { success: false, error: userMessage };
    }

    const json = await res.json();
    const results: SpoonacularRecipe[] = Array.isArray(json?.results) ? json.results : [];
    return { success: true, data: results };
  } catch (err: any) {
    console.error('[spoonacular] fetch failed:', err);
    return { success: false, error: 'حدث خطأ أثناء الاتصال بـ Spoonacular.' };
  }
}
