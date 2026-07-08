import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendNotification } from '@/actions/notification-actions';
import RenewalReminderTemplate from '@/emails/RenewalReminderTemplate';
import { formatDateRiyadh, ONE_DAY_MS } from '@/lib/date-utils';

// Firebase Admin needs the Node runtime; never pre-render or cache this route.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Daily Vercel Cron (see vercel.json). For month-based (duration-model)
 * Schedule trainees:
 *   1. Send the 7-day "about to end" reminder email (once per period) to those
 *      whose scheduleEndsAt is within the next 7 days and who haven't been
 *      reminded yet (renewalReminderSentAt still null).
 *   2. Flip clearly-expired subs (scheduleEndsAt <= now) to
 *      subscription.status='expired' / sessionTracking.planStatus='finished'
 *      so admin views stay accurate without a client login.
 *
 * Protected by CRON_SECRET: Vercel automatically attaches
 * `Authorization: Bearer <CRON_SECRET>` to cron requests when the env var is set.
 *
 * The Firestore query filters by scheduleEndsAt range only (see the composite
 * index in firestore.indexes.json); renewalReminderSentAt is deduped in code
 * because null + range filters are unreliable.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const now = Date.now();
    const horizon = now + 7 * ONE_DAY_MS;

    // Everyone ending within the next 7 days OR already past their end date.
    // Awaiting subs (scheduleEndsAt = null) are excluded by the range filter.
    const snap = await db
      .collection('users')
      .where('role', '==', 'trainee')
      .where('traineeData.subscription.billingModel', '==', 'duration')
      .where('traineeData.subscription.scheduleEndsAt', '<=', horizon)
      .get();

    const t = await getTranslations({ locale: 'ar', namespace: 'schedule' });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    let reminded = 0;
    let expired = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      const sub = data?.traineeData?.subscription;
      const endsAt: number | null = sub?.scheduleEndsAt ?? null;
      if (endsAt == null) continue;

      // ── Expired: flip once ──────────────────────────────────────────────
      if (endsAt <= now) {
        if (sub?.status !== 'expired') {
          await doc.ref.update({
            'traineeData.subscription.status': 'expired',
            'sessionTracking.planStatus': 'finished',
          });
          expired++;
        }
        continue;
      }

      // ── Within 7 days: remind once per period ───────────────────────────
      if (sub?.renewalReminderSentAt == null) {
        const email = data?.email as string | undefined;
        const name = (data?.name as string | undefined) || 'متدربتنا';
        const endDate = formatDateRiyadh(endsAt, 'ar');

        if (email) {
          await sendNotification({
            to: email,
            subject: t('reminderSubject'),
            template: RenewalReminderTemplate({
              userName: name,
              body: t('reminder', { endDate }),
              ctaUrl: appUrl ? `${appUrl}/client` : undefined,
              ctaLabel: t('renewCta'),
            }),
          });
        }

        await doc.ref.update({
          'traineeData.subscription.renewalReminderSentAt': now,
        });
        reminded++;
      }
    }

    return NextResponse.json({ ok: true, scanned: snap.size, reminded, expired });
  } catch (err) {
    console.error('subscription-reminders cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
