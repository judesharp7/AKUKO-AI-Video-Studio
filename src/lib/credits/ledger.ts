import type { PlanType, QualityTier } from "@/types/database";
import { modelRegistry } from "@/lib/providers/model-registry";

export const FREE_TIER_MONTHLY_SECONDS = 300; // ~5 minutes/month

export function estimateSceneCredits(
  durationSeconds: number,
  tier: QualityTier = "standard",
  plan: PlanType = "free"
): { credits: number; storyboardMode: boolean; modelId: string } {
  if (plan === "free") {
    return {
      credits: 0,
      storyboardMode: true,
      modelId: "studio-storyboard-v1",
    };
  }
  const model = modelRegistry.getDefaultModel(tier, false);
  const credits = Math.ceil(durationSeconds * model.creditsPerSecond);
  return {
    credits,
    storyboardMode: false,
    modelId: model.id,
  };
}

export function estimateProjectCredits(
  scenes: Array<{ duration_seconds: number }>,
  tier: QualityTier = "standard",
  plan: PlanType = "free"
): { totalCredits: number; totalSeconds: number; storyboardMode: boolean } {
  const totalSeconds = scenes.reduce((acc, s) => acc + (s.duration_seconds || 10), 0);
  if (plan === "free") {
    return { totalCredits: 0, totalSeconds, storyboardMode: true };
  }
  const model = modelRegistry.getDefaultModel(tier, false);
  const totalCredits = scenes.reduce((acc, s) => acc + Math.ceil((s.duration_seconds || 10) * model.creditsPerSecond), 0);
  return { totalCredits, totalSeconds, storyboardMode: false };
}

export function hasSufficientCredits(balance: number, required: number, plan: PlanType): boolean {
  if (plan === "free") return true;
  return balance >= required;
}

