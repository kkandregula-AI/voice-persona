import { Router, type IRouter } from "express";

const router: IRouter = Router();

const OPENROUTER_BASE_URL = process.env["AI_INTEGRATIONS_OPENROUTER_BASE_URL"];
const OPENROUTER_API_KEY = process.env["AI_INTEGRATIONS_OPENROUTER_API_KEY"];
const MODEL = "qwen/qwen3-4b:free";

const MODE_PROMPTS: Record<string, string> = {
  normal: `Rewrite the following text in a warm, conversational, natural tone — like a real person speaking casually and clearly. Keep it roughly the same length. Only output the rewritten text, nothing else.`,
  news: `Rewrite the following text in the style of a professional TV news anchor — authoritative, clear, measured, and objective. Keep it roughly the same length. Only output the rewritten text, nothing else.`,
  story: `Rewrite the following text in a vivid, expressive storytelling style — with rhythm, emotion, and dramatic flair, as if narrating a compelling story. Keep it roughly the same length. Only output the rewritten text, nothing else.`,
};

router.post("/ai/enhance-text", async (req, res) => {
  try {
    const { text, mode } = req.body as { text?: string; mode?: string };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "text is required" });
    }

    const systemPrompt = MODE_PROMPTS[mode ?? "normal"] ?? MODE_PROMPTS["normal"]!;

    if (!OPENROUTER_BASE_URL || !OPENROUTER_API_KEY) {
      return res.status(503).json({ error: "AI service not configured" });
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text.trim() },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      return res.status(502).json({ error: "AI service error" });
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const enhanced = data?.choices?.[0]?.message?.content?.trim();
    if (!enhanced) {
      return res.status(502).json({ error: "Empty response from AI" });
    }

    return res.json({ enhancedText: enhanced });
  } catch (err) {
    console.error("enhance-text error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
