import { Router, type IRouter } from "express";

const router: IRouter = Router();

const OPENROUTER_BASE_URL = process.env["AI_INTEGRATIONS_OPENROUTER_BASE_URL"];
const OPENROUTER_API_KEY = process.env["AI_INTEGRATIONS_OPENROUTER_API_KEY"];

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen3-4b:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

const MODE_PROMPTS: Record<string, string> = {
  normal: `Rewrite the following text in a warm, conversational, natural tone — like a real person speaking casually and clearly. Keep it roughly the same length. Only output the rewritten text, nothing else.`,
  news: `Rewrite the following text in the style of a professional TV news anchor — authoritative, clear, measured, and objective. Keep it roughly the same length. Only output the rewritten text, nothing else.`,
  story: `Rewrite the following text in a vivid, expressive storytelling style — with rhythm, emotion, and dramatic flair, as if narrating a compelling story. Keep it roughly the same length. Only output the rewritten text, nothing else.`,
};

const EMOTION_SUFFIX: Record<string, string> = {
  calm:      "Use a calm, measured, peaceful tone.",
  energetic: "Use a high-energy, punchy, exciting tone — like a hype reel.",
  serious:   "Use a serious, focused, authoritative tone.",
  happy:     "Use a warm, upbeat, joyful, optimistic tone.",
};

const REEL_STYLE_CONTEXT: Record<string, string> = {
  normal:    "conversational and relatable",
  news:      "authoritative and news-anchor style",
  story:     "vivid storytelling style with dramatic pauses and emotion",
};

type ReelMode = "normal" | "news" | "story";
type ReelEmotion = "calm" | "energetic" | "serious" | "happy";

const REEL_TEMPLATES: Record<ReelMode, Record<ReelEmotion, (t: string) => string>> = {
  normal: {
    calm:      (t) => `Here's something worth slowing down for: ${t}.\nMost people rush past what actually matters.\nTake a breath and consider what this really means for you.\nSmall shifts in thinking create lasting change.\nYou don't need more information — you need more intention.\nStart today, at your own pace.`,
    energetic: (t) => `This is about ${t} — and it's going to change everything!\nI used to think I had it figured out. I was wrong.\nOnce you understand this, there's no going back.\nThis is the shift that separates the top 1% from everyone else.\nYour future self is watching your decisions right now.\nAre you ready? Let's go!`,
    serious:   (t) => `Let's talk about ${t}. No fluff, no filler.\nThe numbers don't lie — most people are getting this wrong.\nEvery day you ignore this, you fall further behind.\nThis isn't motivation — it's a fact of how success works.\nThe people winning right now all know this.\nNow you do too. What will you do with it?`,
    happy:     (t) => `Good news — ${t} is actually easier than you think!\nI spent years overcomplicating this. You don't have to.\nHere's the beautiful truth that changed my life.\nWhen you see this clearly, everything else falls into place.\nThe best part? You can start right now, exactly as you are.\nThis is your moment. Embrace it!`,
  },
  news: {
    calm:      (t) => `Tonight's focus: a closer look at ${t}.\nExperts say the implications run deeper than most realize.\nData from recent studies reveals a pattern worth noting.\nThe shift has been gradual, but its effects are now undeniable.\nLeaders in the field are calling for a new approach.\nHere's what this means for you and your community.`,
    energetic: (t) => `Breaking tonight: the story of ${t} has taken a dramatic turn.\nSources close to the situation confirm what many suspected.\nThis development is sending shockwaves through the industry.\nOfficials are responding with urgency as pressure mounts.\nExperts warn the window for action is narrow.\nStay with us as this critical story continues to unfold.`,
    serious:   (t) => `A developing situation tonight involving ${t}.\nAuthorities are urging the public to take this seriously.\nThe evidence is now clear: significant change is required.\nThose who have ignored the warnings face serious consequences.\nRegulators are preparing to act — and quickly.\nThis is not a drill. The time for awareness is now.`,
    happy:     (t) => `A positive development tonight in the story of ${t}.\nCommunities across the region are reporting encouraging results.\nExperts call this a breakthrough moment years in the making.\nThe response from the public has been overwhelmingly positive.\nLeaders are calling it a model worth replicating nationwide.\nFor once, the news tonight gives us genuine reason to smile.`,
  },
  story: {
    calm:      (t) => `Once, a simple truth changed everything — the truth about ${t}.\nNo one had spoken it plainly before. The world was waiting.\nSlowly, like sunrise, understanding arrived.\nAnd in that quiet moment, nothing would ever be the same.\nThe change didn't come like thunder — it came like morning.\nAnd those who listened found exactly what they were looking for.`,
    energetic: (t) => `They said it couldn't be done. They were talking about ${t}.\nBut then someone dared to try — and the world held its breath.\nHeart pounding. Hands shaking. Everything on the line.\nWith one decision, the impossible became inevitable.\nThe crowd erupted. The moment became legend.\nThis is that story — and it's only just begun.`,
    serious:   (t) => `There are things we don't talk about enough. ${t} is one of them.\nI learned this the hard way — through silence and consequence.\nThe road was long, and the lesson cost more than expected.\nBut somewhere in the struggle, something crystallized.\nTruth doesn't always arrive gently. Sometimes it arrives like a storm.\nAnd those who survive it come out different — better — forever changed.`,
    happy:     (t) => `This is a story about ${t} — and it has a wonderful ending.\nIt started small, the way all great things do.\nThere were doubters, detours, and days that tested everything.\nBut joy has a way of finding those who keep going.\nAnd when the moment finally came, it was everything they'd hoped.\nSome stories are worth telling. This is one of them.`,
  },
};

function generateTemplateScript(topic: string, mode: string, emotion: string): string {
  const m = (mode as ReelMode) in REEL_TEMPLATES ? (mode as ReelMode) : "normal";
  const e = (emotion as ReelEmotion) in REEL_TEMPLATES[m] ? (emotion as ReelEmotion) : "calm";
  return REEL_TEMPLATES[m][e](topic);
}

async function callOpenRouter(systemPrompt: string, userContent: string): Promise<string> {
  if (!OPENROUTER_BASE_URL || !OPENROUTER_API_KEY) {
    throw new Error("AI service not configured");
  }
  let lastError = "AI service error";
  for (const model of FREE_MODELS) {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      console.error(`OpenRouter error (${model}):`, err);
      lastError = `Model ${model} failed`;
      continue;
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const result = data?.choices?.[0]?.message?.content?.trim();
    if (result) return result;
    lastError = "Empty response from AI";
  }
  throw new Error(lastError);
}

router.post("/ai/enhance-text", async (req, res) => {
  try {
    const { text, mode, emotion } = req.body as { text?: string; mode?: string; emotion?: string };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "text is required" });
    }

    const basePrompt = MODE_PROMPTS[mode ?? "normal"] ?? MODE_PROMPTS["normal"]!;
    const emotionSuffix = EMOTION_SUFFIX[emotion ?? ""] ?? "";
    const systemPrompt = emotionSuffix ? `${basePrompt} ${emotionSuffix}` : basePrompt;

    const enhanced = await callOpenRouter(systemPrompt, text.trim());
    return res.json({ enhancedText: enhanced });
  } catch (err) {
    console.error("enhance-text error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(502).json({ error: msg });
  }
});

router.post("/ai/generate-reel", async (req, res) => {
  try {
    const { topic, mode, emotion } = req.body as { topic?: string; mode?: string; emotion?: string };

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return res.status(400).json({ error: "topic is required" });
    }

    const styleCtx = REEL_STYLE_CONTEXT[mode ?? "normal"] ?? REEL_STYLE_CONTEXT["normal"]!;
    const emotionCtx = EMOTION_SUFFIX[emotion ?? ""] ?? "";

    const systemPrompt = `You are a viral social media content writer. Generate a short, punchy reel script in ${styleCtx} style.

Rules:
- Exactly 6 lines. Each line is one punchy sentence or phrase.
- Start with an irresistible hook on line 1.
- Build momentum through lines 2–5.
- End with a strong call to action or memorable punchline on line 6.
- Total length: under 120 words.
- No hashtags. No emojis. No stage directions.
- ${emotionCtx || "Match the energy to the topic."}
- Output only the 6 lines, each on a new line. No numbering, no labels.`;

    let script: string;
    let usedTemplate = false;
    try {
      script = await callOpenRouter(systemPrompt, `Topic: ${topic.trim()}`);
    } catch (aiErr) {
      console.warn("AI unavailable, using template fallback:", aiErr instanceof Error ? aiErr.message : aiErr);
      script = generateTemplateScript(topic.trim(), mode ?? "normal", emotion ?? "calm");
      usedTemplate = true;
    }
    return res.json({ script, usedTemplate });
  } catch (err) {
    console.error("generate-reel error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return res.status(502).json({ error: msg });
  }
});

router.post("/ai/translate", async (req, res) => {
  try {
    const { text, fromLang, toLang } = req.body as { text?: string; fromLang?: string; toLang?: string };

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "text is required" });
    }
    if (!fromLang || !toLang) {
      return res.status(400).json({ error: "fromLang and toLang are required" });
    }

    const systemPrompt = `You are a professional interpreter. Translate the following text from ${fromLang} to ${toLang}. Output ONLY the translated text — no explanations, no alternatives, no notes. Preserve the original meaning, tone, and register.`;

    const translation = await callOpenRouter(systemPrompt, text.trim());
    return res.json({ translation });
  } catch (err) {
    console.error("translate error:", err);
    const msg = err instanceof Error ? err.message : "Translation failed";
    return res.status(502).json({ error: msg });
  }
});

export default router;
