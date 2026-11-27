import {
  StudioImageProvider,
  StudioLLMProvider,
  StudioMusicProvider,
  StudioVideoProvider,
  StudioVoiceProvider,
} from "./demo-provider";
import type { ImageProvider, LLMProvider, MusicProvider, VideoProvider, VoiceProvider } from "./types";

export const videoProvider: VideoProvider = new StudioVideoProvider();
export const imageProvider: ImageProvider = new StudioImageProvider();
export const voiceProvider: VoiceProvider = new StudioVoiceProvider();
export const musicProvider: MusicProvider = new StudioMusicProvider();
export const llmProvider: LLMProvider = new StudioLLMProvider();

export * from "./types";
export * from "./model-registry";
export * from "./moderation";
export * from "./schemas";

