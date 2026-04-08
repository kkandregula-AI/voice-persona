import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

const LANG_LABELS: Record<string, string> = {
  en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", kn: "Kannada",
  ml: "Malayalam", bn: "Bengali", mr: "Marathi", gu: "Gujarati", pa: "Punjabi",
  ur: "Urdu", es: "Spanish", fr: "French", de: "German", it: "Italian",
  pt: "Portuguese", ja: "Japanese", zh: "Chinese", ko: "Korean", ar: "Arabic",
  ru: "Russian", nl: "Dutch", tr: "Turkish", pl: "Polish", th: "Thai",
  vi: "Vietnamese", id: "Indonesian", ms: "Malay", tl: "Filipino",
};

function getLangLabel(code: string): string {
  return LANG_LABELS[code?.toLowerCase().split("-")[0] ?? ""] ?? code;
}

router.post("/translate", async (req, res) => {
  const { text, toLang } = req.body as { text?: string; toLang?: string };

  if (!text?.trim()) return res.status(400).json({ error: "No text provided" });
  if (!toLang) return res.status(400).json({ error: "No target language" });

  const targetLabel = getLangLabel(toLang);

  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the user's message to ${targetLabel}. Return ONLY the translation — no explanations, no quotes, no extra text.`,
        },
        { role: "user", content: text.trim() },
      ],
      max_tokens: 500,
    });

    const translated = result.choices[0]?.message?.content?.trim() ?? "";
    res.json({ translated, toLang });
  } catch (err) {
    console.error("Translate error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

export default router;
