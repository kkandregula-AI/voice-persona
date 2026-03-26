import { Router, type IRouter } from "express";
import multer from "multer";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

function getApiKey(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const key = req.headers["x-elevenlabs-key"];
  if (!key || typeof key !== "string" || key.trim().length < 10) return null;
  return key.trim();
}

function getModeVoiceSettings(mode: string) {
  switch (mode) {
    case "news":
      return { stability: 0.85, similarity_boost: 0.75, style: 0.1, use_speaker_boost: true };
    case "story":
      return { stability: 0.45, similarity_boost: 0.80, style: 0.75, use_speaker_boost: true };
    default:
      return { stability: 0.65, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true };
  }
}

router.post(
  "/elevenlabs/generate",
  upload.single("audio"),
  async (req, res) => {
    try {
      const apiKey = getApiKey(req as Parameters<typeof getApiKey>[0]);
      if (!apiKey) {
        return res.status(400).json({ error: "Missing or invalid ElevenLabs API key" });
      }

      const { text, mode, voiceId: existingVoiceId } = req.body as {
        text?: string;
        mode?: string;
        voiceId?: string;
      };

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "text is required" });
      }

      let voiceId = existingVoiceId?.trim() || null;

      if (!voiceId) {
        const audioFile = req.file;
        if (!audioFile) {
          return res.status(400).json({ error: "audio file is required for voice cloning" });
        }

        const cloneForm = new FormData();
        const blob = new Blob([audioFile.buffer], { type: audioFile.mimetype || "audio/webm" });
        cloneForm.append("name", `VoicePersona_${Date.now()}`);
        cloneForm.append("files", blob, audioFile.originalname || "voice_sample");
        cloneForm.append("description", "Voice Persona AI clone");

        const cloneRes = await fetch(`${ELEVENLABS_BASE}/voices/add`, {
          method: "POST",
          headers: { "xi-api-key": apiKey },
          body: cloneForm,
        });

        if (!cloneRes.ok) {
          let msg = "Voice cloning failed";
          try {
            const err = await cloneRes.json() as { detail?: { message?: string } | string };
            if (typeof err.detail === "string") msg = err.detail;
            else if (err.detail?.message) msg = err.detail.message;
          } catch {}
          console.error("ElevenLabs clone error:", cloneRes.status, msg);
          return res.status(502).json({ error: msg });
        }

        const cloneData = await cloneRes.json() as { voice_id: string };
        voiceId = cloneData.voice_id;
      }

      const voiceSettings = getModeVoiceSettings(mode ?? "normal");
      const ttsRes = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
          voice_settings: voiceSettings,
        }),
      });

      if (!ttsRes.ok) {
        let msg = "TTS generation failed";
        try {
          const err = await ttsRes.json() as { detail?: { message?: string } | string };
          if (typeof err.detail === "string") msg = err.detail;
          else if (err.detail?.message) msg = err.detail.message;
        } catch {}
        console.error("ElevenLabs TTS error:", ttsRes.status, msg);
        return res.status(502).json({ error: msg });
      }

      const audioBuffer = await ttsRes.arrayBuffer();

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("x-voice-id", voiceId);
      res.setHeader("Access-Control-Expose-Headers", "x-voice-id");
      res.send(Buffer.from(audioBuffer));
    } catch (err) {
      console.error("ElevenLabs generate error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.delete("/elevenlabs/voices/:voiceId", async (req, res) => {
  try {
    const apiKey = getApiKey(req as Parameters<typeof getApiKey>[0]);
    if (!apiKey) return res.status(400).json({ error: "Missing API key" });

    const { voiceId } = req.params as { voiceId: string };
    await fetch(`${ELEVENLABS_BASE}/voices/${voiceId}`, {
      method: "DELETE",
      headers: { "xi-api-key": apiKey },
    });
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: true });
  }
});

export default router;
