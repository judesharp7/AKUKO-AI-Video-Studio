export interface ModerationResult {
  allowed: boolean;
  reasonCode?: string;
  userMessage?: string;
}

const BLOCKED_PATTERNS: Array<{ pattern: RegExp; code: string; message: string }> = [
  {
    pattern: /\b(csam|child\s+abuse|minor\s+sexual|underage\s+nude)\b/i,
    code: "SAFETY_MINOR_HARM",
    message: "This prompt violates child safety policies and cannot be generated.",
  },
  {
    pattern: /\b(gore|dismemberment|graphic\s+torture|beheading)\b/i,
    code: "SAFETY_EXTREME_VIOLENCE",
    message: "Graphic violence or gore is not permitted. Please revise your scene description.",
  },
  {
    pattern: /\b(nude|nudity|pornographic|explicit\s+sex|nsfw)\b/i,
    code: "SAFETY_SEXUAL_CONTENT",
    message: "Explicit sexual content is not permitted. Please keep scenes safe for general audiences.",
  },
  {
    pattern: /\b(deepfake|photorealistic\s+celebrity|real\s+person\s+likeness|impersonate\s+(?:president|politician|celebrity))\b/i,
    code: "POLICY_REAL_PERSON_LIKENESS",
    message: "Photorealistic depictions or impersonations of real people are blocked. Use original fictional characters instead.",
  },
  {
    pattern: /\b(bomb\s+making|how\s+to\s+make\s+explosives|terrorist\s+attack)\b/i,
    code: "SAFETY_DANGEROUS_ACTS",
    message: "Instructions or depictions of dangerous illegal acts are not permitted.",
  },
];

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "10minutemail.com",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "fakeinbox.com",
  "sharklasers.com",
  "getnada.com",
]);

export function moderatePrompt(prompt: string): ModerationResult {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return {
      allowed: false,
      reasonCode: "EMPTY_PROMPT",
      userMessage: "Please provide a scene description before generating.",
    };
  }

  for (const rule of BLOCKED_PATTERNS) {
    if (rule.pattern.test(trimmed)) {
      return {
        allowed: false,
        reasonCode: rule.code,
        userMessage: rule.message,
      };
    }
  }

  return { allowed: true };
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return true;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

