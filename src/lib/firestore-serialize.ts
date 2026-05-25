/**
 * Recursively converts Firestore Admin Timestamps inside an object/array
 * tree into plain numbers (millis since epoch). Used at the
 * server-action -> client-component boundary so React doesn't reject the
 * payload with "Only plain objects... can be passed to Client Components".
 *
 * Detection rule: anything with a callable `.toMillis()` (Firestore
 * Timestamps from both admin and client SDKs) gets converted. Anything
 * with `.toDate()` falls back. Date instances → getTime(). Everything
 * else passes through untouched.
 *
 * Safe to call on arbitrary user-shaped objects — does not mutate input.
 */
export function serializeFirestoreData<T = unknown>(value: T): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Firestore Timestamp (admin or client SDK)
  if (typeof value === 'object' && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  // Native Date (rare, but Firestore Admin sometimes returns these)
  if (value instanceof Date) return value.getTime();

  if (Array.isArray(value)) {
    return value.map(walk);
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = walk(v);
    }
    return out;
  }

  // Primitives — string, number, boolean — pass through
  return value;
}
