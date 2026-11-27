"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, AlertTriangle, Play, Sparkles, Coins, Loader2 } from "lucide-react";
import { StudioStepbar } from "@/components/studio/StudioStepbar";
import { ErrorBanner, LoadingActivity } from "@/components/studio/StateFeedback";
import { estimateProjectCredits } from "@/lib/credits/ledger";
import type { Project, Scene, UserProfile } from "@/types/database";

function StatusBadge({ status }: { status: Scene["status"] }) {
  if (status === "complete" || status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[11px] font-medium text-[#22C55E]">
        <CheckCircle2 className="h-3 w-3" /> Complete
      </span>
    );
  }
  if (status === "failed" || status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#EF4444]/15 px-2 py-0.5 text-[11px] font-medium text-[#EF4444]">
        <AlertTriangle className="h-3 w-3" /> {status === "blocked" ? "Blocked" : "Failed"}
      </span>
    );
  }
  if (status === "generating" || status === "queued") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#3B82F6]/15 px-2 py-0.5 text-[11px] font-medium text-[#3B82F6]">
        <Loader2 className="h-3 w-3 animate-spin" /> Generating
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-[11px] font-medium text-[#F59E0B]">
      <Clock className="h-3 w-3" /> Waiting
    </span>
  );
}

export default function GeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [generatingMsg, setGeneratingMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: userData } = useQuery<{ user: UserProfile }>({
    queryKey: ["user"],
    queryFn: async () => (await fetch("/api/user")).json(),
  });

  const { data: projectData } = useQuery<{ project: Project }>({
    queryKey: ["project", id],
    queryFn: async () => (await fetch(`/api/projects/${id}`)).json(),
  });

  const { data: scenesData } = useQuery<{ scenes: Scene[] }>({
    queryKey: ["scenes", id],
    queryFn: async () => (await fetch(`/api/projects/${id}/scenes`)).json(),
  });

  const scenes = scenesData?.scenes ?? [];
  const activeScene = scenes.find((s) => s.id === selectedSceneId) ?? scenes[0] ?? null;
  const completedCount = scenes.filter((s) => s.status === "complete" || s.status === "approved").length;
  const completedSeconds = scenes
    .filter((s) => s.status === "complete" || s.status === "approved")
    .reduce((sum, s) => sum + s.duration_seconds, 0);
  const totalSeconds = scenes.reduce((sum, s) => sum + s.duration_seconds, 0);

  const estimate = estimateProjectCredits(
    scenes.filter((s) => s.status !== "complete"),
    "standard",
    userData?.user?.plan ?? "creator"
  );

  async function handleGenerateScene(sceneId: string) {
    setError(null);
    const idx = scenes.findIndex((s) => s.id === sceneId);
    setGeneratingMsg(`Creating Scene ${String(idx + 1).padStart(2, "0")} of ${scenes.length} (voice + video)...`);
    try {
      const res = await fetch(`/api/scenes/${sceneId}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.userMessage || "Scene generation failed");
      setSelectedSceneId(sceneId);
      await queryClient.invalidateQueries({ queryKey: ["scenes", id] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scene generation failed");
    } finally {
      setGeneratingMsg(null);
    }
  }

  async function handleGenerateAll() {
    setError(null);
    setGeneratingMsg(`Generating ${scenes.length - completedCount} remaining scenes with durable queue...`);
    try {
      const res = await fetch(`/api/projects/${id}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.userMessage || "Queue failed");
      await queryClient.invalidateQueries({ queryKey: ["scenes", id] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Queue failed");
    } finally {
      setGeneratingMsg(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B10]">
      <StudioStepbar
        projectId={id}
        projectName={projectData?.project?.name ?? "Project"}
        currentStep="generate"
        creditBalance={userData?.user?.credit_balance}
      />

      <main className="mx-auto max-w-[1440px] p-4 sm:p-6 space-y-4">
        {/* Progress Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#26262F] bg-[#15151C] p-4">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-white">Scene Generation Queue</h1>
            <p className="text-xs text-[#A1A1AA]">
              <span className="font-mono text-white">{completedCount} of {scenes.length}</span> scenes •{" "}
              <span className="font-mono text-white">
                {Math.floor(completedSeconds / 60)}:{String(Math.floor(completedSeconds % 60)).padStart(2, "0")}
              </span>{" "}
              of {Math.floor(totalSeconds / 60)}:{String(Math.floor(totalSeconds % 60)).padStart(2, "0")} generated
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#26262F] bg-[#0B0B10] px-3 py-2 text-xs text-[#A1A1AA]">
              <Coins className="h-3.5 w-3.5 text-[#F59E0B]" />
              Est. Cost:{" "}
              <span className="font-mono text-white">
                {estimate.storyboardMode ? "0 (Storyboard Mode)" : `${estimate.totalCredits} credits`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleGenerateAll}
              disabled={Boolean(generatingMsg) || completedCount === scenes.length}
              className="inline-flex items-center gap-2 rounded-xl studio-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-95 transition disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Generate All Remaining
            </button>
            <Link
              href={`/projects/${id}/editor`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#26262F] bg-[#0B0B10] px-4 py-2 text-sm font-medium text-white hover:border-[#7C5CFF]"
            >
              Open Editor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
        {generatingMsg && <LoadingActivity activity={generatingMsg} />}

        {/* 3-Panel Layout: Scene List (Left) | Preview (Center) | Settings (Right) */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left: Scene List */}
          <aside className="lg:col-span-3 rounded-2xl border border-[#26262F] bg-[#15151C] p-3 space-y-2 max-h-[620px] overflow-y-auto">
            {scenes.map((scene, idx) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => setSelectedSceneId(scene.id)}
                className={`w-full text-left rounded-xl border p-3 transition ${
                  activeScene?.id === scene.id
                    ? "border-[#7C5CFF] bg-[#1F1F29]"
                    : "border-[#26262F] bg-[#0B0B10] hover:border-[#3B3B48]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-[11px] text-[#A1A1AA]">
                    Scene {String(idx + 1).padStart(2, "0")} • {scene.duration_seconds}s
                  </span>
                  <StatusBadge status={scene.status} />
                </div>
                <p className="text-xs font-medium text-white truncate">
                  {scene.location_name || "Studio Location"}
                </p>
              </button>
            ))}
          </aside>

          {/* Center: Video Preview */}
          <section className="lg:col-span-6 rounded-2xl border border-[#26262F] bg-[#15151C] p-5 flex flex-col justify-between space-y-4">
            {activeScene ? (
              <>
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-[#26262F] bg-black flex items-center justify-center">
                  {activeScene.preview_url ? (
                    <video
                      key={activeScene.preview_url}
                      src={activeScene.preview_url}
                      controls
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <Play className="h-10 w-10 text-[#7C5CFF] mx-auto opacity-80" />
                      <p className="text-sm text-[#A1A1AA]">
                        {activeScene.error_message || "Ready to generate video for this scene."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      {activeScene.location_name || "Selected Scene"}
                    </h2>
                    <p className="text-xs text-[#A1A1AA] line-clamp-2">{activeScene.action}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateScene(activeScene.id)}
                    disabled={Boolean(generatingMsg)}
                    className="inline-flex items-center gap-2 rounded-xl studio-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Scene
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#A1A1AA]">No scenes found. Add scenes in Scene Builder first.</p>
            )}
          </section>

          {/* Right: Scene Settings */}
          <aside className="lg:col-span-3 rounded-2xl border border-[#26262F] bg-[#15151C] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Scene Settings</h3>
            {activeScene ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#A1A1AA]">Location</span>
                  <p className="font-medium text-white mt-0.5">{activeScene.location_name}</p>
                </div>
                <div>
                  <span className="text-[#A1A1AA]">Duration</span>
                  <p className="font-mono text-white mt-0.5">{activeScene.duration_seconds} seconds</p>
                </div>
                <div>
                  <span className="text-[#A1A1AA]">Camera</span>
                  <p className="text-white mt-0.5">{activeScene.camera}</p>
                </div>
                <div>
                  <span className="text-[#A1A1AA]">Mood</span>
                  <p className="text-white mt-0.5">{activeScene.mood}</p>
                </div>
                <div>
                  <span className="text-[#A1A1AA]">Aspect Ratio</span>
                  <p className="font-mono text-white mt-0.5">{projectData?.project?.aspect_ratio ?? "16:9"}</p>
                </div>
                <div>
                  <span className="text-[#A1A1AA]">Production Prompt</span>
                  <p className="text-[#A1A1AA] mt-0.5 leading-relaxed">
                    {activeScene.ai_prompt || activeScene.visual_prompt}
                  </p>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}

