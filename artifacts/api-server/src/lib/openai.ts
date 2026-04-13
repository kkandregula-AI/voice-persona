import OpenAI from "openai";

const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
const apiKey =
  process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ??
  process.env["OPENAI_API_KEY"] ??
  "dummy";

export const openai = new OpenAI({ baseURL, apiKey });

export function isAIConfigured(): boolean {
  return !!(
    process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"] ||
    process.env["OPENAI_API_KEY"]
  );
}

export function isReplitProxy(): boolean {
  return !!process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
}

export function transcribeModel(): string {
  return isReplitProxy() ? "gpt-4o-mini-transcribe" : "whisper-1";
}

export function chatModel(): string {
  return "gpt-4o-mini";
}

// ── Groq (free Whisper, 99 languages including Telugu/Tamil/etc.) ─────────────
export function groqClient(): OpenAI | null {
  const key = process.env["GROQ_API_KEY"];
  if (!key) return null;
  return new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: key,
  });
}

export function isGroqConfigured(): boolean {
  return !!process.env["GROQ_API_KEY"];
}
