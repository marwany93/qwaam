'use client';

import { useMemo, type ReactNode } from 'react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartBarIcon } from '@heroicons/react/24/solid';
import type { ProgressEntry } from '@/types';

interface Props {
  data: ProgressEntry[];
  /** Optional slot rendered inside the empty state — used by the trainee
   *  wrapper to inject a "log first entry" button. Omit on admin views. */
  emptyCta?: ReactNode;
  /** Card title; default: "منحنى الوزن" */
  title?: string;
}

// Arabic short month names — built once, not per render
const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const formatArabicDate = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
};

// Custom tooltip — styled card matching the dashboard aesthetic.
// Typed loosely: Recharts 3.x's exported TooltipProps no longer declares
// `payload`, but the runtime contract is unchanged — Recharts injects
// `active` and `payload` when the cursor hovers a data point.
interface TooltipShape {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { dateMs: number } }>;
}
function ChartTooltip({ active, payload }: TooltipShape) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  // Defensive: only render once Recharts has actually injected a value
  // (active can flicker true with an empty value during fast cursor moves)
  if (point.value == null || typeof point.value !== 'number') return null;

  const weight = point.value;
  const dateMs = point.payload?.dateMs ?? 0;

  return (
    <div
      dir="rtl"
      // z-50 + solid white bg + ring keeps the tooltip readable above the
      // gradient fill and dots even when the cursor sits on the line
      className="relative z-50 bg-white px-4 py-3 rounded-xl shadow-xl ring-1 ring-border-light min-w-[160px] pointer-events-none"
    >
      <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">
        {formatArabicDate(dateMs)}
      </p>
      <p className="font-black text-text-main text-lg leading-none">
        الوزن:{' '}
        <span className="text-qwaam-pink">{weight.toFixed(1)}</span>{' '}
        <span className="text-xs font-bold text-text-muted">كجم</span>
      </p>
    </div>
  );
}

export default function WeightChart({ data, emptyCta, title = 'منحنى الوزن' }: Props) {
  // Chart needs ASC by date for a left-to-right line. getProgressHistory
  // returns DESC (newest first), so we reverse here. Also pre-format the
  // X-axis label and pass through dateMs for the tooltip.
  const chartData = useMemo(() => {
    return [...data]
      .reverse()
      .map((entry) => ({
        dateMs: entry.date,
        dateLabel: formatArabicDate(entry.date),
        weight: entry.weight,
      }));
  }, [data]);

  // ── Empty state (0 or 1 entries — single point can't draw a line) ──
  if (chartData.length < 2) {
    return (
      <section
        dir="rtl"
        className="bg-gradient-to-br from-qwaam-pink-light/30 via-white to-yellow-50/40 rounded-3xl border border-border-light shadow-sm p-8 sm:p-10"
      >
        <div className="flex flex-col items-center text-center gap-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-qwaam-pink-light text-qwaam-pink flex items-center justify-center border border-qwaam-pink/20 shadow-sm">
            <ChartBarIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main mb-2">
              {chartData.length === 0 ? 'لا يوجد بيانات للرسم بعد' : 'بداية رحلتك مسجّلة!'}
            </h3>
            <p className="font-bold text-text-muted text-sm leading-relaxed">
              {chartData.length === 0
                ? 'ابدئي بتسجيل وزنك الأول لتري منحنى تقدمك هنا!'
                : 'سجّلي قياساً آخر لرسم منحنى تقدمك. نحتاج نقطتين على الأقل لعرض الرسم البياني.'}
            </p>
          </div>
          {emptyCta}
        </div>
      </section>
    );
  }

  // Pad Y-axis 1 kg above/below the observed range for visual breathing room
  const weights = chartData.map((d) => d.weight);
  const yMin = Math.floor(Math.min(...weights) - 1);
  const yMax = Math.ceil(Math.max(...weights) + 1);

  return (
    <section
      dir="rtl"
      className="bg-white rounded-3xl border border-border-light shadow-sm p-6 sm:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-qwaam-pink-light text-qwaam-pink flex items-center justify-center border border-qwaam-pink/20">
            <ChartBarIcon className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-black text-text-main">{title}</h3>
            <p className="text-xs font-bold text-text-muted">{chartData.length} قياس مسجّل</p>
          </div>
        </div>
      </div>

      {/* Chart — fixed height so the layout doesn't reflow during data updates */}
      <div className="w-full h-64 sm:h-72" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
            <defs>
              {/* Soft pink gradient — strong at top of curve, fading to nothing at baseline */}
              <linearGradient id="weight-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e91e63" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#e91e63" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              // Use the raw timestamp as the unique data key so each entry
              // is its own X-axis point — even when two were logged on the
              // same calendar day. The tickFormatter still shows the
              // friendly Arabic date for tick labels.
              dataKey="dateMs"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(ms: number) => formatArabicDate(ms)}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={36}
              unit=" "
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: '#e91e63', strokeWidth: 1, strokeDasharray: '4 4' }}
              // Disable Recharts' built-in tooltip transition so values
              // never lag behind the cursor / "ghost" the previous point
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 50, outline: 'none' }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#e91e63"
              strokeWidth={2.5}
              fill="url(#weight-gradient)"
              animationDuration={800}
              animationEasing="ease-out"
              dot={{ r: 3, fill: '#e91e63', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#e91e63', strokeWidth: 3, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
