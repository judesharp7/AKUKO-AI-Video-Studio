import crypto from "crypto";
import type { Scene, SubtitleCue } from "@/types/database";
import { llmProvider, modelRegistry, moderatePrompt, videoProvider, voiceProvider } from "@/lib/providers";
import type { StudioDatabase } from "@/lib/db/store";
import { appendLedger, getActiveUser } from "@/lib/db/store";
import { estimateSceneCredits } from "@/lib/credits/ledger";

export function parseScriptToScenes(
  projectId: string,
  scriptText: string,
  targetDurationSeconds: number,
  characterIds: string[] = []
): Scene[] {
  const now = new Date().toISOString();
  const blocks = scriptText
    .split(/\n{2,}|(?=SCENE\s+\d+)/i)
    .map((b) => b.trim())
    .filter((b) => b.length > 5);

  const count = Math.max(blocks.length, Math.min(12, Math.max(3, Math.round(targetDurationSeconds / 150))));
  const defaultDuration = Math.min(15, Math.max(6, Math.round(targetDurationSeconds / Math.max(count, 1))));

  const scenes: Scene[] = [];
  for (let i = 0; i < count; i++) {
    const block = blocks[i % Math.max(blocks.length, 1)] || `Scene ${i + 1} continuation of the story.`;
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const header = lines[0] || `Location ${i + 1}`;
    const dialogueLine = lines.find((l) => /^[A-Z][A-Z\s]+:/.test(l)) || "";
    const dialogue = dialogueLine.replace(/^[A-Z][A-Z\s]+:\s*/, "");
    const action = lines.filter((l) => l !== header && l !== dialogueLine).join(" ") || block;

    scenes.push({
      id: crypto.randomUUID(),
      project_id: projectId,
      position: (i + 1) * 1000,
      duration_seconds: Math.min(15, defaultDuration),
      location_name: header.replace(/^SCENE\s+\d+\s*[-–]\s*/i, "").slice(0, 60) || "Studio Location",
      character_ids: characterIds,
      action: action.slice(0, 300),
      dialogue: dialogue.slice(0, 240),
      camera: i % 3 === 0 ? "Wide establishing shot" : i % 3 === 1 ? "Medium tracking shot" : "Close-up emotional framing",
      mood: i % 2 === 0 ? "Cinematic" : "Dramatic",
      visual_prompt: action.slice(0, 240),
      ai_prompt: `${header}: ${action}. ${dialogue ? `Dialogue: "${dialogue}".` : ""} Cinematic 35mm lighting.`,
      status: "ready",
      created_at: now,
      updated_at: now,
    });
  }

  return scenes;
}

export async function runSceneGeneration(
  db: StudioDatabase,
  scene: Scene,
  userId: string,
  previousScene?: Scene
): Promise<{ scene: Scene; takeId?: string }> {
  const project = db.projects.find((p) => p.id === scene.project_id);
  const user = getActiveUser(db, userId);

  // Enforce locked character reference kit requirement if characters are attached
  if (scene.character_ids.length > 0) {
    const unlocked = db.characters.filter(
      (c) => scene.character_ids.includes(c.id) && (!c.locked || c.reference_asset_ids.length < 2)
    );
    if (unlocked.length > 0) {
      scene.status = "blocked";
      scene.error_message = `Character "${unlocked[0].name}" must have an approved & locked Reference Kit (2-6 images) before generating.`;
      scene.updated_at = new Date().toISOString();
      return { scene };
    }
  }

  const promptToUse = scene.ai_prompt || scene.visual_prompt || scene.action;
  const mod = moderatePrompt(promptToUse);
  if (!mod.allowed) {
    scene.status = "blocked";
    scene.error_message = mod.userMessage || "Blocked by content moderation.";
    scene.updated_at = new Date().toISOString();
    return { scene };
  }

  // Voice-first timing if dialogue is present
  if (scene.dialogue.trim()) {
    const voiceRes = await voiceProvider.synthesize({
      text: scene.dialogue,
      settings: {
        voiceId: "ng_amara",
        voiceName: "Amara (Nigerian English)",
        accent: "nigerian_english",
        emotion: "warm",
        speed: 1.0,
      },
      idempotencyKey: `vox_${scene.id}_${Date.now()}`,
    });
    scene.voice_url = voiceRes.outputURL;
    if (voiceRes.durationSeconds > scene.duration_seconds && voiceRes.durationSeconds <= 15) {
      scene.duration_seconds = Math.ceil(voiceRes.durationSeconds);
    }
  }

  const { credits, storyboardMode, modelId } = estimateSceneCredits(scene.duration_seconds, "standard", user.plan);

  if (!storyboardMode && user.credit_balance < credits) {
    scene.status = "failed";
    scene.error_message = `Insufficient credits (${credits} required, ${user.credit_balance} available).`;
    scene.updated_at = new Date().toISOString();
    return { scene };
  }

  // Reserve credits (Hold-then-settle)
  if (!storyboardMode && credits > 0) {
    appendLedger(db, {
      user_id: user.id,
      delta: -credits,
      reason: "generation",
      project_id: scene.project_id,
      description: `Reserved for scene generation`,
    });
  }

  const idempotencyKey = `scene_${scene.id}_${Date.now()}`;
  const referenceImageUrls = db.characters
    .filter((c) => scene.character_ids.includes(c.id))
    .flatMap((c) => c.reference_urls ?? []);

  // Adjacent scene continuity: start from previous scene's preview if sharing location
  const startFrameUrl =
    previousScene && previousScene.location_name === scene.location_name ? previousScene.preview_url ?? undefined : undefined;

  let result = await videoProvider.submitJob({
    prompt: promptToUse,
    durationSeconds: scene.duration_seconds,
    aspectRatio: project?.aspect_ratio ?? "16:9",
    referenceImageUrls,
    startFrameUrl,
    modelId,
    storyboardMode,
    idempotencyKey,
  });

  // Fallback model if first fails with non-moderation error
  if (result.status === "failed" && result.errorClass !== "CONTENT_MODERATION") {
    const fallback = modelRegistry.getFallbackModel(modelId);
    if (fallback) {
      result = await videoProvider.submitJob({
        prompt: promptToUse,
        durationSeconds: scene.duration_seconds,
        aspectRatio: project?.aspect_ratio ?? "16:9",
        referenceImageUrls,
        startFrameUrl,
        modelId: fallback.id,
        storyboardMode,
        idempotencyKey: `${idempotencyKey}_fb`,
      });
    }
  }

  const takeId = crypto.randomUUID();
  const now = new Date().toISOString();
  db.takes.unshift({
    id: takeId,
    scene_id: scene.id,
    provider: storyboardMode ? "storyboard" : "studio_video",
    model_id: modelId,
    input_asset_ids: [],
    provider_job_id: result.providerJobId,
    status: result.status === "complete" ? "complete" : result.status === "blocked" ? "blocked" : "failed",
    output_url: result.outputURL,
    billed_cost: result.billedCost,
    error_class: result.errorClass,
    error_message: result.errorMessage,
    attempt_number: 1,
    created_at: now,
    completed_at: now,
  });

  if (result.status === "complete") {
    scene.status = "complete";
    scene.selected_take_id = takeId;
    scene.preview_url = result.outputURL;
    scene.progress_text = "Complete";
    scene.error_message = null;
  } else {
    // Refund reserved credits automatically on failure or moderation block
    if (!storyboardMode && credits > 0) {
      appendLedger(db, {
        user_id: user.id,
        delta: credits,
        reason: "refund",
        project_id: scene.project_id,
        description: `Auto-refund for ${result.status} scene`,
      });
    }
    scene.status = result.status === "blocked" ? "blocked" : "failed";
    scene.error_message = result.errorMessage || "Generation failed";
  }

  scene.updated_at = now;
  return { scene, takeId };
}

export function generateSubtitlesFromScenes(scenes: Scene[]): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  let cursor = 0;

  for (const scene of scenes) {
    const text = scene.dialogue?.trim() || scene.action?.trim();
    if (text) {
      cues.push({
        id: crypto.randomUUID(),
        start: Number(cursor.toFixed(2)),
        end: Number((cursor + scene.duration_seconds).toFixed(2)),
        text: text.slice(0, 120),
      });
    }
    cursor += scene.duration_seconds;
  }

  return cues;
}

export async function expandScenePrompt(
  db: StudioDatabase,
  scene: Scene
): Promise<string> {
  const project = db.projects.find((p) => p.id === scene.project_id);
  const charNames = db.characters
    .filter((c) => scene.character_ids.includes(c.id))
    .map((c) => c.name);

  return llmProvider.expandPrompt(scene.visual_prompt || scene.action, {
    characterNames: charNames,
    location: scene.location_name ?? undefined,
    style: project?.style_bible?.visualStyle,
  });
}

