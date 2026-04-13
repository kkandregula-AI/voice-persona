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
