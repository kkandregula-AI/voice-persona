import { Router, type IRouter } from "express";
import multer from "multer";
import OpenAI from "openai";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

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

  try {
    const audioFile = new File(
      [file.buffer],
      `recording.${getExt(file.mimetype || "audio/webm")}`,
      { type: file.mimetype || "audio/webm" }
    );

    const result = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
    } as Parameters<typeof openai.audio.transcriptions.create>[0]);

    const raw = result as unknown as { language?: string; text?: string };
    const langCode = raw.language ?? "";
    return res.json({
      text: raw.text ?? (result as unknown as { text: string }).text ?? "",
      languageCode: langCode,
      languageLabel: getLangLabel(langCode),
      languageProbability: 0.85,
      source: "openai",
    });
  } catch (err) {
    console.error("Whisper fallback error:", err);
    return res.status(500).json({ error: "Transcription failed" });
  }
});

export default router;
