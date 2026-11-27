import { z } from "zod";

export const StoryCharacterSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
});

export const StoryJSONSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(10),
  characters: z.array(StoryCharacterSchema).min(1),
  conflict: z.string().min(5),
  events: z.array(z.string().min(3)).min(2),
  climax: z.string().min(5),
  ending: z.string().min(5),
});

export const ParsedSceneSchema = z.object({
  duration_seconds: z.number().min(2).max(30).default(10),
  location_name: z.string().min(1).default("Main Location"),
  action: z.string().min(3),
  dialogue: z.string().default(""),
  camera: z.string().default("Medium shot, steady"),
  mood: z.string().default("Cinematic"),
  visual_prompt: z.string().min(5),
});

export const ParsedScriptScenesSchema = z.array(ParsedSceneSchema).min(1);

/**
 * Attempts to parse and repair raw LLM JSON output against a Zod schema.
 */
export function parseAndRepairJSON<T>(raw: string, schema: z.ZodSchema<T>): { success: true; data: T } | { success: false; error: string } {
  const candidates: string[] = [raw.trim()];

  // Strip markdown code fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    candidates.push(fenceMatch[1].trim());
  }

  // Extract first {...} or [...] block
  const objStart = raw.indexOf("{");
  const objEnd = raw.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) {
    candidates.push(raw.slice(objStart, objEnd + 1));
  }
  const arrStart = raw.indexOf("[");
  const arrEnd = raw.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd > arrStart) {
    candidates.push(raw.slice(arrStart, arrEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      // Remove trailing commas before } or ]
      const cleaned = candidate.replace(/,\s*([}\]])/g, "$1");
      const parsed = JSON.parse(cleaned);
      const validated = schema.safeParse(parsed);
      if (validated.success) {
        return { success: true, data: validated.data };
      }
    } catch {
      // Try next candidate
    }
  }

  return {
    success: false,
    error: "Could not parse or repair LLM structured JSON output.",
  };
}

