import { Router, type IRouter } from "express";
import multer from "multer";
import { openai, isAIConfigured, transcribeModel, groqClient, isGroqConfigured } from "../lib/openai";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const LANG_LABELS: Record<string, string> = {
  en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", kn: "Kannada",
  ml: "Malayalam", bn: "Bengali", mr: "Marathi", gu: "Gujarati", pa: "Punjabi",
  ur: "Urdu", or: "Odia", as: "Assamese", ne: "Nepali", si: "Sinhala",
  es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese",
  ja: "Japanese", zh: "Chinese", ko: "Korean", ar: "Arabic", ru: "Russian",
  nl: "Dutch", tr: "Turkish", pl: "Polish", th: "Thai", vi: "Vietnamese",
  id: "Indonesian", ms: "Malay", tl: "Filipino", uk: "Ukrainian",
  he: "Hebrew", fa: "Persian", sw: "Swahili", af: "Afrikaans",
  ka: "Georgian", hy: "Armenian", az: "Azerbaijani", kk: "Kazakh",
  uz: "Uzbek", sq: "Albanian", el: "Greek", cs: "Czech", ro: "Romanian",
  hu: "Hungarian", sk: "Slovak", bg: "Bulgarian", hr: "Croatian", sr: "Serbian",
  sv: "Swedish", da: "Danish", fi: "Finnish", no: "Norwegian", ca: "Catalan",
};

function getLangLabel(code: string): string {
  return LANG_LABELS[code?.toLowerCase().split("-")[0] ?? ""] ?? code ?? "Unknown";
}

function getExt(mime: string): string {
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

router.post("/live-captions/transcribe", upload.single("audio"), async (req, res) => {
  const file = req.file;
  if (!file || !file.buffer.length) {
    return res.status(400).json({ error: "No audio provided" });
  }

  const rawKey = req.headers["x-elevenlabs-key"];
  const elKey = typeof rawKey === "string" ? rawKey.trim() : "";

  if (elKey.length > 10) {
    try {
      const form = new FormData();
      const blob = new Blob([file.buffer], { type: file.mimetype || "audio/webm" });
      form.append("file", blob, `audio.${getExt(file.mimetype)}`);
      form.append("model_id", "scribe_v1");

      const elRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": elKey },
        body: form,
      });

      if (!elRes.ok) {
        const errText = await elRes.text().catch(() => "");
        console.error("ElevenLabs STT error:", elRes.status, errText);
        let userMsg = `ElevenLabs error (${elRes.status})`;
        if (elRes.status === 401) userMsg = "Invalid ElevenLabs API key";
        else if (elRes.status === 422) userMsg = "Audio format not supported";
        return res.status(502).json({ error: userMsg });
      }

      const data = await elRes.json() as {
        text?: string;
        language_code?: string;
        language_probability?: number;
      };

      const langCode = data.language_code ?? "";
      return res.json({
        text: data.text ?? "",
        languageCode: langCode,
        languageLabel: getLangLabel(langCode),
        languageProbability: data.language_probability ?? 0,
        source: "elevenlabs",
      });
    } catch (err) {
      console.error("ElevenLabs STT error:", err);
      return res.status(502).json({ error: "Could not reach ElevenLabs" });
    }
  }

  // ── Groq → OpenAI fallback chain ─────────────────────────────────────────
  const groq = groqClient();
  if (!groq && !isAIConfigured()) {
    return res.status(503).json({
      error: "No transcription provider configured. Add GROQ_API_KEY (free at groq.com) or OPENAI_API_KEY to your server environment variables. Groq supports Telugu, Tamil, and all other languages.",
    });
  }

  // Language hint from client (ISO 639-1, e.g. "te", "hi", "en")
  const langHint = (
    (req.body as Record<string, unknown>)?.["lang"] ??
    req.query["lang"]
  ) as string | undefined;
  const hintCode = typeof langHint === "string" ? langHint.split("-")[0] : undefined;

  const client = groq ?? openai;
  const model  = groq ? "whisper-large-v3-turbo" : transcribeModel();
  const source = groq ? "groq" : "openai";

  try {
    const audioFile = new File(
      [file.buffer],
      `recording.${getExt(file.mimetype || "audio/webm")}`,
      { type: file.mimetype || "audio/webm" }
    );

    const transcribeParams: Parameters<typeof client.audio.transcriptions.create>[0] = {
      file: audioFile,
      model,
      response_format: "json",
      ...(hintCode ? { language: hintCode } : {}),
    };

    const transcribeResult = await client.audio.transcriptions.create(transcribeParams);
    const transcribedText = (transcribeResult as unknown as { text: string }).text?.trim();

    if (!transcribedText) {
      return res.json({ text: "", languageCode: hintCode ?? "", languageLabel: getLangLabel(hintCode ?? ""), languageProbability: 0, source });
    }

    // Use hint code as detected lang (Whisper already respects the language param)
    const langCode = hintCode ?? "";
    const langLabel = getLangLabel(langCode);

    return res.json({
      text: transcribedText,
      languageCode: langCode,
      languageLabel: langLabel,
      languageProbability: 0.95,
      source,
    });
  } catch (err) {
    console.error("Transcription error:", err);
    return res.status(500).json({ error: "Transcription failed" });
  }
});

export default router;
