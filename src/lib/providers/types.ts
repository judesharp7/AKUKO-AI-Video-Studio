import type { AspectRatio, QualityTier, StoryJSON, VoiceSettings } from "@/types/database";

export type ErrorClass =
  | "VALIDATION_ERROR"
  | "RATE_LIMIT"
  | "PROVIDER_UNAVAILABLE"
  | "CONTENT_MODERATION"
  | "TIMEOUT"
  | "UNKNOWN";

export interface ProviderJobResult {
  status: "pending" | "running" | "complete" | "failed" | "blocked";
  outputURL?: string;
  billedCost: number;
  providerJobId: string;
  errorClass?: ErrorClass;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface VideoGenerationInput {
  prompt: string;
  durationSeconds: number;
  aspectRatio: AspectRatio;
  referenceImageUrls?: string[];
  startFrameUrl?: string;
  modelId?: string;
  tier?: QualityTier;
  idempotencyKey: string;
  storyboardMode?: boolean;
}

export interface ImageGenerationInput {
  prompt: string;
  aspectRatio?: AspectRatio;
  referenceImageUrls?: string[];
  count?: number;
  pose?: "headshot" | "full_body" | "turnaround" | "scene_still";
  modelId?: string;
}

export interface VoiceSynthesisInput {
  text: string;
  settings: VoiceSettings;
  idempotencyKey: string;
}

export interface MusicGenerationInput {
  mood: string;
  durationSeconds: number;
  prompt?: string;
}

export interface VideoProvider {
  submitJob(input: VideoGenerationInput): Promise<ProviderJobResult>;
  checkStatus(providerJobId: string): Promise<ProviderJobResult>;
  cancelJob(providerJobId: string): Promise<{ cancelled: boolean }>;
}

export interface ImageProvider {
  generateImage(input: ImageGenerationInput): Promise<ProviderJobResult & { imageUrls: string[] }>;
  generateVariations(
    baseImageUrl: string,
    prompt: string,
    count: number
  ): Promise<ProviderJobResult & { imageUrls: string[] }>;
}

export interface VoiceProvider {
  synthesize(input: VoiceSynthesisInput): Promise<ProviderJobResult & { durationSeconds: number }>;
  cloneVoice(sampleUrl: string, name: string): Promise<{ voiceId: string }>;
  getVoices(): Promise<Array<{ id: string; name: string; accent: string; previewText: string }>>;
}

export interface MusicProvider {
  generateMusic(input: MusicGenerationInput): Promise<ProviderJobResult>;
  searchLibrary(mood: string, query?: string): Promise<Array<{ id: string; title: string; mood: string; durationSeconds: number; url: string }>>;
}

export interface LLMProvider {
  generateStructured<T>(prompt: string, schemaName: string): Promise<T>;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  generateStory(idea: string, videoType: string, targetMinutes: number): Promise<StoryJSON>;
  expandPrompt(simpleText: string, context: { characterNames?: string[]; location?: string; style?: string }): Promise<string>;
}

