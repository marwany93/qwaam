'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { useRef } from 'react';
import Image from 'next/image';
import { getPlans } from '@/lib/pricing-config';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Translations {
  tagline: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroCta: string;
  heroCtaSecondary: string;
  featuresTitle: string;
  features: { emoji: string; title: string; desc: string; span?: 'wide' | 'normal' }[];
}

// ── Animation Variants ─────────────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

const bentoVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: EASE },
  },
};

// ── Stats for the marquee ──────────────────────────────────────────────────────
const STATS = [
  { label: 'متدربة نشطة', value: '+500' },
  { label: 'باقة مكتملة', value: '+1,200' },
  { label: 'كوتش متخصص', value: '12' },
  { label: 'خطة غذائية', value: '+800' },
  { label: 'تحول مُلهم', value: '+300' },
  { label: 'نجمة تقييم', value: '4.9 ⭐' },
];

// ── Marquee Component ──────────────────────────────────────────────────────────
function InfiniteMarquee() {
  const items = [...STATS, ...STATS]; // doubled for seamless loop

  return (
    <div
      dir="ltr"
      className="w-full overflow-hidden bg-qwaam-pink py-5 border-y border-pink-400/30"
      aria-hidden="true"
    >
      <motion.div
        className="flex gap-16 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
      >
        {items.map((stat, i) => (
          <div
            key={i}
            className="flex items-center gap-4 text-white shrink-0"
          >
            <span className="text-2xl font-black tracking-tight">{stat.value}</span>
            <span className="text-pink-100 text-sm font-semibold">{stat.label}</span>
            <span className="text-pink-200/50 text-xl select-none">✦</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Bento Card ─────────────────────────────────────────────────────────────────
interface BentoCardProps {
  emoji: string;
  title: string;
  desc: string;
  bgImage: string;
  wide?: boolean;
  accent?: boolean;
  delay?: number;
}

function BentoCard({ emoji, title, desc, bgImage, wide, accent, delay = 0 }: BentoCardProps) {
  return (
    <motion.div
      variants={bentoVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      custom={delay}
      whileHover={{ scale: 1.025, transition: { duration: 0.25 } }}
      className={`
        relative overflow-hidden rounded-2xl group border-2 border-border-light hover:border-qwaam-pink/50 transition-colors duration-300 p-8 flex flex-col min-h-[320px]
        ${wide ? 'md:col-span-2' : ''}
      `}
    >
      <Image
        src={bgImage}
        alt={title}
        fill
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

      {/* Content wrapper with relative z-20 text-white */}
      <div className="relative z-20 text-white flex flex-col h-full justify-between">
        <div className="absolute -bottom-8 -end-8 w-36 h-36 rounded-full blur-2xl transition-opacity duration-500 opacity-0 group-hover:opacity-100 bg-qwaam-pink/30 pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm bg-white/20 backdrop-blur-md">
          {emoji}
        </div>

        <div>
          <h3 className="text-2xl font-black mb-2 leading-snug">
            {title}
          </h3>
          <p className="text-sm font-medium leading-relaxed text-gray-200">
            {desc}
          </p>
        </div>

        {accent && (
          <div className="absolute top-0 start-0 px-3 py-1 bg-white/25 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
            أبرز ميزة
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Pricing Preview Section ────────────────────────────────────────────────────
function PricingPreview() {
  // Show the home + live plans as the flagship offering
  const plans = getPlans('home', 'live');

  return (
    <section id="pricing" className="bg-white py-28 px-6">
      <div className="container mx-auto max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <p className="text-xs font-black text-qwaam-pink uppercase tracking-widest mb-3">
            شفافية كاملة
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-text-main leading-tight mb-4">
            باقاتنا التدريبية
          </h2>
          <p className="text-text-muted font-medium max-w-xl mx-auto">
            حصص لايف مع مدربك المختص — اختاري الباقة المناسبة لك وابدأي رحلتك اليوم.
          </p>
        </motion.div>

        {/* Plan Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className={`
                relative flex flex-col items-center p-6 rounded-2xl border-2 text-center transition-all duration-300
                ${plan.popular
                  ? 'border-qwaam-pink bg-qwaam-pink-light shadow-lg shadow-qwaam-pink/15'
                  : 'border-border-light bg-white hover:border-qwaam-pink/40 hover:shadow-md'
                }
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-qwaam-yellow text-[10px] font-black text-text-main shadow-sm whitespace-nowrap">
                  ⭐ الأكثر طلباً
                </div>
              )}
              <p className="text-sm font-bold text-text-muted mb-1 mt-2">حصص لايف</p>
              <p className="text-3xl font-black text-text-main mb-1">{plan.sessions}</p>
              <p className="text-xs text-text-muted font-medium mb-4">حصة / شهر</p>
              <div className="mt-auto">
                <span className={`text-2xl font-black ${plan.popular ? 'text-qwaam-pink' : 'text-text-main'}`}>
                  {plan.price}
                </span>
                <span className="text-sm font-bold text-text-muted mr-1">ج.م</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-qwaam-pink text-white font-black text-lg shadow-lg shadow-qwaam-pink/25 hover:-translate-y-1 hover:shadow-qwaam-pink/40 transition-all duration-300"
          >
            اكتشفي كل الباقات ←
          </Link>
          <p className="text-xs text-text-muted font-medium">
            يتوفر أيضاً باقات جدول أسبوعي وتدريب في الجيم
          </p>
        </div>

      </div>
    </section>
  );
}

// ── Main HomeClient Component ──────────────────────────────────────────────────
export default function HomeClient({
  tagline,
  heroTitle,
  heroTitleAccent,
  heroSubtitle,
  heroCta,
  heroCtaSecondary,
  featuresTitle,
  features,
}: Translations) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── A. Video Hero ──────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative w-full min-h-screen overflow-hidden flex items-center justify-center"
      >
        {/* 1. BACKGROUND VIDEO — direct child, NO container/padding wrappers */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 w-full h-full bg-black isolate">
          <video
            src="/videos/hero-bg.mp4"
            poster="/hero-poster.jpg"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-[1.35] -z-10"
            style={{ colorScheme: 'light' }}
          />
        </motion.div>

        {/* 2. OVERLAY — direct child of section */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-10 pointer-events-none" />

        {/* 3. CONTENT — inside a container, sits on z-20 */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-20 container mx-auto px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, ease: EASE, delay: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-qwaam-yellow text-text-main text-xs font-black mb-8 shadow-lg shadow-yellow-400/20 tracking-wide"
          >
            ⚡ {tagline}
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black leading-tight mb-6 text-white"
          >
            <span className="block">{heroTitle}</span>
            <span className="text-qwaam-pink drop-shadow-[0_0_30px_rgba(236,72,153,0.5)]">
              {heroTitleAccent}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
            className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            {heroSubtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <Link
              href="/login"
              className="group relative px-8 py-4 rounded-full font-black text-lg bg-qwaam-pink text-white shadow-xl shadow-qwaam-pink/30 hover:shadow-qwaam-pink/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">{heroCta}</span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            <a
              href="#pricing"
              className="px-8 py-4 rounded-full font-black text-lg border-2 border-white/30 text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/60 transition-all duration-300"
            >
              {heroCtaSecondary}
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-white/40 text-xs font-bold tracking-widest uppercase">تمرير</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── B. Infinite Marquee ────────────────────────────────────────────── */}
      <InfiniteMarquee />

      {/* ── C. Bento Features Grid ─────────────────────────────────────────── */}
      <section className="bg-gray-50 py-28 px-6">
        <div className="container mx-auto max-w-5xl">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <p className="text-xs font-black text-qwaam-pink uppercase tracking-widest mb-3">
              لماذا قوام؟
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-text-main leading-tight">
              {featuresTitle}
            </h2>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Row 1: Wide card + normal card */}
            <BentoCard
              emoji={features[0].emoji}
              title={features[0].title}
              desc={features[0].desc}
              bgImage="/images/feature-gym.jpg"
              wide
              accent
              delay={0}
            />
            <BentoCard
              emoji={features[1].emoji}
              title={features[1].title}
              desc={features[1].desc}
              bgImage="/images/feature-nutrition.jpg"
              delay={0.1}
            />

            {/* Row 2: normal + wide card */}
            <BentoCard
              emoji={features[2].emoji}
              title={features[2].title}
              desc={features[2].desc}
              bgImage="/images/feature-tracking.jpg"
              delay={0.05}
            />
            <BentoCard
              emoji="🏠"
              title="تمارين البيت"
              desc="تمارين مخصصة في منزلكِ بأدوات بسيطة أو بوزن الجسم مع جدول أسبوعي لضمان الوصول الفوري لنتائجك."
              bgImage="/images/feature-home.jpg"
              wide
              delay={0.15}
            />
          </div>
        </div>
      </section>

      {/* ── D. Pricing Preview ────────────────────────────────────────────── */}
      <PricingPreview />

      {/* ── E. Bottom CTA band ─────────────────────────────────────────────── */}
      <section
        dir="rtl"
        className="relative bg-gradient-to-br from-qwaam-pink to-pink-700 py-24 px-6 overflow-hidden text-center"
      >
        {/* Decorative blobs */}
        <div className="absolute -top-20 -start-20 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -end-16 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          <p className="text-pink-200 text-sm font-black uppercase tracking-widest mb-4">ابدأي اليوم</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            رحلتك نحو جسد أفضل تبدأ بخطوة واحدة
          </h2>
          <Link
            href="/login"
            className="inline-block px-10 py-4 rounded-full bg-white text-qwaam-pink font-black text-lg shadow-2xl hover:-translate-y-1 hover:shadow-white/20 transition-all duration-300"
          >
            اشتركي الآن ✨
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
