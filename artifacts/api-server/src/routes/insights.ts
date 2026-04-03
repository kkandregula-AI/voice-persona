import { Router, type IRouter } from "express";

const router: IRouter = Router();

const OPENAI_BASE = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
const OPENAI_KEY = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

type Msg = {
  speaker: string;
  original: string;
  translated: string;
  timestamp: number;
  direction: string;
};

router.post("/ai/insights", async (req, res) => {
  const { messages, srcLang, tgtLang } = req.body as {
    messages: Msg[];
    srcLang: string;
    tgtLang: string;
  };

  if (!messages?.length) {
    return res.status(400).json({ error: "No messages provided" });
  }

  if (!OPENAI_BASE || !OPENAI_KEY) {
    return res.status(500).json({ error: "OpenAI integration not configured" });
  }

  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  const transcript = sorted
    .map((m) => {
      const who = m.speaker === "you" ? "Person A" : m.speaker === "them" ? "Person B" : "System";
      return `${who}: "${m.original}" → "${m.translated}"`;
    })
    .join("\n");

  const totalExchanges = Math.ceil(sorted.length / 2);

  const prompt = `You are a travel conversation analyst. Analyze this ${srcLang} ↔ ${tgtLang} conversation transcript and return a JSON object only (no markdown, no extra text).

Transcript:
${transcript}

Return exactly this JSON structure:
{
  "summary": "1-2 sentence plain English summary of what this conversation was about",
  "keyPhrases": ["phrase1", "phrase2", "phrase3"],
  "topic": "single topic label like: Travel Directions, Restaurant, Shopping, Hotel, Transport, Medical, Emergency, Sightseeing, Small Talk"
}

Rules:
- summary must be under 120 characters
- keyPhrases should be 3-5 of the most useful translated phrases from the conversation (pick from the translated text)
- topic must be one short label
- Output ONLY valid JSON, nothing else`;

  try {
    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `OpenAI error: ${err}` });
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    let parsed: { summary: string; keyPhrases: string[]; topic: string };

    try {
      const jsonStr = raw.startsWith("{") ? raw : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      parsed = JSON.parse(jsonStr);
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    return res.json({
      summary: parsed.summary ?? "No summary available.",
      keyPhrases: Array.isArray(parsed.keyPhrases) ? parsed.keyPhrases.slice(0, 5) : [],
      topic: parsed.topic ?? "Travel",
      totalExchanges,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
});

export default router;
