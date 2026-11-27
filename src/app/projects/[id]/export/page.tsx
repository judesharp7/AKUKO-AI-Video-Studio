"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Download, Share2, Plus, CheckCircle2, Film, Sparkles } from "lucide-react";
import { StudioStepbar } from "@/components/studio/StudioStepbar";
import { ErrorBanner, LoadingActivity } from "@/components/studio/StateFeedback";
import type { ExportRecord, ExportResolution, Project, Scene, UserProfile } from "@/types/database";

export default function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState<ExportResolution>("1080p");
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const { data: exportsData } = useQuery<{ exports: ExportRecord[] }>({
    queryKey: ["exports", id],
    queryFn: async () => (await fetch(`/api/projects/${id}/export`)).json(),
  });

  const scenes = scenesData?.scenes ?? [];
  const totalSeconds = scenes.reduce((s, sc) => s + sc.duration_seconds, 0);
  const isFree = userData?.user?.plan === "free";
  const latestExport = exportsData?.exports?.[0];

  async function handleExport() {
    setError(null);
    setExporting(true);
    try {
      const res = await fetch(`/api/projects/${id}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.userMessage || "Export failed");
      await queryClient.invalidateQueries({ queryKey: ["exports", id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B10]">
      <StudioStepbar
        projectId={id}
        projectName={projectData?.project?.name ?? "Project"}
        currentStep="export"
        creditBalance={userData?.user?.credit_balance}
      />

      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Final Preview &amp; Export</h1>
          <p className="text-sm text-[#A1A1AA]">
            Produce an immutable MP4 file with mixed voice, music, and burned-in subtitles.
          </p>
        </div>

        {error && <ErrorBanner message={error} />}
        {exporting && <LoadingActivity activity="Finalizing Video: concatenating scenes, mixing audio, and encoding MP4..." />}

        <div className="rounded-2xl border border-[#26262F] bg-[#15151C] p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Production Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="rounded-xl border border-[#26262F] bg-[#0B0B10] p-3.5">
              <span className="text-xs text-[#A1A1AA]">Total Duration</span>
              <p className="font-mono text-base font-bold text-white mt-1">
                {Math.floor(totalSeconds / 60)}m {totalSeconds % 60}s
              </p>
            </div>
            <div className="rounded-xl border border-[#26262F] bg-[#0B0B10] p-3.5">
              <span className="text-xs text-[#A1A1AA]">Scenes</span>
              <p className="font-mono text-base font-bold text-white mt-1">{scenes.length}</p>
            </div>
            <div className="rounded-xl border border-[#26262F] bg-[#0B0B10] p-3.5">
              <span className="text-xs text-[#A1A1AA]">Audio Mix</span>
              <p className="text-base font-bold text-white mt-1">Voice + Music</p>
            </div>
            <div className="rounded-xl border border-[#26262F] bg-[#0B0B10] p-3.5">
              <span className="text-xs text-[#A1A1AA]">Subtitles</span>
              <p className="text-base font-bold text-[#22C55E] mt-1">Included</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Resolution</label>
            <div className="grid grid-cols-3 gap-3">
              {(["720p", "1080p", "4k"] as ExportResolution[]).map((resOpt) => {
                const disabled = isFree && resOpt !== "720p";
                return (
                  <button
                    key={resOpt}
                    type="button"
                    disabled={disabled}
                    onClick={() => setResolution(resOpt)}
                    className={`rounded-xl border p-3 text-center transition ${
                      resolution === resOpt
                        ? "border-[#7C5CFF] bg-[#7C5CFF]/15 text-white"
                        : "border-[#26262F] bg-[#0B0B10] text-[#A1A1AA]"
                    } disabled:opacity-40`}
                  >
                    <span className="font-mono text-sm font-bold uppercase">{resOpt}</span>
                    <span className="block text-[11px] mt-0.5">
                      {resOpt === "720p" && isFree ? "Free (Watermarked)" : "MP4 H.264"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl studio-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:opacity-95 disabled:opacity-50"
          >
            <Film className="h-4 w-4" />
            {exporting ? "Encoding MP4..." : `Export ${resolution.toUpperCase()} MP4`}
          </button>
        </div>

        {latestExport && (
          <div className="rounded-2xl border border-[#22C55E]/40 bg-[#15151C] p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#22C55E]">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="text-lg font-bold text-white">Your Video is Ready!</h3>
            </div>
            <p className="text-xs text-[#A1A1AA]">
              Immutable Export • {latestExport.resolution.toUpperCase()} MP4 •{" "}
              {latestExport.watermarked ? "Storyboard Watermark" : "Clean Master"}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`/api/projects/${id}/export/${latestExport.id}/download`}
                download={`${projectData?.project?.name || "akuko-video"}.mp4`}
                className="inline-flex items-center gap-2 rounded-xl studio-gradient px-5 py-2.5 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" />
                Download Video
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#26262F] bg-[#0B0B10] px-5 py-2.5 text-sm font-medium text-white"
              >
                <Share2 className="h-4 w-4" />
                {copied ? "Link Copied!" : "Share"}
              </button>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 rounded-xl border border-[#26262F] bg-[#0B0B10] px-5 py-2.5 text-sm font-medium text-white hover:border-[#7C5CFF]"
              >
                <Plus className="h-4 w-4" />
                Create Another Video
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

