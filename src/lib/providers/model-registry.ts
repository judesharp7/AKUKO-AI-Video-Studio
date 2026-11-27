import type { AspectRatio, QualityTier } from "@/types/database";

export interface VideoModelInfo {
  id: string;
  displayName: string; // User-friendly tier name, never exposing raw vendor internals in UI
  providerKey: string;
  tier: QualityTier;
  maxClipSeconds: number;
  supportedAspectRatios: AspectRatio[];
  maxReferenceImages: number;
  maxReferenceVideos: number;
  audioSupport: boolean;
  pricePerSecond: number; // USD cost
  creditsPerSecond: number; // >= 2x measured cost
  available: boolean;
  fallbackModelId?: string;
  maxConcurrentJobs: number;
}

export interface ImageModelInfo {
  id: string;
  displayName: string;
  providerKey: string;
  tier: QualityTier;
  maxReferenceImages: number;
  pricePerImage: number;
  available: boolean;
  fallbackModelId?: string;
}

export interface VoiceModelInfo {
  id: string;
  displayName: string;
  providerKey: string;
  supportsNigerianEnglish: boolean;
  supportsPidgin: boolean;
  pricePer1kChars: number;
  available: boolean;
}

export interface MusicModelInfo {
  id: string;
  displayName: string;
  providerKey: string;
  maxDurationSeconds: number;
  available: boolean;
}

const VIDEO_MODELS: VideoModelInfo[] = [
  {
    id: "studio-storyboard-v1",
    displayName: "Storyboard Motion (Free Tier)",
    providerKey: "storyboard",
    tier: "draft",
    maxClipSeconds: 30,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    maxReferenceImages: 4,
    maxReferenceVideos: 0,
    audioSupport: false,
    pricePerSecond: 0.005,
    creditsPerSecond: 0,
    available: true,
    maxConcurrentJobs: 10,
  },
  {
    id: "studio-fast-v3",
    displayName: "Studio Draft",
    providerKey: "aggregator_a",
    tier: "draft",
    maxClipSeconds: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    maxReferenceImages: 4,
    maxReferenceVideos: 1,
    audioSupport: true,
    pricePerSecond: 0.04,
    creditsPerSecond: 1,
    available: true,
    fallbackModelId: "studio-standard-v3",
    maxConcurrentJobs: 5,
  },
  {
    id: "studio-standard-v3",
    displayName: "Studio Standard",
    providerKey: "aggregator_a",
    tier: "standard",
    maxClipSeconds: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    maxReferenceImages: 6,
    maxReferenceVideos: 2,
    audioSupport: true,
    pricePerSecond: 0.08,
    creditsPerSecond: 2,
    available: true,
    fallbackModelId: "studio-fast-v3",
    maxConcurrentJobs: 5,
  },
  {
    id: "studio-cinema-v4",
    displayName: "Studio Cinema",
    providerKey: "aggregator_b",
    tier: "premium",
    maxClipSeconds: 12,
    supportedAspectRatios: ["16:9", "9:16"],
    maxReferenceImages: 6,
    maxReferenceVideos: 2,
    audioSupport: true,
    pricePerSecond: 0.18,
    creditsPerSecond: 4,
    available: true,
    fallbackModelId: "studio-standard-v3",
    maxConcurrentJobs: 3,
  },
];

const IMAGE_MODELS: ImageModelInfo[] = [
  {
    id: "studio-portrait-v2",
    displayName: "Character Kit Pro",
    providerKey: "aggregator_a",
    tier: "standard",
    maxReferenceImages: 6,
    pricePerImage: 0.02,
    available: true,
    fallbackModelId: "studio-portrait-fast",
  },
  {
    id: "studio-portrait-fast",
    displayName: "Character Kit Fast",
    providerKey: "aggregator_b",
    tier: "draft",
    maxReferenceImages: 4,
    pricePerImage: 0.01,
    available: true,
  },
];

const VOICE_MODELS: VoiceModelInfo[] = [
  {
    id: "studio-voice-multilingual",
    displayName: "Studio Voice HD (Multilingual & Pidgin)",
    providerKey: "voice_a",
    supportsNigerianEnglish: true,
    supportsPidgin: true,
    pricePer1kChars: 0.3,
    available: true,
  },
  {
    id: "studio-voice-flash",
    displayName: "Studio Voice Flash",
    providerKey: "voice_a",
    supportsNigerianEnglish: true,
    supportsPidgin: true,
    pricePer1kChars: 0.15,
    available: true,
  },
];

const MUSIC_MODELS: MusicModelInfo[] = [
  {
    id: "studio-score-v2",
    displayName: "Studio Score Composer",
    providerKey: "music_a",
    maxDurationSeconds: 180,
    available: true,
  },
];

export class ModelRegistry {
  private videoModels: VideoModelInfo[] = [...VIDEO_MODELS];
  private imageModels: ImageModelInfo[] = [...IMAGE_MODELS];
  private voiceModels: VoiceModelInfo[] = [...VOICE_MODELS];
  private musicModels: MusicModelInfo[] = [...MUSIC_MODELS];

  getVideoModels(): VideoModelInfo[] {
    return this.videoModels.filter((m) => m.available);
  }

  getImageModels(): ImageModelInfo[] {
    return this.imageModels.filter((m) => m.available);
  }

  getVoiceModels(): VoiceModelInfo[] {
    return this.voiceModels.filter((m) => m.available);
  }

  getMusicModels(): MusicModelInfo[] {
    return this.musicModels.filter((m) => m.available);
  }

  getVideoModelById(id: string): VideoModelInfo | undefined {
    return this.videoModels.find((m) => m.id === id);
  }

  getDefaultModel(tier: QualityTier = "standard", storyboardMode = false): VideoModelInfo {
    if (storyboardMode) {
      return this.videoModels[0];
    }
    const found = this.videoModels.find((m) => m.tier === tier && m.available && m.id !== "studio-storyboard-v1");
    if (found) return found;
    return this.videoModels.find((m) => m.available) ?? this.videoModels[0];
  }

  getFallbackModel(modelId: string): VideoModelInfo | undefined {
    const current = this.getVideoModelById(modelId);
    if (!current?.fallbackModelId) return undefined;
    const fallback = this.getVideoModelById(current.fallbackModelId);
    return fallback?.available ? fallback : undefined;
  }

  setModelAvailability(modelId: string, available: boolean): void {
    const model = this.videoModels.find((m) => m.id === modelId);
    if (model) model.available = available;
  }

  validateSceneDuration(durationSeconds: number, modelId?: string): { valid: boolean; maxSeconds: number; message?: string } {
    const model = modelId ? this.getVideoModelById(modelId) : this.getDefaultModel("standard");
    const maxSeconds = model?.maxClipSeconds ?? 15;
    if (durationSeconds < 2) {
      return { valid: false, maxSeconds, message: "Scene duration must be at least 2 seconds." };
    }
    if (durationSeconds > maxSeconds) {
      return {
        valid: false,
        maxSeconds,
        message: `Scene duration (${durationSeconds}s) exceeds the selected model limit of ${maxSeconds}s. Split into shorter scenes or switch to Storyboard Mode.`,
      };
    }
    return { valid: true, maxSeconds };
  }
}

export const modelRegistry = new ModelRegistry();

