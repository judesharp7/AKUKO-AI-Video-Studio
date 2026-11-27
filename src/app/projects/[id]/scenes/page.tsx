"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, GripVertical, Plus, Sparkles, Trash2, Copy, Wand2 } from "lucide-react";
import { StudioStepbar } from "@/components/studio/StudioStepbar";
import { ErrorBanner, LoadingActivity } from "@/components/studio/StateFeedback";
import type { Project, Scene, UserProfile } from "@/types/database";

function SortableSceneCard({
  scene,
  index,
  onExpand,
  onDelete,
  onDuplicate,
  onUpdateDuration,
}: {
  scene: Scene;
  index: number;
  onExpand: (s: Scene) => void;
  onDelete: (id: string) => void;
  onDuplicate: (s: Scene) => void;
  onUpdateDuration: (id: string, sec: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: scene.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-[#26262F] bg-[#15151C] p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder scene"
            className="cursor-grab rounded-lg border border-[#26262F] bg-[#0B0B10] p-1.5 text-[#A1A1AA] hover:text-white"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div>
            <span className="font-mono text-xs text-[#7C5CFF]">SCENE {String(index + 1).padStart(2, "0")}</span>
            <h3 className="text-base font-semibold text-white">{scene.location_name || "Studio Location"}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[#A1A1AA]">Duration:</label>
          <input
            type="number"
            min={2}
            max={15}
            value={scene.duration_seconds}
            onChange={(e) => onUpdateDuration(scene.id, Number(e.target.value))}
            className="w-16 rounded-lg border border-[#26262F] bg-[#0B0B10] px-2 py-1 font-mono text-xs text-white"
          />
          <span className="text-xs text-[#A1A1AA]">sec</span>

          <button
            type="button"
            onClick={() => onExpand(scene)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#7C5CFF]/15 border border-[#7C5CFF]/40 px-2.5 py-1 text-xs font-medium text-[#A78BFA] hover:bg-[#7C5CFF]/25"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Expand Prompt
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(scene)}
            aria-label="Duplicate scene"
            className="rounded-lg border border-[#26262F] bg-[#0B0B10] p-1.5 text-[#A1A1AA] hover:text-white"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(scene.id)}
            aria-label="Delete scene"
            className="rounded-lg border border-[#26262F] bg-[#0B0B10] p-1.5 text-[#A1A1AA] hover:text-[#EF4444]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Side-by-Side Prompt Assistant */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#26262F] bg-[#0B0B10] p-3.5 space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
            Original Scene Description
          </span>
          <p className="text-xs text-white">{scene.visual_prompt || scene.action}</p>
          {scene.dialogue && (
            <p className="text-xs text-[#3B82F6] italic pt-1">&ldquo;{scene.dialogue}&rdquo;</p>
          )}
        </div>
        <div className="rounded-xl border border-[#7C5CFF]/30 bg-[#0B0B10] p-3.5 space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A78BFA] flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI Production Prompt
          </span>
          <p className="text-xs text-[#A1A1AA]">
            {scene.ai_prompt || "Click 'Expand Prompt' to inject character references, location, and style bible."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ScenesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [busyMsg, setBusyMsg] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
  const totalSeconds = scenes.reduce((sum, s) => sum + (s.duration_seconds || 10), 0);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = scenes.findIndex((s) => s.id === active.id);
    const newIndex = scenes.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(scenes, oldIndex, newIndex);
    queryClient.setQueryData(["scenes", id], { scenes: reordered });
    await fetch("/api/scenes/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sceneIds: reordered.map((s) => s.id) }),
    });
  }

  async function handleAddScene() {
    setError(null);
    const res = await fetch(`/api/projects/${id}/scenes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        location_name: "New Scene Location",
        action: "Characters continue the conversation with renewed determination.",
        duration_seconds: 10,
      }),
    });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ["scenes", id] });
    }
  }

  async function handleExpand(scene: Scene) {
    setError(null);
    setBusyMsg("Expanding scene into production prompt...");
    try {
      const res = await fetch(`/api/scenes/${scene.id}/expand-prompt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.userMessage || "Prompt expansion failed");
      await queryClient.invalidateQueries({ queryKey: ["scenes", id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prompt expansion failed");
    } finally {
      setBusyMsg(null);
    }
  }

  async function handleUpdateDuration(sceneId: string, sec: number) {
    setError(null);
    const res = await fetch(`/api/scenes/${sceneId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ duration_seconds: sec }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.userMessage || "Invalid duration");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["scenes", id] });
  }

  async function handleDuplicate(scene: Scene) {
    await fetch(`/api/projects/${id}/scenes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        location_name: `${scene.location_name} (Copy)`,
        action: scene.action,
        dialogue: scene.dialogue,
        duration_seconds: scene.duration_seconds,
        visual_prompt: scene.visual_prompt,
        ai_prompt: scene.ai_prompt,
      }),
    });
    await queryClient.invalidateQueries({ queryKey: ["scenes", id] });
  }

  async function handleDelete(sceneId: string) {
    await fetch(`/api/scenes/${sceneId}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["scenes", id] });
  }

  return (
    <div className="min-h-screen bg-[#0B0B10]">
      <StudioStepbar
        projectId={id}
        projectName={projectData?.project?.name ?? "Project"}
        currentStep="scenes"
        creditBalance={userData?.user?.credit_balance}
      />

      <main className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Scene Builder &amp; Prompt Assistant</h1>
            <p className="text-sm text-[#A1A1AA]">
              {scenes.length} scenes • Total estimated runtime:{" "}
              <span className="font-mono text-white">{Math.floor(totalSeconds / 60)}m {totalSeconds % 60}s</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddScene}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#26262F] bg-[#15151C] px-4 py-2.5 text-sm font-medium text-white hover:border-[#7C5CFF]"
            >
              <Plus className="h-4 w-4" />
              Add Scene
            </button>
            <Link
              href={`/projects/${id}/generate`}
              className="inline-flex items-center gap-2 rounded-xl studio-gradient px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition"
            >
              Next: Generate Video
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}
        {busyMsg && <LoadingActivity activity={busyMsg} />}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {scenes.map((scene, idx) => (
                <SortableSceneCard
                  key={scene.id}
                  scene={scene}
                  index={idx}
                  onExpand={handleExpand}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onUpdateDuration={handleUpdateDuration}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </main>
    </div>
  );
}

