"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowRight,
  Undo2,
  Redo2,
  Scissors,
  Trash2,
  Copy,
  Captions,
  Music,
  Film,
  Mic,
  Check,
} from "lucide-react";
import { StudioStepbar } from "@/components/studio/StudioStepbar";
import { useTimelineStore } from "@/lib/stores/timeline-store";
import type { Project, SubtitlePreset, SubtitleRecord, TimelineRecord, UserProfile } from "@/types/database";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    edl,
    past,
    future,
    selectedClipId,
    dirty,
    setInitialEdl,
    selectClip,
    markSaved,
    trimClip,
    splitClip,
    deleteClip,
    duplicateClip,
    setTransition,
    undo,
    redo,
  } = useTimelineStore();

  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [subPreset, setSubPreset] = useState<SubtitlePreset>("clean");
  const [subtitles, setSubtitles] = useState<SubtitleRecord | null>(null);
  const [savingLabel, setSavingLabel] = useState("Saved");

  const { data: userData } = useQuery<{ user: UserProfile }>({
    queryKey: ["user"],
    queryFn: async () => (await fetch("/api/user")).json(),
  });

  const { data: projectData } = useQuery<{ project: Project }>({
    queryKey: ["project", id],
    queryFn: async () => (await fetch(`/api/projects/${id}`)).json(),
  });

  const { data: timelineData } = useQuery<{ timeline: TimelineRecord }>({
    queryKey: ["timeline", id],
    queryFn: async () => (await fetch(`/api/projects/${id}/timeline`)).json(),
  });

  useEffect(() => {
    if (timelineData?.timeline?.edit_decision_list) {
      setInitialEdl(timelineData.timeline.edit_decision_list);
    }
  }, [timelineData?.timeline, setInitialEdl]);

  // 2-second inactivity auto-save
  useEffect(() => {
    if (!dirty || !edl) return;
    setSavingLabel("Saving...");
    const timer = setTimeout(async () => {
      await fetch(`/api/projects/${id}/timeline`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ edit_decision_list: edl }),
      });
      markSaved();
      setSavingLabel("All changes saved");
    }, 2000);
    return () => clearTimeout(timer);
  }, [dirty, edl, id, markSaved]);

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  async function handleGenerateSubtitles(preset: SubtitlePreset = subPreset) {
    setSubPreset(preset);
    const res = await fetch(`/api/projects/${id}/subtitles`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ style_preset: preset, autoGenerate: true }),
    });
    const data = await res.json();
    if (data.subtitle) setSubtitles(data.subtitle);
  }

  const videoClips = edl?.clips.filter((c) => c.track === "video") ?? [];
  const voiceClips = edl?.clips.filter((c) => c.track === "voice") ?? [];
  const musicClips = edl?.clips.filter((c) => c.track === "music") ?? [];
  const selectedClip = edl?.clips.find((c) => c.id === selectedClipId) ?? videoClips[0] ?? null;
  const previewVideoUrl = selectedClip?.assetUrl || videoClips.find((c) => c.assetUrl)?.assetUrl;

  return (
    <div className="min-h-screen bg-[#0B0B10] flex flex-col">
      <StudioStepbar
        projectId={id}
        projectName={projectData?.project?.name ?? "Project"}
        currentStep="editor"
        creditBalance={userData?.user?.credit_balance}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 space-y-4">
        {/* Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#26262F] bg-[#15151C] px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              aria-label="Undo"
              className="rounded-lg border border-[#26262F] bg-[#0B0B10] p-2 text-white disabled:opacity-40"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              aria-label="Redo"
              className="rounded-lg border border-[#26262F] bg-[#0B0B10] p-2 text-white disabled:opacity-40"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-[#A1A1AA]">
              <Check className="h-3.5 w-3.5 text-[#22C55E]" /> {savingLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGenerateSubtitles(subPreset)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#26262F] bg-[#0B0B10] px-3 py-2 text-xs font-medium text-white hover:border-[#7C5CFF]"
            >
              <Captions className="h-4 w-4 text-[#7C5CFF]" />
              One-Click Subtitles
            </button>
            <Link
              href={`/projects/${id}/export`}
              className="inline-flex items-center gap-2 rounded-xl studio-gradient px-4 py-2 text-sm font-semibold text-white"
            >
              Export MP4
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Assets (Left) + Video Preview (Top/Center) */}
        <div className="grid gap-4 lg:grid-cols-12">
          <aside className="lg:col-span-4 rounded-2xl border border-[#26262F] bg-[#15151C] p-4 space-y-4">
            <h2 className="text-sm font-semibold text-white">Audio &amp; Subtitles</h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A1AA]">Subtitle Overlay</span>
                <button
                  type="button"
                  onClick={() => setSubtitlesOn(!subtitlesOn)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    subtitlesOn ? "bg-[#22C55E]/20 text-[#22C55E]" : "bg-[#26262F] text-[#A1A1AA]"
                  }`}
                >
                  {subtitlesOn ? "ON" : "OFF"}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(["clean", "bold", "cinematic", "youtube"] as SubtitlePreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleGenerateSubtitles(preset)}
                    className={`rounded-lg border py-1.5 text-[11px] capitalize ${
                      subPreset === preset
                        ? "border-[#7C5CFF] bg-[#7C5CFF]/15 text-white"
                        : "border-[#26262F] bg-[#0B0B10] text-[#A1A1AA]"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {selectedClip && (
              <div className="border-t border-[#26262F] pt-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase text-[#A1A1AA]">Selected Clip Controls</h3>
                <p className="text-sm font-medium text-white truncate">{selectedClip.label}</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#A1A1AA]">Duration:</label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={selectedClip.duration}
                    onChange={(e) => trimClip(selectedClip.id, Number(e.target.value))}
                    className="w-16 rounded-lg border border-[#26262F] bg-[#0B0B10] px-2 py-1 font-mono text-xs text-white"
                  />
                  <span className="text-xs text-[#A1A1AA]">s</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => splitClip(selectedClip.id, selectedClip.duration / 2)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#26262F] bg-[#0B0B10] px-2.5 py-1.5 text-xs text-white hover:border-[#7C5CFF]"
                  >
                    <Scissors className="h-3.5 w-3.5" /> Split
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateClip(selectedClip.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#26262F] bg-[#0B0B10] px-2.5 py-1.5 text-xs text-white hover:border-[#7C5CFF]"
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteClip(selectedClip.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#26262F] bg-[#0B0B10] px-2.5 py-1.5 text-xs text-[#EF4444]"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-[#A1A1AA] mb-1">Transition</label>
                  <select
                    value={selectedClip.transition ?? "dissolve"}
                    onChange={(e) => setTransition(selectedClip.id, e.target.value as "cut" | "fade" | "dissolve")}
                    className="w-full rounded-lg border border-[#26262F] bg-[#0B0B10] px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="cut">Cut</option>
                    <option value="fade">Fade</option>
                    <option value="dissolve">Dissolve</option>
                  </select>
                </div>
              </div>
            )}
          </aside>

          <section className="lg:col-span-8 rounded-2xl border border-[#26262F] bg-[#15151C] p-4 flex flex-col justify-center">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#26262F] bg-black flex items-center justify-center">
              {previewVideoUrl ? (
                <video key={previewVideoUrl} src={previewVideoUrl} controls className="h-full w-full object-contain" />
              ) : (
                <p className="text-sm text-[#A1A1AA]">Generate scene videos to preview them in the timeline.</p>
              )}
              {subtitlesOn && (
                <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 rounded-lg bg-black/75 px-4 py-1.5 text-center text-sm font-medium text-white">
                  {subtitles?.cues?.[0]?.text || selectedClip?.label || "Subtitles enabled (360p preview proxy)"}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Multi-Track Timeline (Desktop Full / Mobile Read-Only Prompt) */}
        <section className="rounded-2xl border border-[#26262F] bg-[#15151C] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Multi-Track Timeline</h2>
            <span className="font-mono text-xs text-[#A1A1AA]">
              Total: {edl?.totalDuration ?? 0}s
            </span>
          </div>

          <div className="md:hidden rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 text-xs text-[#F59E0B]">
            Read-only timeline preview on mobile. Open on desktop (1024px+) for full precision editing.
          </div>

          <div className="space-y-2 overflow-x-auto">
            {/* Video Track */}
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0 inline-flex items-center gap-1 text-xs text-[#A1A1AA]">
                <Film className="h-3.5 w-3.5 text-[#7C5CFF]" /> Video
              </span>
              <div className="flex gap-1.5 flex-1">
                {videoClips.map((clip) => (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => selectClip(clip.id)}
                    style={{ minWidth: `${Math.max(90, clip.duration * 10)}px` }}
                    className={`rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                      selectedClip?.id === clip.id
                        ? "border-[#7C5CFF] bg-[#7C5CFF]/25 text-white"
                        : "border-[#26262F] bg-[#0B0B10] text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    <p className="font-medium truncate">{clip.label}</p>
                    <p className="font-mono text-[10px] opacity-75">{clip.duration}s</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Track */}
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0 inline-flex items-center gap-1 text-xs text-[#A1A1AA]">
                <Mic className="h-3.5 w-3.5 text-[#3B82F6]" /> Voice
              </span>
              <div className="flex gap-1.5 flex-1">
                {voiceClips.map((clip) => (
                  <div
                    key={clip.id}
                    style={{ minWidth: `${Math.max(90, clip.duration * 10)}px` }}
                    className="rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2.5 py-1.5 text-[11px] text-[#60A5FA] truncate"
                  >
                    {clip.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Music Track */}
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0 inline-flex items-center gap-1 text-xs text-[#A1A1AA]">
                <Music className="h-3.5 w-3.5 text-[#22C55E]" /> Music
              </span>
              <div className="flex gap-1.5 flex-1">
                {musicClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="w-full rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1.5 text-[11px] text-[#22C55E]"
                  >
                    {clip.label} ({clip.duration}s)
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

