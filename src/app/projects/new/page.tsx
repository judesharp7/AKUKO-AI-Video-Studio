"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Film, Monitor, Smartphone, Square } from "lucide-react";
import { ErrorBanner } from "@/components/studio/StateFeedback";
import type { AspectRatio, VideoType } from "@/types/database";

const DURATION_PRESETS = [5, 10, 15, 30, 45, 60];

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<VideoType>("story");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [customMinutes, setCustomMinutes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const finalMinutes = customMinutes ? Number(customMinutes) : durationMinutes;
    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }
    if (!finalMinutes || finalMinutes < 1 || finalMinutes > 120) {
      setError("Target duration must be between 1 and 120 minutes.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          aspect_ratio: aspectRatio,
          target_duration_seconds: finalMinutes * 60,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.userMessage || "Failed to create project.");
        setSaving(false);
        return;
      }
      router.push(`/projects/${data.project.id}/characters`);
    } catch {
      setError("Network error while creating project.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B10] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="rounded-2xl border border-[#26262F] bg-[#15151C] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl studio-gradient">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">New Video Project</h1>
              <p className="text-xs text-[#A1A1AA]">Configure your format and target duration</p>
            </div>
          </div>

          {error && <ErrorBanner message={error} />}

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Project Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., The Lagos Skyline"
                className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] px-4 py-3 text-sm text-white placeholder-[#A1A1AA]/50 focus:border-[#7C5CFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Video Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(["story", "tutorial", "advert", "documentary"] as VideoType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition ${
                      type === t
                        ? "border-[#7C5CFF] bg-[#7C5CFF]/15 text-white"
                        : "border-[#26262F] bg-[#0B0B10] text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "16:9" as AspectRatio, label: "16:9 Landscape", sub: "YouTube / Film", icon: Monitor },
                  { value: "9:16" as AspectRatio, label: "9:16 Vertical", sub: "Shorts / Reels", icon: Smartphone },
                  { value: "1:1" as AspectRatio, label: "1:1 Square", sub: "Social Feed", icon: Square },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAspectRatio(opt.value)}
                      className={`flex flex-col items-center rounded-xl border p-3.5 text-center transition ${
                        aspectRatio === opt.value
                          ? "border-[#7C5CFF] bg-[#7C5CFF]/15 text-white"
                          : "border-[#26262F] bg-[#0B0B10] text-[#A1A1AA] hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-1.5" />
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[11px] opacity-70">{opt.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Target Duration (minutes)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {DURATION_PRESETS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => {
                      setDurationMinutes(min);
                      setCustomMinutes("");
                    }}
                    className={`rounded-xl border px-4 py-2 text-sm font-mono transition ${
                      !customMinutes && durationMinutes === min
                        ? "border-[#7C5CFF] bg-[#7C5CFF]/15 text-white font-semibold"
                        : "border-[#26262F] bg-[#0B0B10] text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    {min}m {min === 30 ? "★" : ""}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={120}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="Or enter custom minutes (e.g. 22)"
                className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] px-4 py-2.5 text-sm text-white placeholder-[#A1A1AA]/50 focus:border-[#7C5CFF] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl studio-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:opacity-95 transition disabled:opacity-50"
            >
              {saving ? "Creating Project..." : "Continue to Character Studio"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

