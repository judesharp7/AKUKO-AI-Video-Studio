import { create } from "zustand";
import crypto from "crypto";
import type { EditDecisionList, TimelineClip } from "@/types/database";

interface TimelineState {
  edl: EditDecisionList | null;
  past: EditDecisionList[];
  future: EditDecisionList[];
  selectedClipId: string | null;
  playheadSeconds: number;
  dirty: boolean;
  setInitialEdl: (edl: EditDecisionList) => void;
  selectClip: (id: string | null) => void;
  setPlayhead: (sec: number) => void;
  markSaved: () => void;
  trimClip: (id: string, newDuration: number) => void;
  splitClip: (id: string, atOffsetSeconds: number) => void;
  deleteClip: (id: string) => void;
  duplicateClip: (id: string) => void;
  setTransition: (id: string, transition: "cut" | "fade" | "dissolve") => void;
  reorderVideoClip: (fromId: string, toId: string) => void;
  undo: () => void;
  redo: () => void;
}

function recomputeTotal(clips: TimelineClip[]): number {
  return Number(
    clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0).toFixed(2)
  );
}

function pushHistory(state: TimelineState, nextClips: TimelineClip[]): Partial<TimelineState> {
  if (!state.edl) return {};
  const nextEdl: EditDecisionList = {
    ...state.edl,
    clips: nextClips,
    totalDuration: recomputeTotal(nextClips),
  };
  return {
    edl: nextEdl,
    past: [...state.past.slice(-29), state.edl],
    future: [],
    dirty: true,
  };
}

export const useTimelineStore = create<TimelineState>((set) => ({
  edl: null,
  past: [],
  future: [],
  selectedClipId: null,
  playheadSeconds: 0,
  dirty: false,

  setInitialEdl: (edl) => set({ edl, past: [], future: [], dirty: false }),
  selectClip: (id) => set({ selectedClipId: id }),
  setPlayhead: (sec) => set({ playheadSeconds: Math.max(0, sec) }),
  markSaved: () => set({ dirty: false }),

  trimClip: (id, newDuration) =>
    set((state) => {
      if (!state.edl) return {};
      const clamped = Math.max(2, Math.min(30, newDuration));
      const nextClips = state.edl.clips.map((c) => (c.id === id ? { ...c, duration: clamped } : c));
      return pushHistory(state, nextClips);
    }),

  splitClip: (id, atOffsetSeconds) =>
    set((state) => {
      if (!state.edl) return {};
      const target = state.edl.clips.find((c) => c.id === id);
      if (!target || target.duration <= 4) return {};
      const splitPoint = Math.max(2, Math.min(target.duration - 2, atOffsetSeconds));
      const firstHalf: TimelineClip = { ...target, duration: splitPoint };
      const secondHalf: TimelineClip = {
        ...target,
        id: typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : `${id}_2_${Date.now()}`,
        label: `${target.label} (Part 2)`,
        startTime: target.startTime + splitPoint,
        duration: Number((target.duration - splitPoint).toFixed(2)),
        trimStart: target.trimStart + splitPoint,
      };
      const idx = state.edl.clips.findIndex((c) => c.id === id);
      const nextClips = [...state.edl.clips];
      nextClips.splice(idx, 1, firstHalf, secondHalf);
      return pushHistory(state, nextClips);
    }),

  deleteClip: (id) =>
    set((state) => {
      if (!state.edl) return {};
      const nextClips = state.edl.clips.filter((c) => c.id !== id);
      return { ...pushHistory(state, nextClips), selectedClipId: null };
    }),

  duplicateClip: (id) =>
    set((state) => {
      if (!state.edl) return {};
      const target = state.edl.clips.find((c) => c.id === id);
      if (!target) return {};
      const copy: TimelineClip = {
        ...target,
        id: typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : `${id}_copy_${Date.now()}`,
        label: `${target.label} (Copy)`,
        startTime: target.startTime + target.duration,
      };
      const idx = state.edl.clips.findIndex((c) => c.id === id);
      const nextClips = [...state.edl.clips];
      nextClips.splice(idx + 1, 0, copy);
      return pushHistory(state, nextClips);
    }),

  setTransition: (id, transition) =>
    set((state) => {
      if (!state.edl) return {};
      const nextClips = state.edl.clips.map((c) => (c.id === id ? { ...c, transition } : c));
      return pushHistory(state, nextClips);
    }),

  reorderVideoClip: (fromId, toId) =>
    set((state) => {
      if (!state.edl || fromId === toId) return {};
      const videoClips = state.edl.clips.filter((c) => c.track === "video");
      const otherClips = state.edl.clips.filter((c) => c.track !== "video");
      const fromIdx = videoClips.findIndex((c) => c.id === fromId);
      const toIdx = videoClips.findIndex((c) => c.id === toId);
      if (fromIdx === -1 || toIdx === -1) return {};
      const [moved] = videoClips.splice(fromIdx, 1);
      videoClips.splice(toIdx, 0, moved);

      let cursor = 0;
      const reflowed = videoClips.map((c) => {
        const updated = { ...c, startTime: cursor };
        cursor += c.duration;
        return updated;
      });
      return pushHistory(state, [...reflowed, ...otherClips]);
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0 || !state.edl) return {};
      const previous = state.past[state.past.length - 1];
      return {
        edl: previous,
        past: state.past.slice(0, -1),
        future: [state.edl, ...state.future],
        dirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0 || !state.edl) return {};
      const next = state.future[0];
      return {
        edl: next,
        past: [...state.past, state.edl],
        future: state.future.slice(1),
        dirty: true,
      };
    }),
}));

// Keep crypto import used cleanly in node/test environments
export const _unusedCryptoRef = typeof crypto;

