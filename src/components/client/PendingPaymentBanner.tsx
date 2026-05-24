import { CurrencyDollarIcon } from '@heroicons/react/24/solid';

interface Props {
  amountPaid?: string | null;
}

/**
 * Persistent banner shown at the top of the client dashboard while the
 * trainee's subscription status is still 'pending_payment'. Repeats the
 * payment instructions from the onboarding success screen so the trainee
 * doesn't lose the transfer number after they navigate away.
 */
export default function PendingPaymentBanner({ amountPaid }: Props) {
  return (
    <section
      dir="rtl"
      className="bg-gradient-to-r from-qwaam-yellow/20 via-qwaam-yellow/10 to-transparent border-2 border-qwaam-yellow rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden"
    >
      {/* Stripe accent on the right edge */}
      <div className="absolute top-0 right-0 w-1.5 h-full bg-qwaam-yellow" />

      <div className="flex items-start gap-4 relative">
        <div className="w-12 h-12 rounded-2xl bg-qwaam-yellow text-text-main flex items-center justify-center shrink-0 shadow-sm">
          <CurrencyDollarIcon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-black text-text-main text-base sm:text-lg">
              في انتظار تأكيد الدفع
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-black uppercase tracking-wider">
              معلّقة
            </span>
          </div>

          <p className="text-sm font-bold text-text-main leading-relaxed">
            لإتمام تفعيل حسابك، يرجى تحويل
            {amountPaid && (
              <>
                {' '}
                <span className="text-qwaam-pink font-black" dir="ltr">{amountPaid} EGP</span>{' '}
              </>
            )}
            {!amountPaid && ' مبلغ الباقة '}
            عبر <span className="font-black">InstaPay</span> أو محفظة إلكترونية على الرقم:
          </p>

          <div className="mt-3 inline-flex items-center gap-3 bg-white border-2 border-dashed border-qwaam-pink rounded-xl px-4 py-2.5">
            <span className="text-xl sm:text-2xl font-black text-qwaam-pink tracking-wide select-all" dir="ltr">
              01001280161
            </span>
            <span className="text-[10px] font-bold text-text-muted leading-tight max-w-[120px]">
              اضغطي مطوّلاً للنسخ
            </span>
          </div>

          <p className="text-[11px] font-bold text-text-muted mt-3 leading-relaxed">
            سيتم تفعيل المحتوى تلقائياً بمجرد مراجعة المدرّب للتحويل.
          </p>
        </div>
      </div>
    </section>
  );
}
