import { Router, type IRouter } from "express";
import multer from "multer";
import { openai, isAIConfigured } from "../lib/openai";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.post("/ai/transcribe", upload.single("audio"), async (req, res) => {
  if (!isAIConfigured()) {
    res.status(503).json({ error: "AI transcription is not configured. Add an OPENAI_API_KEY environment variable." });
    return;
  }

  try {
    const file = req.file;
    if (!file || !file.buffer.length) {
      res.status(400).json({ error: "No audio file provided" });
      return;
    }

    const langParam = (req.body as Record<string, string>)["language"] ?? "";
    const langCode = langParam.split("-")[0] ?? "";

    const audioFile = new File([file.buffer], `recording.${getExt(file.mimetype)}`, {
      type: file.mimetype,
    });

    const result = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
      ...(langCode ? { language: langCode } : {}),
    });

    res.json({ text: result.text ?? "" });
  } catch (err) {
    console.error("Transcription error:", err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

function getExt(mime: string): string {
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

export default router;
