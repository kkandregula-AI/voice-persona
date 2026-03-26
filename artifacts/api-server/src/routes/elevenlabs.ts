import { Router, type IRouter } from "express";
import multer from "multer";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

const PRESET_VOICES = {
  female: "21m00Tcm4TlvDq8ikWAM", // Rachel
  male: "pNInz6obpgDQGcFmaJgB",   // Adam
};

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

router.get("/elevenlabs/check-key", async (req, res) => {
  try {
    const apiKey = getApiKey(req as Parameters<typeof getApiKey>[0]);
    if (!apiKey) return res.status(400).json({ valid: false, error: "Missing or invalid API key" });

    const userRes = await fetch(`${ELEVENLABS_BASE}/user`, {
      headers: { "xi-api-key": apiKey },
    });

    if (!userRes.ok) {
      return res.status(200).json({ valid: false, error: "API key is invalid or rejected by ElevenLabs" });
    }

    const user = await userRes.json() as {
      subscription?: {
        tier?: string;
        can_use_instant_voice_cloning?: boolean;
        character_limit?: number;
        character_count?: number;
      };
    };

    const sub = user.subscription ?? {};
    return res.json({
      valid: true,
      plan: sub.tier ?? "unknown",
      canCloneVoice: sub.can_use_instant_voice_cloning ?? false,
      characterLimit: sub.character_limit ?? 0,
      charactersUsed: sub.character_count ?? 0,
    });
  } catch (err) {
    console.error("ElevenLabs check-key error:", err);
    return res.status(500).json({ valid: false, error: "Could not reach ElevenLabs" });
  }
});

router.post(
  "/elevenlabs/generate",
  upload.single("audio"),
  async (req, res) => {
    try {
      const apiKey = getApiKey(req as Parameters<typeof getApiKey>[0]);
      if (!apiKey) {
        return res.status(400).json({ error: "Missing or invalid ElevenLabs API key" });
      }

      const { text, mode, voiceId: existingVoiceId, gender } = req.body as {
        text?: string;
        mode?: string;
        voiceId?: string;
        gender?: string;
      };

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "text is required" });
      }

      let voiceId = existingVoiceId?.trim() || null;
      let usedCloning = false;

      if (!voiceId) {
        const audioFile = req.file;
        if (audioFile) {
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

          if (cloneRes.ok) {
            const cloneData = await cloneRes.json() as { voice_id: string };
            voiceId = cloneData.voice_id;
            usedCloning = true;
          } else {
            let msg = "";
            try {
              const err = await cloneRes.json() as { detail?: { message?: string } | string };
              if (typeof err.detail === "string") msg = err.detail;
              else if (err.detail?.message) msg = err.detail.message;
            } catch {}
            console.error("ElevenLabs clone error:", cloneRes.status, msg);
          }
        }

        if (!voiceId) {
          const preferredGender = (gender === "male") ? "male" : "female";
          voiceId = PRESET_VOICES[preferredGender];
          usedCloning = false;
        }
      } else {
        usedCloning = true;
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
      res.setHeader("x-voice-id", usedCloning ? voiceId : "");
      res.setHeader("x-used-cloning", usedCloning ? "true" : "false");
      res.setHeader("Access-Control-Expose-Headers", "x-voice-id, x-used-cloning");
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
