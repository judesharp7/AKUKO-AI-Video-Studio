"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight } from "lucide-react";
import { AppSidebar } from "@/components/studio/AppSidebar";
import type { AspectRatio, UserProfile, VideoType } from "@/types/database";

const TEMPLATES: Array<{
  title: string;
  type: VideoType;
  aspect: AspectRatio;
  minutes: number;
  desc: string;
}> = [
  {
    title: "30-Min African Folklore Epic",
    type: "story",
    aspect: "16:9",
    minutes: 30,
    desc: "Multi-character narrative with Nigerian English narration, atmospheric score, and dramatic pacing.",
  },
  {
    title: "YouTube Deep-Dive Documentary",
    type: "documentary",
    aspect: "16:9",
    minutes: 20,
    desc: "Structured chapters, crisp documentary voiceover, and Clean subtitle styling.",
  },
  {
    title: "Product Launch & Brand Story",
    type: "advert",
    aspect: "9:16",
    minutes: 5,
    desc: "High-energy vertical format with Bold captions tailored for Reels, TikTok, and Shorts.",
  },
  {
    title: "Interactive Course Lesson",
    type: "tutorial",
    aspect: "16:9",
    minutes: 15,
    desc: "Clear step-by-step instructional pacing with chaptered scenes and synchronized voice.",
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);
  const { data: userData } = useQuery<{ user: UserProfile }>({
    queryKey: ["user"],
    queryFn: async () => (await fetch("/api/user")).json(),
  });

  async function useTemplate(tpl: (typeof TEMPLATES)[number]) {
    setCreating(tpl.title);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: tpl.title,
        type: tpl.type,
        aspect_ratio: tpl.aspect,
        target_duration_seconds: tpl.minutes * 60,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/projects/${data.project.id}/characters`);
    } else {
      setCreating(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#0B0B10]">
      <AppSidebar creditBalance={userData?.user?.credit_balance} plan={userData?.user?.plan} />
      <main className="flex-1 p-6 lg:p-10 space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#7C5CFF]" />
            Production Templates
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Launch pre-configured studio workflows in one click.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {TEMPLATES.map((tpl) => (
            <div key={tpl.title} className="rounded-2xl border border-[#26262F] bg-[#15151C] p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                  <span className="uppercase font-semibold text-[#7C5CFF]">{tpl.type}</span>
                  <span className="font-mono">{tpl.aspect} • {tpl.minutes}m</span>
                </div>
                <h2 className="text-lg font-bold text-white">{tpl.title}</h2>
                <p className="text-sm text-[#A1A1AA]">{tpl.desc}</p>
              </div>
              <button
                type="button"
                disabled={creating === tpl.title}
                onClick={() => useTemplate(tpl)}
                className="inline-flex items-center justify-center gap-2 rounded-xl studio-gradient px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition"
              >
                {creating === tpl.title ? "Creating..." : "Use Template"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

