import type { QwaamUser } from '@/types';

type Subscription = NonNullable<NonNullable<QwaamUser['traineeData']>['subscription']>;

/**
 * Derived, read-only. True when a trainee has PAID and ACTIVATED a month-based
 * (duration model) Schedule plan but the coach hasn't uploaded the schedule yet
 * — so `scheduleStartAt` is still null and the subscription month hasn't started.
 *
 * Used to surface a coach-facing "awaiting schedule" indicator so a coach doesn't
 * forget to upload a schedule (which would leave the trainee's month never
 * starting). Excludes Live plans, legacy session-model trainees, and trainees
 * whose schedule is already anchored.
 */
export function isAwaitingScheduleUpload(
  subscription: Subscription | null | undefined,
): boolean {
  if (!subscription) return false;
  return (
    subscription.billingModel === 'duration' &&
    subscription.status === 'active' &&
    (subscription.scheduleStartAt === null || subscription.scheduleStartAt === undefined)
  );
}
