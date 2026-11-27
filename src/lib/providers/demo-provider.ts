import type { StoryJSON } from "@/types/database";
import type {
  ImageGenerationInput,
  ImageProvider,
  LLMProvider,
  MusicGenerationInput,
  MusicProvider,
  ProviderJobResult,
  VideoGenerationInput,
  VideoProvider,
  VoiceProvider,
  VoiceSynthesisInput,
} from "./types";
import { moderatePrompt } from "./moderation";
import { parseAndRepairJSON, StoryJSONSchema } from "./schemas";

function svgDataUri(title: string, subtitle: string, bgStart: string, bgEnd: string): string {
  const safeTitle = title.replace(/[<>&"']/g, "");
  const safeSub = subtitle.replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#g)"/>
    <circle cx="520" cy="80" r="90" fill="rgba(255,255,255,0.06)"/>
    <circle cx="120" cy="280" r="110" fill="rgba(124,92,255,0.12)"/>
    <text x="32" y="168" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="24" font-weight="700">${safeTitle}</text>
    <text x="32" y="202" fill="#A1A1AA" font-family="system-ui,sans-serif" font-size="15">${safeSub}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Public sample MP4 clips (royalty-free W3C / Google sample streams) for realistic playable previews in Demo Mode
const SAMPLE_VIDEO_URLS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4",
];

export class StudioVideoProvider implements VideoProvider {
  async submitJob(input: VideoGenerationInput): Promise<ProviderJobResult> {
    const mod = moderatePrompt(input.prompt);
    if (!mod.allowed) {
      return {
        status: "blocked",
        billedCost: 0,
        providerJobId: `blk_${Date.now()}`,
        errorClass: "CONTENT_MODERATION",
        errorMessage: mod.userMessage,
      };
    }

    const jobId = `vid_${input.idempotencyKey.slice(0, 12)}_${Date.now()}`;
    const sampleIdx = Math.abs(input.prompt.length) % SAMPLE_VIDEO_URLS.length;

    return {
      status: "complete",
      outputURL: SAMPLE_VIDEO_URLS[sampleIdx],
      billedCost: input.storyboardMode ? 0.01 : Number((input.durationSeconds * 0.08).toFixed(4)),
      providerJobId: jobId,
      metadata: {
        storyboardMode: Boolean(input.storyboardMode),
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
      },
    };
  }

  async checkStatus(providerJobId: string): Promise<ProviderJobResult> {
    return {
      status: "complete",
      outputURL: SAMPLE_VIDEO_URLS[0],
      billedCost: 0.8,
      providerJobId,
    };
  }

  async cancelJob(_providerJobId: string): Promise<{ cancelled: boolean }> {
    return { cancelled: true };
  }
}

export class StudioImageProvider implements ImageProvider {
  async generateImage(input: ImageGenerationInput): Promise<ProviderJobResult & { imageUrls: string[] }> {
    const count = Math.min(Math.max(input.count ?? 4, 2), 6);
    const poses = ["Headshot Portrait", "Full Body View", "3/4 Turnaround", "Side Profile", "Action Pose", "Close-Up Expression"];
    const palettes: Array<[string, string]> = [
      ["#1E1B4B", "#312E81"],
      ["#1E293B", "#0F172A"],
      ["#31102F", "#1E1B4B"],
      ["#0F292E", "#15151C"],
      ["#2A1B3D", "#15151C"],
      ["#1A233A", "#0B0B10"],
    ];

    const shortPrompt = input.prompt.slice(0, 44) + (input.prompt.length > 44 ? "..." : "");
    const imageUrls = Array.from({ length: count }, (_, idx) => {
      const [c1, c2] = palettes[idx % palettes.length];
      return svgDataUri(poses[idx % poses.length], shortPrompt, c1, c2);
    });

    return {
      status: "complete",
      outputURL: imageUrls[0],
      imageUrls,
      billedCost: Number((count * 0.02).toFixed(4)),
      providerJobId: `img_${Date.now()}`,
    };
  }

  async generateVariations(baseImageUrl: string, prompt: string, count: number): Promise<ProviderJobResult & { imageUrls: string[] }> {
    return this.generateImage({ prompt, count });
  }
}

export class StudioVoiceProvider implements VoiceProvider {
  async synthesize(input: VoiceSynthesisInput): Promise<ProviderJobResult & { durationSeconds: number }> {
    const words = Math.max(1, input.text.trim().split(/\s+/).length);
    const speed = input.settings.speed || 1;
    const durationSeconds = Number(Math.max(2, (words / 2.6) / speed).toFixed(2));

    return {
      status: "complete",
      outputURL: `data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=`,
      billedCost: Number(((input.text.length / 1000) * 0.3).toFixed(4)),
      providerJobId: `vox_${Date.now()}`,
      durationSeconds,
    };
  }

  async cloneVoice(_sampleUrl: string, name: string): Promise<{ voiceId: string }> {
    return { voiceId: `cloned_${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}` };
  }

  async getVoices() {
    return [
      { id: "ng_amara", name: "Amara (Nigerian English)", accent: "nigerian_english", previewText: "Welcome to Lagos, where every street has a story." },
      { id: "ng_chidi", name: "Chidi (Nigerian English)", accent: "nigerian_english", previewText: "We have three minutes before the rain starts." },
      { id: "ng_pidgin_tunde", name: "Tunde (Nigerian Pidgin)", accent: "pidgin", previewText: "No worry, we go sort everything sharp sharp!" },
      { id: "us_elena", name: "Elena (Warm Narrator)", accent: "american", previewText: "In the heart of the city, a quiet discovery changed everything." },
      { id: "uk_oliver", name: "Oliver (Documentary)", accent: "british", previewText: "For centuries, this archive remained untouched." },
    ];
  }
}

export class StudioMusicProvider implements MusicProvider {
  async generateMusic(input: MusicGenerationInput): Promise<ProviderJobResult> {
    return {
      status: "complete",
      outputURL: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4`,
      billedCost: 0.05,
      providerJobId: `mus_${Date.now()}`,
      metadata: { mood: input.mood, durationSeconds: input.durationSeconds },
    };
  }

  async searchLibrary(mood: string, query?: string) {
    const tracks = [
      { id: "trk_afrobeat_cinematic", title: "Lagos Horizon (Afro-Cinematic)", mood: "african", durationSeconds: 180, url: "" },
      { id: "trk_epic_rise", title: "Rising Dawn (Orchestral)", mood: "cinematic", durationSeconds: 210, url: "" },
      { id: "trk_emotional_piano", title: "Quiet Reflections", mood: "emotional", durationSeconds: 165, url: "" },
      { id: "trk_suspense_pulse", title: "Midnight Tension", mood: "suspense", durationSeconds: 150, url: "" },
      { id: "trk_doc_ambient", title: "Deep Focus Pulse", mood: "documentary", durationSeconds: 240, url: "" },
      { id: "trk_action_drums", title: "Velocity Chase", mood: "action", durationSeconds: 135, url: "" },
    ];
    return tracks.filter(
      (t) =>
        (!mood || mood === "all" || t.mood.toLowerCase() === mood.toLowerCase()) &&
        (!query || t.title.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

export class StudioLLMProvider implements LLMProvider {
  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-latest",
            max_tokens: 2048,
            system: systemPrompt ?? "You are AKUKO AI Video Studio's narrative architect.",
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { content?: Array<{ text?: string }> };
          const text = data.content?.[0]?.text;
          if (text) return text;
        }
      } catch {
        // Fallback to built-in studio generator
      }
    }
    return `Expanded cinematic direction: ${prompt}. Shot with rich natural lighting, expressive character framing, and smooth camera movement.`;
  }

  async generateStructured<T>(prompt: string, _schemaName: string): Promise<T> {
    const raw = await this.generateText(prompt, "Return strictly valid JSON only.");
    const parsed = parseAndRepairJSON(raw, StoryJSONSchema);
    if (parsed.success) {
      return parsed.data as unknown as T;
    }
    throw new Error(parsed.error);
  }

  async generateStory(idea: string, videoType: string, targetMinutes: number): Promise<StoryJSON> {
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const prompt = `Create a structured ${videoType} video story for a ${targetMinutes}-minute production based on this idea: "${idea}". Return JSON with keys: title, summary, characters ([{name, role, description}]), conflict, events (array of 5-8 plot beats), climax, ending.`;
        const raw = await this.generateText(prompt, "Output strictly valid JSON matching the requested schema.");
        const parsed = parseAndRepairJSON(raw, StoryJSONSchema);
        if (parsed.success) return parsed.data;
      } catch {
        // Fallback to deterministic structured story
      }
    }

    const cleanIdea = idea.trim() || "A young creator builds an unforgettable legacy";
    const shortTitle = cleanIdea.split(/\s+/).slice(0, 6).join(" ");
    return {
      title: shortTitle.charAt(0).toUpperCase() + shortTitle.slice(1),
      summary: `A ${targetMinutes}-minute ${videoType} exploring: ${cleanIdea}. Told through vivid scenes, consistent characters, and rhythmic pacing.`,
      characters: [
        {
          name: "Amara Okafor",
          role: "Protagonist",
          description: "Determined, resourceful lead with a sharp eye for detail and unwavering resolve.",
        },
        {
          name: "Tunde Adeyemi",
          role: "Ally & Mentor",
          description: "Seasoned strategist who challenges Amara to think bigger when obstacles arise.",
        },
      ],
      conflict: "Time and resources are running out while unexpected setbacks threaten the mission's success.",
      events: [
        "Opening hook establishes the stakes and introduces Amara in her everyday world.",
        "Inciting incident sparks the core journey and forces a bold decision.",
        "First major obstacle tests the partnership between Amara and Tunde.",
        "Midpoint revelation shifts their strategy and raises emotional stakes.",
        "Final preparation montage builds momentum toward the decisive moment.",
      ],
      climax: "Against overwhelming odds, Amara executes the breakthrough plan in a high-tension sequence.",
      ending: "A triumphant resolution that rewards persistence and opens a hopeful new chapter.",
    };
  }

  async expandPrompt(
    simpleText: string,
    context: { characterNames?: string[]; location?: string; style?: string }
  ): Promise<string> {
    const chars = context.characterNames?.length ? `Featuring ${context.characterNames.join(" and ")}. ` : "";
    const loc = context.location ? `Set in ${context.location}. ` : "";
    const style = context.style ? `Style: ${context.style}. ` : "Style: Cinematic 35mm film, natural golden-hour lighting, shallow depth of field. ";
    return `${chars}${loc}${simpleText.trim()}. ${style}Smooth tracking camera, expressive facial detail, coherent motion.`;
  }
}

