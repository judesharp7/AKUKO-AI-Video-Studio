export type ProjectStatus = "draft" | "in_progress" | "completed" | "archived";
export type StudioStep =
  | "setup"
  | "characters"
  | "story"
  | "scenes"
  | "generate"
  | "editor"
  | "export";
export type AspectRatio = "16:9" | "9:16" | "1:1";
export type VideoType = "story" | "tutorial" | "advert" | "documentary";
export type QualityTier = "draft" | "standard" | "premium";

export type SceneStatus =
  | "draft"
  | "ready"
  | "queued"
  | "generating"
  | "complete"
  | "failed"
  | "blocked"
  | "approved";

export type TakeStatus = "pending" | "running" | "complete" | "failed" | "blocked";
export type AssetType = "image" | "video" | "audio" | "subtitle";
export type SubtitlePreset = "clean" | "bold" | "cinematic" | "youtube";
export type ExportResolution = "720p" | "1080p" | "4k";
export type PlanType = "free" | "creator" | "studio";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  plan: PlanType;
  credit_balance: number;
  country?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  user_id: string;
  delta: number;
  reason: "purchase" | "generation" | "refund" | "bonus";
  project_id?: string | null;
  provider_cost?: number | null;
  description?: string;
  created_at: string;
}

export interface StyleBible {
  visualStyle: string;
  colorPalette: string;
  lighting: string;
  era?: string;
  mood?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  type: VideoType;
  aspect_ratio: AspectRatio;
  target_duration_seconds: number;
  style_bible?: StyleBible | null;
  status: ProjectStatus;
  current_step: StudioStep;
  thumbnail_url?: string | null;
  scene_count?: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceSettings {
  voiceId: string;
  voiceName: string;
  accent: "nigerian_english" | "pidgin" | "american" | "british" | "neutral";
  emotion: "neutral" | "warm" | "dramatic" | "energetic" | "calm";
  speed: number; // 0.7 - 1.3
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  appearance: string;
  clothing: string;
  personality: string;
  voice_id?: string | null;
  voice_settings?: VoiceSettings | null;
  reference_asset_ids: string[];
  reference_urls?: string[];
  locked: boolean;
  consistency_thumbs_up: number;
  consistency_total: number;
  created_at: string;
  updated_at: string;
}

export interface StoryCharacterSummary {
  name: string;
  role: string;
  description: string;
}

export interface StoryJSON {
  title: string;
  summary: string;
  characters: StoryCharacterSummary[];
  conflict: string;
  events: string[];
  climax: string;
  ending: string;
}

export interface ScriptRecord {
  id: string;
  project_id: string;
  version: number;
  story_json: StoryJSON | null;
  script_text: string;
  created_at: string;
}

export interface Scene {
  id: string;
  project_id: string;
  position: number;
  duration_seconds: number;
  location_id?: string | null;
  location_name?: string | null;
  character_ids: string[];
  action: string;
  dialogue: string;
  camera: string;
  mood: string;
  visual_prompt: string;
  ai_prompt?: string | null;
  status: SceneStatus;
  selected_take_id?: string | null;
  preview_url?: string | null;
  voice_url?: string | null;
  progress_text?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Take {
  id: string;
  scene_id: string;
  provider: string;
  model_id: string;
  model_version?: string | null;
  parameters?: Record<string, unknown> | null;
  input_asset_ids: string[];
  provider_job_id?: string | null;
  status: TakeStatus;
  output_asset_id?: string | null;
  output_url?: string | null;
  billed_cost?: number | null;
  error_class?: string | null;
  error_message?: string | null;
  attempt_number: number;
  created_at: string;
  completed_at?: string | null;
}

export interface Asset {
  id: string;
  user_id: string;
  type: AssetType;
  storage_key: string;
  public_url?: string | null;
  mimetype?: string | null;
  size_bytes?: number | null;
  duration_seconds?: number | null;
  checksum?: string | null;
  created_at: string;
}

export interface TimelineClip {
  id: string;
  sceneId?: string;
  track: "video" | "voice" | "music" | "sfx";
  label: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  assetUrl?: string;
  transition?: "cut" | "fade" | "dissolve";
  volume?: number;
}

export interface EditDecisionList {
  clips: TimelineClip[];
  musicTrack?: {
    id: string;
    title: string;
    mood: string;
    volume: number;
  } | null;
  aspectRatio: AspectRatio;
  totalDuration: number;
}

export interface TimelineRecord {
  id: string;
  project_id: string;
  version: number;
  edit_decision_list: EditDecisionList;
  created_at: string;
}

export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface SubtitleRecord {
  id: string;
  project_id: string;
  cues: SubtitleCue[];
  style_preset: SubtitlePreset;
  created_at: string;
}

export interface ExportRecord {
  id: string;
  project_id: string;
  timeline_version: number;
  resolution: ExportResolution;
  format: "mp4";
  status: "pending" | "processing" | "complete" | "failed";
  watermarked: boolean;
  output_asset_id?: string | null;
  download_url?: string | null;
  created_at: string;
  completed_at?: string | null;
}

