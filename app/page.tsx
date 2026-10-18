"use client";

import type * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const SvgIcon = ({ size = 16, children, ...props }: IconProps & { children?: React.ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

const ArrowRight = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </SvgIcon>
);
const Check = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="m5 12 4.5 4.5L19 3" />
  </SvgIcon>
);
const X = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </SvgIcon>
);
const Mic2 = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z" />
    <path d="M19 11a7 7 0 0 1-14 0" />
    <path d="M12 18v3" />
  </SvgIcon>
);
const Subtitles = (props: IconProps) => (
  <SvgIcon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7 12h2" />
    <path d="M11 12h6" />
    <path d="M7 16h10" />
  </SvgIcon>
);
const Zap = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="M13 2 4 13h6l-1 9 9-11h-6l1-9Z" />
  </SvgIcon>
);
const Lock = (props: IconProps) => (
  <SvgIcon {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 1 1 8 0v3" />
  </SvgIcon>
);
const Globe2 = (props: IconProps) => (
  <SvgIcon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18" />
    <path d="M12 3a15 15 0 0 0 0 18" />
  </SvgIcon>
);
const Sparkles = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="m12 2 1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Z" />
    <path d="m18 14 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
  </SvgIcon>
);
const Upload = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
  </SvgIcon>
);
const Wand2 = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="m6 8 3 3" />
    <path d="M8 2v2" />
    <path d="M2 8h2" />
    <path d="M14 6 6 14" />
    <path d="m15 3 6 6-5 5-6-6 5-5Z" />
  </SvgIcon>
);
const Download = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="M12 3v12" />
    <path d="m7 18 5 5 5-5" />
    <path d="M4 21h16" />
  </SvgIcon>
);
const Monitor = (props: IconProps) => (
  <SvgIcon {...props}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8" />
    <path d="M12 16v4" />
  </SvgIcon>
);
const Cloud = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="M17.5 18.5A4.5 4.5 0 0 0 18 9.5a5.5 5.5 0 0 0-10.45-1.5A4.5 4.5 0 0 0 6.5 18.5h11Z" />
  </SvgIcon>
);
const Volume2 = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18 6a8.5 8.5 0 0 1 0 12" />
  </SvgIcon>
);
const VolumeX = (props: IconProps) => (
  <SvgIcon {...props}>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="m17 9 5 6" />
    <path d="m22 9-5 6" />
  </SvgIcon>
);
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useState, useEffect } from "react";

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: React.ReactNode;
};

const Link = ({ href, children, ...props }: LinkProps) => (
  <a href={href} {...props}>{children}</a>
);

// ---------- Content ----------

const steps = [
  { num: "01", icon: Upload, title: "Upload", desc: "Drop your video. Any length, any format." },
  { num: "02", icon: Wand2, title: "Analyze", desc: "We detect speakers, characters, and emotions." },
  { num: "03", icon: Mic2, title: "Dub", desc: "Each character keeps its own voice and tone." },
  { num: "04", icon: Download, title: "Export", desc: "Download your lip-synced, broadcast-ready video." },
];

const features = [
  { icon: Mic2, title: "Voice Cloning", desc: "Every character keeps their own tone, emotion, and identity." },
  { icon: Subtitles, title: "30+ Languages", desc: "Hindi, English, Spanish, Arabic, Japanese, and more." },
  { icon: Zap, title: "Emotion Preserved", desc: "Anger, whispers, excitement — the performance survives." },
  { icon: Sparkles, title: "Character Memory", desc: "Voices stay consistent across episodes of your series." },
  { icon: Lock, title: "Your Data Stays Yours", desc: "Local mode never uploads your video anywhere." },
  { icon: Globe2, title: "Studio-Grade Lip-Sync", desc: "Mouth movements matched automatically to the new audio." },
];

const testimonials = [
  {
    quote: "I dubbed 40 episodes of my Hindi web series in a weekend. What used to take a studio three months.",
    name: "Priya Sharma",
    role: "Independent Filmmaker",
  },
  {
    quote: "The voice cloning is unreal. My viewers in Brazil can't tell it's not me speaking Portuguese.",
    name: "Marcus Chen",
    role: "YouTube Creator, 1.2M subscribers",
  },
  {
    quote: "We replaced a $15k per-project dubbing budget with DubMate. The quality holds up.",
    name: "Elena Rossi",
    role: "Head of Content, TechFlow Media",
  },
];

const packs = [
  {
    name: "Free",
    price: "$0",
    credits: 20,
    minutes: 10,
    storage: "2 GB",
    retention: "30 days",
    desc: "Try DubMate. Local mode unlimited, 20 cloud credits on signup.",
    features: [
      "Unlimited local dubbing",
      "20 cloud credits on signup",
      "2 GB cloud storage",
      "Standard voice library",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$10",
    credits: 60,
    minutes: 30,
    storage: "2 GB",
    retention: "30 days",
    desc: "For small projects and occasional dubbing.",
    features: [
      "Unlimited local dubbing",
      "60 cloud credits",
      "2 GB cloud storage",
      "Standard voice library",
      "Credits valid 12 months",
    ],
    cta: "Buy Starter",
    highlight: false,
  },
  {
    name: "Creator",
    price: "$25",
    credits: 180,
    minutes: 90,
    storage: "10 GB",
    retention: "60 days",
    desc: "For creators shipping content regularly.",
    features: [
      "Unlimited local dubbing",
      "180 cloud credits",
      "10 GB cloud storage",
      "Character voice cloning",
      "Priority processing",
      "Credits valid 12 months",
    ],
    cta: "Buy Creator",
    highlight: true,
  },
  {
    name: "Studio",
    price: "$75",
    credits: 650,
    minutes: 325,
    storage: "50 GB",
    retention: "90 days",
    desc: "For production teams and agencies.",
    features: [
      "Unlimited local dubbing",
      "650 cloud credits",
      "50 GB cloud storage",
      "All voice models and languages",
      "Priority processing",
      "90-day file retention",
      "Credits valid 12 months",
    ],
    cta: "Buy Studio",
    highlight: false,
  },
];

const faqs = [
  {
    q: "Do I need to install anything?",
    a: "Not if you use cloud mode — just upload and dub. For local mode, you download a small DubMate app that runs dubbing on your own computer. Local mode is completely free, forever.",
  },
  {
    q: "How do credits work?",
    a: "1 credit equals 30 seconds of cloud processing. Credits only apply to cloud dubbing — running on your own computer is always free. Credits are valid for 12 months from purchase.",
  },
  {
    q: "Do you use my API keys?",
    a: "Only if you want us to. You bring your own AI provider accounts, encrypted in your profile. No middleman, no markup.",
  },
  {
    q: "How good is the voice cloning?",
    a: "From just a few seconds of reference audio, DubMate captures tone, pacing, and emotion. Professional studios use the same approach for character voice consistency.",
  },
  {
    q: "Which lip-sync method do you use?",
    a: "It depends on the video. Real human footage gets one processing approach. Animated and stylized content gets another. DubMate picks the right one automatically — you don't need to think about it.",
  },
  {
    q: "Can I switch between local and cloud?",
    a: "Yes. Every project can run either way. Local is free and private. Cloud is faster to set up and works on any device, including phones and tablets.",
  },
];

// ---------- Page ----------

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(var(--primary)/0.14),transparent_70%)] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/60 bg-card/40 text-xs backdrop-blur">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-muted">Studio-grade dubbing, on your terms</span>
              </div>

              <h1 className="mt-8 text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
                Dub any video.
                <br />
                <span className="font-display italic font-normal text-primary">
                  Preserve every emotion.
                </span>
              </h1>

              <p className="mt-8 text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
                Professional AI dubbing with character voice cloning,
                emotion-aware translation, and lip-sync — in minutes, not weeks.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register">
                  <Button size="lg" className="gap-2 min-w-[200px]">
                    Start dubbing free <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="#two-ways">
                  <Button size="lg" variant="outline" className="min-w-[180px]">
                    How it works
                  </Button>
                </Link>
              </div>

              <p className="mt-6 text-xs text-muted">
                No credit card · Free forever on your own computer · Cloud from $0.28/min
              </p>
            </motion.div>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="border-y border-border/60 bg-card/20">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted mb-6">
              Trusted by creators in 40+ countries
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
              <span className="text-sm font-medium tracking-tight">YouTube Creators</span>
              <span className="text-sm font-medium tracking-tight">Independent Studios</span>
              <span className="text-sm font-medium tracking-tight">Language Schools</span>
              <span className="text-sm font-medium tracking-tight">Content Agencies</span>
              <span className="text-sm font-medium tracking-tight">Podcast Networks</span>
            </div>
          </div>
        </section>

        {/* TWO WAYS TO DUB */}
        <section id="two-ways" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
                Two ways to dub
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Yours to choose.
                <br />
                <span className="font-display italic font-normal">
                  Free or fast.
                </span>
              </h2>
              <p className="mt-6 text-muted leading-relaxed">
                Run dubbing on your own computer for free, forever.
                Or use our cloud for speed and convenience. Both give you the
                same studio-quality output.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* LOCAL */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border border-border bg-card p-8 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Monitor size={20} className="text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">Local</h3>
                    <p className="text-xs text-muted mt-0.5">Runs on your computer</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold tracking-tight">Free</span>
                  <span className="text-sm text-muted">forever</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Unlimited dubbing minutes",
                    "Your video never leaves your device",
                    "No cloud credits consumed",
                    "Works offline after setup",
                    "Best for privacy-conscious creators",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm">
                      <Check size={16} className="text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-muted">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-md bg-bg/60 border border-border/60 px-4 py-3 mb-5">
                  <p className="text-xs text-muted">
                    Requires a modern laptop. Download the DubMate app once,
                    then dub whenever you want.
                  </p>
                </div>

                <a 
                  href="https://drive.google.com/file/d/1QqJ2e0UBskFdKlbD14wo05k7Z-oa3vaU/view?usp=sharing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button className="w-full gap-2">
                    <Download size={16} />
                    Download for Windows
                  </Button>
                </a>
              </motion.div>

              {/* CLOUD */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-xl border border-primary/40 bg-card p-8 flex flex-col shadow-[0_8px_40px_hsl(var(--primary)/0.08)]"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Cloud size={20} className="text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">Cloud</h3>
                    <p className="text-xs text-muted mt-0.5">Runs on our servers</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-bold tracking-tight">From $0.28</span>
                  <span className="text-sm text-muted">per minute</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "No installation required",
                    "Works on any device — laptop, phone, tablet",
                    "Faster for older computers",
                    "Buy credits once, use whenever",
                    "Credits valid for 12 months",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm">
                      <Check size={16} className="text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-muted">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="rounded-md bg-primary/5 border border-primary/20 px-4 py-3 mb-5">
                  <p className="text-xs text-muted">
                    Pay only for what you use. No subscriptions, no monthly fees.
                  </p>
                </div>

                <Link href="#pricing">
                  <Button className="w-full">
                    See credit packs
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PROBLEM → SOLUTION */}
        <section className="py-24 md:py-32 border-t border-border/60 bg-card/20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 md:gap-24">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-5">
                  The old way
                </p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
                  Dubbing is slow, expensive, and breaks emotion.
                </h2>
                <ul className="space-y-5">
                  {[
                    "Weeks of turnaround time per episode",
                    "Thousands of dollars in studio and voice actor costs",
                    "Emotional nuance lost in translation",
                    "Character voices change between episodes",
                    "Manual lip-sync editing that never quite lands",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-muted">
                      <X size={18} className="text-destructive shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-[15px] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-5">
                  With DubMate
                </p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
                  Instant dubbing that preserves the performance.
                </h2>
                <ul className="space-y-5">
                  {[
                    "Minutes per episode, not weeks",
                    "Run on your own computer for free, or in the cloud",
                    "Emotion, pacing, and tone preserved per line",
                    "Consistent character voices across your whole series",
                    "Automated lip-sync with broadcast-quality output",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <Check size={18} className="text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-[15px] leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="py-24 md:py-32 border-t border-border/60">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
                How it works
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Four steps. <span className="font-display italic font-normal">That&apos;s it.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8 md:gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="relative"
                >
                  <span className="text-5xl font-bold text-border/40 tracking-tighter">
                    {step.num}
                  </span>
                  <div className="mt-4 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <step.icon size={18} className="text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-24 md:py-32 border-t border-border/60 bg-card/20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
                Features
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Everything you need to dub like a studio.
              </h2>
              <p className="mt-6 text-muted leading-relaxed">
                No a-la-carte pricing, no feature gates. Both local and cloud
                run the same pipeline that powers professional dubbing teams.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="group rounded-lg border border-border bg-card p-6 hover:border-primary/40 hover:shadow-[0_4px_24px_hsl(var(--primary)/0.08)] transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <f.icon size={18} className="text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="font-semibold tracking-tight mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* DEMO CAROUSEL */}
        <section id="demo" className="py-24 md:py-32 border-t border-border/60 bg-[#0B1020] overflow-hidden">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
                See it in action
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Watch a video get dubbed.
              </h2>
              <p className="mt-6 text-muted max-w-xl mx-auto leading-relaxed">
                Real outputs generated by the DubMate pipeline. English audio translated to regional languages with voice preservation and lip-sync.
              </p>
            </div>

            {/* The Carousel */}
            <DemoCarousel />
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-24 md:py-32 border-t border-border/60 bg-card/20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
                Loved by creators
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Real teams. Real results.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="rounded-lg border border-border bg-card p-6 flex flex-col"
                >
                  <p className="text-[15px] leading-relaxed mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted mt-0.5">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING — CREDIT PACKS */}
        <section id="pricing" className="py-24 md:py-32 border-t border-border/60">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
                Pricing
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Buy credits.
                <br />
                <span className="font-display italic font-normal">
                  Dub whenever.
                </span>
              </h2>
              <p className="mt-6 text-muted leading-relaxed">
                No subscriptions. No monthly fees. Local dubbing is always free.
                Cloud credits are yours for 12 months.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
              {packs.map((pack) => (
                <div
                  key={pack.name}
                  className={
                    "rounded-xl border p-6 transition-all " +
                    (pack.highlight
                      ? "border-primary/50 bg-card shadow-[0_8px_40px_hsl(var(--primary)/0.12)] lg:-mt-4"
                      : "border-border bg-card")
                  }
                >
                  {pack.highlight && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[10px] uppercase tracking-wider font-semibold mb-4">
                      Most popular
                    </div>
                  )}
                  <h3 className="text-lg font-semibold tracking-tight">{pack.name}</h3>
                  <p className="text-sm text-muted mt-1.5 h-10">{pack.desc}</p>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tracking-tight">{pack.price}</span>
                  </div>

                  <div className="mt-3 rounded-md bg-primary/5 border border-primary/15 px-3 py-2">
                    <p className="text-sm font-semibold text-primary">
                      {pack.credits} credits
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      ≈ {pack.minutes} min of cloud dubbing
                    </p>
                  </div>

                  <Link href="/register" className="block mt-6">
                    <Button
                      className="w-full"
                      variant={pack.highlight ? "default" : "outline"}
                    >
                      {pack.cta}
                    </Button>
                  </Link>

                  <ul className="mt-6 space-y-2.5">
                    {pack.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-sm">
                        <Check
                          size={15}
                          className="text-primary shrink-0 mt-0.5"
                          strokeWidth={2.5}
                        />
                        <span className="text-muted leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 pt-4 border-t border-border/60">
                    <p className="text-[11px] text-muted leading-relaxed">
                      <strong className="text-fg">Storage:</strong> {pack.storage} · {pack.retention} retention
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center max-w-2xl mx-auto">
              <p className="text-sm text-muted leading-relaxed">
                1 credit = 30 seconds of cloud processing. Need more?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Top up anytime
                </Link>{" "}
                from inside the app. For custom volumes,{" "}
                <Link href="/register" className="text-primary hover:underline">
                  contact us
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 md:py-32 border-t border-border/60 bg-card/20">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
                FAQ
              </p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Questions,{" "}
                <span className="font-display italic font-normal">answered.</span>
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-lg border border-border bg-card open:border-primary/30 transition-colors"
                >
                  <summary className="flex items-center justify-between cursor-pointer p-5 [&::-webkit-details-marker]:hidden list-none">
                    <span className="font-medium tracking-tight pr-6">
                      {faq.q}
                    </span>
                    <span className="text-muted group-open:rotate-45 transition-transform shrink-0">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 md:py-32 border-t border-border/60">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Ready to dub
              <br />
              <span className="font-display italic font-normal text-primary">
                your first video?
              </span>
            </h2>
            <p className="mt-8 text-muted max-w-lg mx-auto leading-relaxed">
              Set up in under a minute. Free forever in local mode, 20 cloud
              credits on signup.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2 min-w-[180px]">
                  Get started free <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="min-w-[140px]">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ============================================================
// DEMO CAROUSEL COMPONENT
// ============================================================
function DemoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  
  const videos = [
    "/demos/demo1.mp4", 
    "/demos/demo2.mp4", 
    "/demos/demo3.mp4"
  ];

  // Auto-advance every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [videos.length]);

  // Control playback explicitly based on currentIndex
  useEffect(() => {
    const videoElements = document.querySelectorAll('.demo-video') as NodeListOf<HTMLVideoElement>;
    videoElements.forEach((vid, idx) => {
      if (idx === currentIndex) {
        vid.currentTime = 0; // Reset to start
        vid.play().catch(() => {}); // Play active video
      } else {
        vid.pause(); // Pause inactive videos to stop audio/bandwidth
      }
    });
  }, [currentIndex]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      
      {/* The Video Frame */}
      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-border/60 bg-black shadow-2xl ring-1 ring-white/10">
        {videos.map((src, idx) => (
          <video
            key={src}
            src={src}
            muted={isMuted}
            loop
            playsInline
            className={`demo-video absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          />
        ))}
        
        {/* Subtle gradient for readability */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

        {/* Mute/Unmute Button (Top Right) */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Dots Navigation */}
        <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2.5 z-20">
          {videos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? "bg-primary w-8" 
                  : "bg-white/40 w-2 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}