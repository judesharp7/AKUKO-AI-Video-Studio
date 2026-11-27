import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  Asset,
  Character,
  CreditLedgerEntry,
  ExportRecord,
  Project,
  Scene,
  ScriptRecord,
  SubtitleRecord,
  Take,
  TimelineRecord,
  UserProfile,
} from "@/types/database";

export interface StudioDatabase {
  users: UserProfile[];
  credit_ledger: CreditLedgerEntry[];
  projects: Project[];
  characters: Character[];
  scripts: ScriptRecord[];
  scenes: Scene[];
  takes: Take[];
  assets: Asset[];
  timelines: TimelineRecord[];
  subtitles: SubtitleRecord[];
  exports: ExportRecord[];
  processedWebhooks: string[];
}

const DATA_DIR = path.join(process.cwd(), ".akuko-data");
const DATA_FILE = path.join(DATA_DIR, "studio-db.json");

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

function createInitialData(): StudioDatabase {
  const now = new Date().toISOString();
  const demoProjectId = "10000000-0000-4000-8000-000000000001";
  const char1Id = "20000000-0000-4000-8000-000000000001";
  const char2Id = "20000000-0000-4000-8000-000000000002";

  return {
    users: [
      {
        id: DEMO_USER_ID,
        email: "creator@akuko.ai",
        name: "Studio Creator",
        plan: "creator",
        credit_balance: 250,
        country: "NG",
        email_verified: true,
        created_at: now,
        updated_at: now,
      },
    ],
    credit_ledger: [
      {
        id: crypto.randomUUID(),
        user_id: DEMO_USER_ID,
        delta: 250,
        reason: "bonus",
        description: "Welcome Studio Creator Credits",
        created_at: now,
      },
    ],
    projects: [
      {
        id: demoProjectId,
        user_id: DEMO_USER_ID,
        name: "The Lagos Skyline",
        type: "story",
        aspect_ratio: "16:9",
        target_duration_seconds: 1800,
        style_bible: {
          visualStyle: "Cinematic Afro-futurist drama, warm golden hour",
          colorPalette: "Amber, deep indigo, warm terracotta",
          lighting: "Natural golden sunlight with soft rim light",
          mood: "Inspiring & Suspenseful",
        },
        status: "in_progress",
        current_step: "scenes",
        scene_count: 3,
        created_at: now,
        updated_at: now,
      },
    ],
    characters: [
      {
        id: char1Id,
        user_id: DEMO_USER_ID,
        name: "Amara Okafor",
        age: 26,
        gender: "Female",
        appearance: "Warm brown skin, braided updo, expressive dark eyes, confident posture",
        clothing: "Tailored burnt-orange linen blazer over crisp white tee",
        personality: "Resourceful architect, calm under pressure",
        voice_id: "ng_amara",
        voice_settings: {
          voiceId: "ng_amara",
          voiceName: "Amara (Nigerian English)",
          accent: "nigerian_english",
          emotion: "warm",
          speed: 1.0,
        },
        reference_asset_ids: ["ref-amara-1", "ref-amara-2", "ref-amara-3"],
        reference_urls: [],
        locked: true,
        consistency_thumbs_up: 18,
        consistency_total: 20,
        created_at: now,
        updated_at: now,
      },
      {
        id: char2Id,
        user_id: DEMO_USER_ID,
        name: "Tunde Adeyemi",
        age: 34,
        gender: "Male",
        appearance: "Short fade, neat beard, rectangular glasses, warm smile",
        clothing: "Navy patterned senator shirt with rolled sleeves",
        personality: "Veteran sound engineer and loyal mentor",
        voice_id: "ng_pidgin_tunde",
        voice_settings: {
          voiceId: "ng_pidgin_tunde",
          voiceName: "Tunde (Nigerian Pidgin)",
          accent: "pidgin",
          emotion: "energetic",
          speed: 1.0,
        },
        reference_asset_ids: ["ref-tunde-1", "ref-tunde-2"],
        reference_urls: [],
        locked: true,
        consistency_thumbs_up: 14,
        consistency_total: 16,
        created_at: now,
        updated_at: now,
      },
    ],
    scripts: [
      {
        id: crypto.randomUUID(),
        project_id: demoProjectId,
        version: 1,
        story_json: {
          title: "The Lagos Skyline",
          summary: "An ambitious young architect races against time to unveil a solar-powered community hub before the monsoon hits.",
          characters: [
            { name: "Amara Okafor", role: "Lead Architect", description: "Determined visionary fighting to keep her neighborhood connected." },
            { name: "Tunde Adeyemi", role: "Mentor & Engineer", description: "Seasoned systems builder who knows the city inside out." },
          ],
          conflict: "A sudden grid failure threatens to derail the live launch ceremony.",
          events: [
            "Amara inspects the rooftop solar array at dawn over Third Mainland Bridge.",
            "Tunde discovers a critical inverter fault hours before the opening.",
            "Together they improvise a microgrid bypass while the storm clouds gather.",
          ],
          climax: "As thunder rolls across Victoria Island, the canopy lights ignite across the skyline.",
          ending: "The neighborhood gathers under the glowing roof, celebrating a new era of clean energy.",
        },
        script_text:
          "SCENE 1 - ROOFTOP STUDIO - DAWN\nAMARA looks out over the Lagos lagoon as golden light hits the solar panels.\nAMARA: Today everything changes for this community.\n\nSCENE 2 - CONTROL ROOM - MORNING\nTUNDE checks the inverter telemetry.\nTUNDE: Amara, we have a voltage drop on line three. We need a bypass before noon.\n\nSCENE 3 - COMMUNITY PLAZA - DUSK\nThe crowd watches as AMARA flips the master switch. Warm lights illuminate the plaza.",
        created_at: now,
      },
    ],
    scenes: [
      {
        id: "30000000-0000-4000-8000-000000000001",
        project_id: demoProjectId,
        position: 1000,
        duration_seconds: 10,
        location_name: "Rooftop Studio, Lagos",
        character_ids: [char1Id],
        action: "Amara stands on the sunlit rooftop overlooking the Lagos lagoon, reviewing holographic blueprints.",
        dialogue: "Today everything changes for this community.",
        camera: "Wide establishing pan, golden hour",
        mood: "Inspiring",
        visual_prompt: "Amara on a modern Lagos rooftop overlooking the lagoon at sunrise, warm golden light.",
        ai_prompt:
          "Featuring Amara Okafor. Set in Rooftop Studio, Lagos. Amara stands on the sunlit rooftop overlooking the Lagos lagoon, reviewing blueprints. Style: Cinematic 35mm film, golden hour, shallow depth of field.",
        status: "complete",
        preview_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        created_at: now,
        updated_at: now,
      },
      {
        id: "30000000-0000-4000-8000-000000000002",
        project_id: demoProjectId,
        position: 2000,
        duration_seconds: 10,
        location_name: "Solar Control Room",
        character_ids: [char1Id, char2Id],
        action: "Tunde points to a blinking amber warning on the power console while Amara leans in.",
        dialogue: "Amara, we have a voltage drop on line three. We need a bypass before noon.",
        camera: "Over-the-shoulder medium shot",
        mood: "Suspenseful",
        visual_prompt: "Tunde and Amara inspecting a glowing control panel in a sleek engineering room.",
        ai_prompt:
          "Featuring Amara Okafor and Tunde Adeyemi. Set in Solar Control Room. Urgent diagnostic moment by glowing console. Style: Cinematic 35mm film, dramatic rim lighting.",
        status: "ready",
        created_at: now,
        updated_at: now,
      },
      {
        id: "30000000-0000-4000-8000-000000000003",
        project_id: demoProjectId,
        position: 3000,
        duration_seconds: 12,
        location_name: "Community Plaza, Dusk",
        character_ids: [char1Id, char2Id],
        action: "Amara flips the master switch and the entire solar canopy bursts into warm golden light as neighbors cheer.",
        dialogue: "Welcome to the future we built together!",
        camera: "Slow crane reveal pulling upward",
        mood: "Triumphant",
        visual_prompt: "Crowded community plaza at dusk lighting up under a glowing solar canopy.",
        ai_prompt:
          "Featuring Amara Okafor and Tunde Adeyemi. Set in Community Plaza, Dusk. Joyful celebration as warm canopy lights ignite. Style: Cinematic 35mm film, vibrant warm tones.",
        status: "draft",
        created_at: now,
        updated_at: now,
      },
    ],
    takes: [],
    assets: [],
    timelines: [],
    subtitles: [],
    exports: [],
    processedWebhooks: [],
  };
}

let memoryStore: StudioDatabase | null = null;

export function readDb(): StudioDatabase {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      memoryStore = JSON.parse(raw) as StudioDatabase;
      return memoryStore;
    }
  } catch {
    // Fall back to fresh store if read fails (e.g. read-only serverless fs)
  }

  memoryStore = createInitialData();
  writeDb(memoryStore);
  return memoryStore;
}

export function writeDb(db: StudioDatabase): void {
  memoryStore = db;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch {
    // In read-only serverless environments (like Vercel), keep in-memory store
  }
}

export function getActiveUser(db: StudioDatabase, userId?: string): UserProfile {
  const found = db.users.find((u) => u.id === (userId || DEMO_USER_ID));
  return found ?? db.users[0];
}

export function appendLedger(
  db: StudioDatabase,
  entry: Omit<CreditLedgerEntry, "id" | "created_at">
): CreditLedgerEntry {
  const user = getActiveUser(db, entry.user_id);
  user.credit_balance = Number((user.credit_balance + entry.delta).toFixed(2));
  user.updated_at = new Date().toISOString();

  const full: CreditLedgerEntry = {
    ...entry,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  db.credit_ledger.unshift(full);
  return full;
}

