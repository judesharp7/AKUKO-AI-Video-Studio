import Link from "next/link";
import { ArrowRight, Film, Lock, Sparkles, Sliders, Mic, Download, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0B10] text-white">
      {/* Header */}
      <header className="border-b border-[#26262F] bg-[#0B0B10]/90 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl studio-gradient">
              <Film className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">AKUKO</span>
            <span className="hidden sm:inline-block rounded-full border border-[#26262F] bg-[#15151C] px-2.5 py-0.5 text-[11px] text-[#A1A1AA]">
              AI Video Studio
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="rounded-xl px-4 py-2 text-sm font-medium text-[#A1A1AA] hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl studio-gradient px-5 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 transition"
            >
              Open Studio
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#26262F] bg-[#15151C] px-4 py-1.5 text-xs font-medium text-[#A1A1AA] mb-6">
          <Sparkles className="h-3.5 w-3.5 text-[#7C5CFF]" />
          Idea → Character → Story → 30+ Minute Video
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl leading-[1.1]">
          Turn Any Story Idea Into a{" "}
          <span className="studio-gradient-text">Full-Length AI Film</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-[#A1A1AA]">
          AKUKO guides you from a plain-language idea to an exported 1080p MP4 — with locked character
          consistency, Nigerian English &amp; Pidgin voices, multi-track editing, and durable scene generation.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-xl studio-gradient px-7 py-3.5 text-sm font-semibold text-white shadow-lg hover:opacity-95 transition"
          >
            Start Creating Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl border border-[#26262F] bg-[#15151C] px-7 py-3.5 text-sm font-semibold text-white hover:border-[#7C5CFF] transition"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* 4-Step Pipeline */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Lock,
              title: "1. Character Studio",
              desc: "Generate 2–6 reference images per character, lock their look, and assign Nigerian English, Pidgin, or global voices.",
            },
            {
              icon: Sparkles,
              title: "2. Story & Scene Builder",
              desc: "Turn one sentence into a structured story, full script, and ~90 editable scenes with AI prompt expansion.",
            },
            {
              icon: Mic,
              title: "3. Durable Generation",
              desc: "Voice-first timing, automatic retries, and adjacent-scene frame continuity. Never lose progress mid-production.",
            },
            {
              icon: Sliders,
              title: "4. Multi-Track Editor & Export",
              desc: "Trim, split, add music and one-click subtitles, then export an immutable 720p, 1080p, or 4K MP4.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-[#26262F] bg-[#15151C] p-6 space-y-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFF]/15 text-[#7C5CFF]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Free Storyboard vs Paid */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#26262F] bg-[#15151C] p-8 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Free Tier</span>
            <h3 className="text-2xl font-bold">Storyboard Mode</h3>
            <p className="text-sm text-[#A1A1AA]">
              Test the entire guided studio free — AI stills with smooth camera motion, voice narration, music, and subtitles.
            </p>
            <ul className="space-y-2 text-sm text-[#A1A1AA]">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#22C55E]" /> Up to 5 minutes/month free</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#22C55E]" /> 720p MP4 export with watermark</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#22C55E]" /> Full Character Studio &amp; Script Editor</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#7C5CFF]/50 bg-[#15151C] p-8 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7C5CFF]">Pay-As-You-Create</span>
            <h3 className="text-2xl font-bold">Studio Credits</h3>
            <p className="text-sm text-[#A1A1AA]">
              Generate full motion video across Draft, Standard, and Cinema tiers. Paystack, Flutterwave, and Stripe supported.
            </p>
            <ul className="space-y-2 text-sm text-[#A1A1AA]">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#22C55E]" /> 1080p &amp; 4K watermark-free MP4</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#22C55E]" /> Automatic credit refund on failed takes</li>
              <li className="flex items-center gap-2"><Download className="h-4 w-4 text-[#3B82F6]" /> Immutable R2 cloud asset storage</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

