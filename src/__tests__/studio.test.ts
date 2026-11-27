import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET as downloadExport } from "@/app/api/projects/[id]/export/[exportId]/download/route";
import fc from "fast-check";
import {
  isDisposableEmail,
  moderatePrompt,
  modelRegistry,
  parseAndRepairJSON,
  StoryJSONSchema,
  imageProvider,
} from "@/lib/providers";
import { estimateProjectCredits, estimateSceneCredits, hasSufficientCredits } from "@/lib/credits/ledger";
import { parseScriptToScenes, generateSubtitlesFromScenes } from "@/lib/workflow/pipeline";
import { useTimelineStore } from "@/lib/stores/timeline-store";
import { readDb } from "@/lib/db/store";

describe("AKUKO AI Video Studio — Core & Property Tests", () => {
  it("downloads exported MP4s as attachments through the app", async () => {
    const db = readDb();
    const originalExports = [...db.exports];
    const project = db.projects[0];
    const exportId = "download-test-export";
    db.exports.unshift({
      id: exportId,
      project_id: project.id,
      timeline_version: 1,
      resolution: "1080p",
      format: "mp4",
      status: "complete",
      watermarked: false,
      download_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4",
      created_at: new Date().toISOString(),
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));

    try {
      const response = await downloadExport(new Request("http://localhost"), {
        params: Promise.resolve({ id: project.id, exportId }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-disposition")).toContain("attachment");
      expect(response.headers.get("content-type")).toBe("video/mp4");
      expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([1, 2, 3]);
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally {
      db.exports.splice(0, db.exports.length, ...originalExports);
      fetchMock.mockRestore();
    }
  });

  it("rejects export download URLs outside the trusted demo host", async () => {
    const db = readDb();
    const originalExports = [...db.exports];
    const project = db.projects[0];
    const exportId = "untrusted-download-test";
    db.exports.unshift({
      id: exportId,
      project_id: project.id,
      timeline_version: 1,
      resolution: "1080p",
      format: "mp4",
      status: "complete",
      watermarked: false,
      download_url: "https://example.com/video.mp4",
      created_at: new Date().toISOString(),
    });
    const fetchMock = vi.spyOn(globalThis, "fetch");

    try {
      const response = await downloadExport(new Request("http://localhost"), {
        params: Promise.resolve({ id: project.id, exportId }),
      });

      expect(response.status).toBe(502);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      db.exports.splice(0, db.exports.length, ...originalExports);
      fetchMock.mockRestore();
    }
  });

  it("Property 1: Disposable email domains are always blocked", () => {
    const blockedDomains = ["mailinator.com", "guerrillamail.com", "tempmail.com", "yopmail.com"];
    for (const domain of blockedDomains) {
      expect(isDisposableEmail(`creator@${domain}`)).toBe(true);
    }
    expect(isDisposableEmail("creator@akuko.ai")).toBe(false);
  });

  it("Property 2: Content moderation blocks real-person likeness and unsafe prompts", () => {
    expect(moderatePrompt("Photorealistic celebrity walking in Lagos").allowed).toBe(false);
    expect(moderatePrompt("A fictional young architect inspecting solar panels").allowed).toBe(true);
    expect(moderatePrompt("   ").allowed).toBe(false);
  });

  it("Property 7: LLM JSON validation and repair handles fenced and trailing-comma JSON", () => {
    const raw = `\`\`\`json
    {
      "title": "Lagos Dawn",
      "summary": "A story of clean energy and resilience in Lagos.",
      "characters": [{"name": "Amara", "role": "Lead", "description": "Architect",}],
      "conflict": "Grid failure threatens the launch.",
      "events": ["Dawn inspection", "Inverter crisis",],
      "climax": "The canopy lights ignite.",
      "ending": "Community celebrates together."
    }
    \`\`\``;
    const result = parseAndRepairJSON(raw, StoryJSONSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Lagos Dawn");
    }
  });

  it("Property 16: Character Reference Kit always generates between 2 and 6 images", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 10 }), async (requested) => {
        const res = await imageProvider.generateImage({ prompt: "Amara portrait", count: requested });
        expect(res.imageUrls.length).toBeGreaterThanOrEqual(2);
        expect(res.imageUrls.length).toBeLessThanOrEqual(6);
      }),
      { numRuns: 10 }
    );
  });

  it("ModelRegistry validates scene durations against model limits", () => {
    expect(modelRegistry.validateSceneDuration(10).valid).toBe(true);
    expect(modelRegistry.validateSceneDuration(1).valid).toBe(false);
    expect(modelRegistry.validateSceneDuration(45, "studio-standard-v3").valid).toBe(false);
  });

  it("Credits & Storyboard Mode estimation works accurately", () => {
    const freeEst = estimateSceneCredits(10, "standard", "free");
    expect(freeEst.storyboardMode).toBe(true);
    expect(freeEst.credits).toBe(0);

    const paidEst = estimateSceneCredits(10, "standard", "creator");
    expect(paidEst.storyboardMode).toBe(false);
    expect(paidEst.credits).toBeGreaterThan(0);

    const projEst = estimateProjectCredits([{ duration_seconds: 10 }, { duration_seconds: 12 }], "standard", "creator");
    expect(projEst.totalSeconds).toBe(22);
    expect(hasSufficientCredits(100, projEst.totalCredits, "creator")).toBe(true);
    expect(hasSufficientCredits(2, projEst.totalCredits, "creator")).toBe(false);
  });

  it("Script-to-Scene parser and Subtitle generator produce aligned outputs", () => {
    const script =
      "SCENE 1 - ROOFTOP - DAWN\nAmara checks the panels.\nAMARA: Today everything changes.\n\nSCENE 2 - CONTROL ROOM\nTunde points at the screen.\nTUNDE: We need a bypass.";
    const scenes = parseScriptToScenes("proj-1", script, 600);
    expect(scenes.length).toBeGreaterThanOrEqual(2);
    const cues = generateSubtitlesFromScenes(scenes);
    expect(cues.length).toBe(scenes.length);
    expect(cues[0].start).toBe(0);
    expect(cues[0].end).toBeGreaterThan(0);
  });

  describe("Zustand Timeline Store Undo/Redo & Clip Operations", () => {
    beforeEach(() => {
      useTimelineStore.getState().setInitialEdl({
        aspectRatio: "16:9",
        totalDuration: 20,
        clips: [
          { id: "c1", track: "video", label: "Scene 1", startTime: 0, duration: 10, trimStart: 0, trimEnd: 0 },
          { id: "c2", track: "video", label: "Scene 2", startTime: 10, duration: 10, trimStart: 0, trimEnd: 0 },
        ],
      });
    });

    it("supports trim, split, delete, undo, and redo", () => {
      const store = useTimelineStore.getState();
      store.trimClip("c1", 8);
      expect(useTimelineStore.getState().edl?.clips[0].duration).toBe(8);

      useTimelineStore.getState().splitClip("c2", 5);
      expect(useTimelineStore.getState().edl?.clips.length).toBe(3);

      useTimelineStore.getState().undo();
      expect(useTimelineStore.getState().edl?.clips.length).toBe(2);

      useTimelineStore.getState().redo();
      expect(useTimelineStore.getState().edl?.clips.length).toBe(3);
    });
  });
});

