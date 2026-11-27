"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Play, Clock, Layers, Sparkles, FileText, Wand2 } from "lucide-react";
import { AppSidebar } from "@/components/studio/AppSidebar";
import { EmptyState, LoadingActivity } from "@/components/studio/StateFeedback";
import type { Project, UserProfile } from "@/types/database";

export default function DashboardPage() {
  const router = useRouter();

  const { data: userData } = useQuery<{ user: UserProfile }>({
    queryKey: ["user"],
    queryFn: async () => (await fetch("/api/user")).json(),
  });

  const { data: projectsData, isLoading } = useQuery<{ projects: Project[] }>({
    queryKey: ["projects"],
    queryFn: async () => (await fetch("/api/projects")).json(),
  });

  const projects = projectsData?.projects ?? [];
  const user = userData?.user;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#0B0B10]">
      <AppSidebar creditBalance={user?.credit_balance ?? 250} plan={user?.plan ?? "creator"} />

      <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-6xl">
        {/* Top Greeting */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Studio Dashboard</h1>
            <p className="text-sm text-[#A1A1AA] mt-1">
              Pick up where you left off or start a new long-form AI video.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-xl studio-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95 transition"
          >
            <Plus className="h-4 w-4" />
            Create New Video
          </Link>
        </div>

        {/* Quick Create */}
        <section aria-label="Quick Create">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A1A1AA] mb-3">Quick Create</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/projects/new?mode=idea"
              className="group rounded-2xl border border-[#26262F] bg-[#15151C] p-5 hover:border-[#7C5CFF] transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFF]/15 text-[#7C5CFF] mb-3">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-[#A78BFA]">Start From Idea</h3>
              <p className="mt-1 text-xs text-[#A1A1AA]">Describe your concept in plain words and let AI build the story.</p>
            </Link>

            <Link
              href="/projects/new?mode=script"
              className="group rounded-2xl border border-[#26262F] bg-[#15151C] p-5 hover:border-[#3B82F6] transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-[#60A5FA]">Import Script</h3>
              <p className="mt-1 text-xs text-[#A1A1AA]">Paste an existing script and auto-parse it into scenes.</p>
            </Link>

            <Link
              href="/templates"
              className="group rounded-2xl border border-[#26262F] bg-[#15151C] p-5 hover:border-[#22C55E] transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22C55E]/15 text-[#22C55E] mb-3">
                <Wand2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-[#22C55E]">Use a Template</h3>
              <p className="mt-1 text-xs text-[#A1A1AA]">Start with YouTube Documentary, Product Ad, or Folklore presets.</p>
            </Link>
          </div>
        </section>

        {/* Recent Projects */}
        <section aria-label="Recent Projects" className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Continue Creating</h2>

          {isLoading ? (
            <LoadingActivity activity="Loading your studio projects..." />
          ) : projects.length === 0 ? (
            <EmptyState
              title="Create your first AI video"
              description="Start with a story idea, lock your characters, and AKUKO will guide you to a finished MP4."
              actionLabel="Create New Video"
              onAction={() => router.push("/projects/new")}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const mins = Math.round(project.target_duration_seconds / 60);
                const targetStep = project.current_step === "setup" ? "characters" : project.current_step;
                return (
                  <div
                    key={project.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#26262F] bg-[#15151C] overflow-hidden hover:border-[#3B3B48] transition"
                  >
                    <div className="relative h-36 bg-gradient-to-br from-[#1E1B4B] via-[#15151C] to-[#0F172A] p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-medium capitalize text-white">
                          {project.type}
                        </span>
                        <span className="rounded-full bg-black/50 px-2.5 py-0.5 font-mono text-[11px] text-[#A1A1AA]">
                          {project.aspect_ratio}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white truncate">{project.name}</h3>
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> {mins} min target
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" /> {project.scene_count ?? 0} scenes
                        </span>
                      </div>

                      <Link
                        href={`/projects/${project.id}/${targetStep}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F1F29] border border-[#26262F] px-4 py-2 text-sm font-semibold text-white hover:border-[#7C5CFF] transition"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Continue
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

