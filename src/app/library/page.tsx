"use client";

import { useQuery } from "@tanstack/react-query";
import { Lock, FolderOpen, Film } from "lucide-react";
import { AppSidebar } from "@/components/studio/AppSidebar";
import type { Character, Project, UserProfile } from "@/types/database";

export default function LibraryPage() {
  const { data: userData } = useQuery<{ user: UserProfile }>({
    queryKey: ["user"],
    queryFn: async () => (await fetch("/api/user")).json(),
  });
  const { data: charsData } = useQuery<{ characters: Character[] }>({
    queryKey: ["characters"],
    queryFn: async () => (await fetch("/api/characters")).json(),
  });
  const { data: projectsData } = useQuery<{ projects: Project[] }>({
    queryKey: ["projects"],
    queryFn: async () => (await fetch("/api/projects")).json(),
  });

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#0B0B10]">
      <AppSidebar creditBalance={userData?.user?.credit_balance} plan={userData?.user?.plan} />
      <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-[#7C5CFF]" />
            Asset &amp; Character Library
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Reusable characters, reference kits, and produced projects.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">Saved Characters</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(charsData?.characters ?? []).map((char) => (
              <div key={char.id} className="rounded-2xl border border-[#26262F] bg-[#15151C] p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{char.name}</h3>
                  {char.locked && <Lock className="h-4 w-4 text-[#22C55E]" />}
                </div>
                <p className="text-xs text-[#A1A1AA]">{char.appearance}</p>
                <p className="text-[11px] text-[#7C5CFF]">{char.voice_settings?.voiceName}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">All Projects</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(projectsData?.projects ?? []).map((p) => (
              <div key={p.id} className="rounded-2xl border border-[#26262F] bg-[#15151C] p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                    <Film className="h-4 w-4 text-[#3B82F6]" /> {p.name}
                  </span>
                  <span className="font-mono text-xs text-[#A1A1AA]">{p.aspect_ratio}</span>
                </div>
                <p className="text-xs text-[#A1A1AA] capitalize">Status: {p.status} • {p.scene_count ?? 0} scenes</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

