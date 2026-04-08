import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

router.post("/ocr-translate", async (req, res) => {
  const { imageBase64, mimeType, targetLang, targetLangName } = req.body as {
    imageBase64?: string;
    mimeType?: string;
    targetLang?: string;
    targetLangName?: string;
  };

  if (!imageBase64) {
    return res.status(400).json({ error: "No image provided" });
  }

  const safeMime = mimeType ?? "image/jpeg";
  const langLabel = targetLangName ?? targetLang ?? "English";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${safeMime};base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: `You are an OCR and translation assistant. Extract ALL visible text from this image exactly as it appears. Then translate the extracted text to ${langLabel}. Return ONLY a valid JSON object (no markdown, no code blocks): {"extractedText": "...", "translatedText": "..."}`,
            },
          ],
        },
      ],
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: { extractedText: string; translatedText: string } = {
      extractedText: "",
      translatedText: "",
    };
    try {
      result = JSON.parse(raw);
    } catch {
      result = { extractedText: raw, translatedText: raw };
    }
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OCR failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
