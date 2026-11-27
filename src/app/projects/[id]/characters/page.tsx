"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Lock, Unlock, RefreshCw, Sparkles, Plus, Trash2, ThumbsUp, Volume2 } from "lucide-react";
import { StudioStepbar } from "@/components/studio/StudioStepbar";
import { ErrorBanner, LoadingActivity } from "@/components/studio/StateFeedback";
import type { Character, Project, UserProfile } from "@/types/database";

export default function CharactersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [age, setAge] = useState("28");
  const [gender, setGender] = useState("Female");
  const [appearance, setAppearance] = useState("");
  const [clothing, setClothing] = useState("");
  const [personality, setPersonality] = useState("");
  const [accent, setAccent] = useState<"nigerian_english" | "pidgin" | "american" | "british">("nigerian_english");
  const [emotion, setEmotion] = useState<"warm" | "dramatic" | "energetic" | "calm">("warm");
  const [speed, setSpeed] = useState(1.0);
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

  const { data: charsData } = useQuery<{ characters: Character[] }>({
    queryKey: ["characters"],
    queryFn: async () => (await fetch("/api/characters")).json(),
  });

  const characters = charsData?.characters ?? [];

  async function handleCreateCharacter(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusyMsg("Creating character & generating 4-pose reference kit...");
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          age: Number(age) || null,
          gender,
          appearance,
          clothing: clothing || "Contemporary attire",
          personality: personality || "Expressive lead",
          voice_settings: {
            voiceId: accent === "pidgin" ? "ng_pidgin_tunde" : "ng_amara",
            voiceName: accent === "pidgin" ? "Tunde (Nigerian Pidgin)" : "Amara (Nigerian English)",
            accent,
            emotion,
            speed,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.userMessage || "Failed to create character");

      await fetch(`/api/characters/${data.character.id}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count: 4 }),
      });

      setName("");
      setAppearance("");
      setClothing("");
      setPersonality("");
      await queryClient.invalidateQueries({ queryKey: ["characters"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create character");
    } finally {
      setBusyMsg(null);
    }
  }

  async function handleGenerateKit(charId: string, regenerateIndex?: number) {
    setError(null);
    setBusyMsg(
      typeof regenerateIndex === "number"
        ? `Regenerating reference pose #${regenerateIndex + 1}...`
        : "Generating 4-image character reference kit..."
    );
    try {
      const res = await fetch(`/api/characters/${charId}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count: 4, regenerateIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.userMessage || "Generation failed");
      await queryClient.invalidateQueries({ queryKey: ["characters"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusyMsg(null);
    }
  }

  async function handleToggleLock(char: Character) {
    setError(null);
    const res = await fetch(`/api/characters/${char.id}/lock`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locked: !char.locked }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.userMessage || "Could not lock character");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["characters"] });
  }

  async function handleDelete(charId: string) {
    await fetch(`/api/characters/${charId}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["characters"] });
  }

  return (
    <div className="min-h-screen bg-[#0B0B10]">
      <StudioStepbar
        projectId={id}
        projectName={projectData?.project?.name ?? "Project"}
        currentStep="characters"
        creditBalance={userData?.user?.credit_balance}
      />

      <main className="mx-auto max-w-7xl p-6 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Character Studio &amp; Reference Kits</h1>
            <p className="text-sm text-[#A1A1AA]">
              Lock 2–6 reference images and a consistent voice per character before generating scenes.
            </p>
          </div>
          <Link
            href={`/projects/${id}/story`}
            className="inline-flex items-center gap-2 rounded-xl studio-gradient px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition"
          >
            Next: Story &amp; Script
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {error && <ErrorBanner message={error} />}
        {busyMsg && <LoadingActivity activity={busyMsg} />}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Create Character Form */}
          <form
            onSubmit={handleCreateCharacter}
            className="lg:col-span-4 rounded-2xl border border-[#26262F] bg-[#15151C] p-6 space-y-4 h-fit"
          >
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#7C5CFF]" />
              New Character
            </h2>

            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Character Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kemi Balogun"
                className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] px-3 py-2 text-sm text-white focus:border-[#7C5CFF] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] px-3 py-2 text-sm text-white focus:border-[#7C5CFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A1A1AA] mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] px-3 py-2 text-sm text-white focus:border-[#7C5CFF] focus:outline-none"
                >
                  <option>Female</option>
                  <option>Male</option>
                  <option>Non-binary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Appearance</label>
              <textarea
                required
                rows={2}
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                placeholder="Warm dark skin, braided hair, expressive eyes..."
                className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] px-3 py-2 text-sm text-white focus:border-[#7C5CFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Clothing</label>
              <input
                value={clothing}
                onChange={(e) => setClothing(e.target.value)}
                placeholder="Emerald Ankara jacket, white tee"
                className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] px-3 py-2 text-sm text-white focus:border-[#7C5CFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Personality</label>
              <input
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Bold, witty, resourceful"
                className="w-full rounded-xl border border-[#26262F] bg-[#0B0B10] px-3 py-2 text-sm text-white focus:border-[#7C5CFF] focus:outline-none"
              />
            </div>

            <div className="border-t border-[#26262F] pt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Volume2 className="h-3.5 w-3.5 text-[#3B82F6]" />
                Voice Settings
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={accent}
                  onChange={(e) => setAccent(e.target.value as typeof accent)}
                  className="rounded-xl border border-[#26262F] bg-[#0B0B10] px-2.5 py-2 text-xs text-white"
                >
                  <option value="nigerian_english">Nigerian English</option>
                  <option value="pidgin">Nigerian Pidgin</option>
                  <option value="american">American</option>
                  <option value="british">British</option>
                </select>
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value as typeof emotion)}
                  className="rounded-xl border border-[#26262F] bg-[#0B0B10] px-2.5 py-2 text-xs text-white"
                >
                  <option value="warm">Warm</option>
                  <option value="dramatic">Dramatic</option>
                  <option value="energetic">Energetic</option>
                  <option value="calm">Calm</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-[#A1A1AA] mb-1">
                  <span>Speed</span>
                  <span className="font-mono">{speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-[#7C5CFF]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={Boolean(busyMsg)}
              className="flex w-full items-center justify-center gap-2 rounded-xl studio-gradient px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Create &amp; Generate Kit
            </button>
          </form>

          {/* Character Library */}
          <div className="lg:col-span-8 space-y-4">
            {characters.map((char) => {
              const consistency =
                char.consistency_total > 0
                  ? Math.round((char.consistency_thumbs_up / char.consistency_total) * 100)
                  : 100;
              return (
                <div
                  key={char.id}
                  className="rounded-2xl border border-[#26262F] bg-[#15151C] p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-white">{char.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            char.locked
                              ? "bg-[#22C55E]/15 text-[#22C55E]"
                              : "bg-[#F59E0B]/15 text-[#F59E0B]"
                          }`}
                        >
                          {char.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          {char.locked ? "Locked Kit" : "Draft"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#0B0B10] px-2.5 py-0.5 text-[11px] text-[#A1A1AA]">
                          <ThumbsUp className="h-3 w-3 text-[#3B82F6]" />
                          {consistency}% consistent
                        </span>
                      </div>
                      <p className="text-xs text-[#A1A1AA] mt-1">
                        {char.appearance} • {char.clothing}
                      </p>
                      <p className="text-[11px] text-[#7C5CFF] mt-0.5">
                        Voice: {char.voice_settings?.voiceName ?? "Amara (Nigerian English)"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!char.locked && (
                        <button
                          type="button"
                          onClick={() => handleGenerateKit(char.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#26262F] bg-[#0B0B10] px-3 py-1.5 text-xs text-white hover:border-[#7C5CFF]"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Generate Kit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleLock(char)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          char.locked
                            ? "border border-[#26262F] bg-[#0B0B10] text-[#A1A1AA] hover:text-white"
                            : "bg-[#22C55E] text-black font-semibold"
                        }`}
                      >
                        {char.locked ? "Unlock" : "Approve & Lock"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(char.id)}
                        aria-label={`Delete ${char.name}`}
                        className="rounded-lg border border-[#26262F] bg-[#0B0B10] p-1.5 text-[#A1A1AA] hover:text-[#EF4444]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Reference Kit Gallery */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(char.reference_urls?.length
                      ? char.reference_urls
                      : char.reference_asset_ids.map((_, i) => `Pose ${i + 1}`)
                    ).map((item, idx) => {
                      const isUrl = item.startsWith("data:") || item.startsWith("http");
                      return (
                        <div
                          key={idx}
                          className="group relative aspect-video overflow-hidden rounded-xl border border-[#26262F] bg-[#0B0B10]"
                        >
                          {isUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item} alt={`${char.name} pose ${idx + 1}`} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1E1B4B] to-[#0F172A] text-xs font-medium text-[#A1A1AA]">
                              {char.name} • {item}
                            </div>
                          )}
                          {!char.locked && (
                            <button
                              type="button"
                              onClick={() => handleGenerateKit(char.id, idx)}
                              className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition"
                            >
                              Regenerate
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

