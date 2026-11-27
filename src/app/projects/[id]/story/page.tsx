"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, ArrowRight, History, Save } from "lucide-react";
import { StudioStepbar } from "@/components/studio/StudioStepbar";
import { ErrorBanner, LoadingActivity } from "@/components/studio/StateFeedback";
import type { Project, ScriptRecord, StoryJSON, UserProfile } from "@/types/database";

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [idea, setIdea] = useState("");
  const [story, setStory] = useState<StoryJSON | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: userData } = useQuery<{ user: UserProfile }>({
    queryKey: ["user"],
    queryFn: async () => (await fetch("/api/user")).json(),
  });

  const { data: projectData } = useQuery<{ project: Project }>({
    queryKey: ["project", id],
    queryFn: async () => (await fetch(`/api/projects/${id}`)).json(),
  });

  const { data: scriptsData } = useQuery<{ scripts: ScriptRecord[]; latest: ScriptRecord | null }>({
    queryKey: ["scripts", id],
    queryFn: async () => (await fetch(`/api/projects/${id}/scripts`)).json(),
  });

  useEffect(() => {
    if (scriptsData?.latest) {
      setStory(scriptsData.latest.story_json);
      setScriptText(scriptsData.latest.script_text);
    }
  }, [scriptsData?.latest]);

  async function handleGenerateStory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusyMsg("Generating structured story outline with AI...");
    try {
      const res = await fetch(`/api/projects/${id}/generate-story`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.userMessage || "Story generation failed");
      setStory(data.story);
      await queryClient.invalidateQueries({ queryKey: ["scripts", id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Story generation failed");
    } finally {
      setBusyMsg(null);
    }
  }

  async function handleGenerateScriptAndScenes() {
    setError(null);
    setBusyMsg("Generating full script and parsing into scenes...");
    try {
      const res = await fetch(`/api/projects/${id}/generate-script`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parseScenes: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.userMessage || "Script generation failed");
      setScriptText(data.script.script_text);
      await queryClient.invalidateQueries({ queryKey: ["scripts", id] });
      router.push(`/projects/${id}/scenes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Script generation failed");
    } finally {
      setBusyMsg(null);
    }
  }

  async function handleSaveVersion() {
    setBusyMsg("Saving new script version...");
    try {
      await fetch(`/api/projects/${id}/scripts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ story_json: story, script_text: scriptText }),
      });
      await queryClient.invalidateQueries({ queryKey: ["scripts", id] });
    } finally {
      setBusyMsg(null);
    }
  }

  const versions = scriptsData?.scripts ?? [];

  return (
    <div className="min-h-screen bg-[#0B0B10]">
      <StudioStepbar
        projectId={id}
        projectName={projectData?.project?.name ?? "Project"}
        currentStep="story"
        creditBalance={userData?.user?.credit_balance}
      />

      <main className="mx-auto max-w-6xl p-6 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Story &amp; Script Engine</h1>
            <p className="text-sm text-[#A1A1AA]">
              Describe your video idea in plain language. Every edit is saved as a new version.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateScriptAndScenes}
            disabled={Boolean(busyMsg)}
            className="inline-flex items-center gap-2 rounded-xl studio-gradient px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition disabled:opacity-50"
          >
            Approve &amp; Build Scenes
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {error && <ErrorBanner message={error} />}
        {busyMsg && <LoadingActivity activity={busyMsg} />}

        {/* Idea Prompt */}
        <form
          onSubmit={handleGenerateStory}
          className="rounded-2xl border border-[#26262F] bg-[#15151C] p-6 space-y-4"
        >
          <label className="block text-sm font-semibold text-white">What is your video about?</label>
          <textarea
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g., A young Nigerian architect races against a monsoon to power up a solar community hub in Lagos."
            className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] p-4 text-sm text-white placeholder-[#A1A1AA]/50 focus:border-[#7C5CFF] focus:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#A1A1AA]">
              Validated against structured JSON schema with automatic repair.
            </span>
            <button
              type="submit"
              disabled={Boolean(busyMsg)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1F1F29] border border-[#7C5CFF]/50 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7C5CFF]/20 transition"
            >
              <Sparkles className="h-4 w-4 text-[#7C5CFF]" />
              Generate Structured Story
            </button>
          </div>
        </form>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Structured Story Outline */}
          <section className="rounded-2xl border border-[#26262F] bg-[#15151C] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#7C5CFF]" />
              Structured Story Outline
            </h2>

            {story ? (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs uppercase text-[#A1A1AA]">Title</span>
                  <p className="text-base font-bold text-white">{story.title}</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-[#A1A1AA]">Summary</span>
                  <p className="text-[#A1A1AA] mt-1">{story.summary}</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-[#A1A1AA]">Core Conflict</span>
                  <p className="text-[#A1A1AA] mt-1">{story.conflict}</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-[#A1A1AA]">Key Plot Beats</span>
                  <ul className="mt-1 space-y-1.5 list-disc list-inside text-[#A1A1AA]">
                    {story.events.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl border border-[#26262F] bg-[#0B0B10] p-3">
                    <span className="text-[11px] uppercase text-[#7C5CFF]">Climax</span>
                    <p className="text-xs text-[#A1A1AA] mt-1">{story.climax}</p>
                  </div>
                  <div className="rounded-xl border border-[#26262F] bg-[#0B0B10] p-3">
                    <span className="text-[11px] uppercase text-[#22C55E]">Ending</span>
                    <p className="text-xs text-[#A1A1AA] mt-1">{story.ending}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#A1A1AA]">Enter an idea above to generate your story outline.</p>
            )}
          </section>

          {/* Script Editor & Versions */}
          <section className="rounded-2xl border border-[#26262F] bg-[#15151C] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#3B82F6]" />
                Production Script
              </h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs text-[#A1A1AA]">
                  <History className="h-3.5 w-3.5" /> v{versions[0]?.version ?? 1}
                </span>
                <button
                  type="button"
                  onClick={handleSaveVersion}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#26262F] bg-[#0B0B10] px-3 py-1.5 text-xs font-medium text-white hover:border-[#7C5CFF]"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Version
                </button>
              </div>
            </div>

            <textarea
              rows={14}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="SCENE 1 - LOCATION - DAY..."
              className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] p-4 font-mono text-xs leading-relaxed text-white focus:border-[#3B82F6] focus:outline-none"
            />
          </section>
        </div>
      </main>
    </div>
  );
}

