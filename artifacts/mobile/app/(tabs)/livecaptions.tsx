import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

// ── Accent colors ───────────────────────────────────────────────────────────
const ACCENT_LIVE = "#22C55E";
const ACCENT_LIVE_DIM = "#22C55E18";
const ACCENT_LIVE_BORDER = "#22C55E44";

// ── Storage keys ────────────────────────────────────────────────────────────
const STORAGE_KEY_EL_KEY = "lc_el_key_v1";
const STORAGE_KEY_HISTORY = "lc_history_v1";
const STORAGE_KEY_TARGET_LANGS = "lc_target_langs_v1";

// ── Language definitions ────────────────────────────────────────────────────
// Indian languages (reused from Travel Talk, same codes)
const INDIAN_LANG_OPTIONS: { code: string; label: string; flag: string }[] = [
  { code: "en", label: "English",   flag: "🇺🇸" },
  { code: "te", label: "Telugu",    flag: "🇮🇳" },
  { code: "hi", label: "Hindi",     flag: "🇮🇳" },
  { code: "ta", label: "Tamil",     flag: "🇮🇳" },
  { code: "kn", label: "Kannada",   flag: "🇮🇳" },
  { code: "ml", label: "Malayalam", flag: "🇮🇳" },
  { code: "bn", label: "Bengali",   flag: "🇧🇩" },
  { code: "mr", label: "Marathi",   flag: "🇮🇳" },
];

// International languages — same 18 used in Travel Talk
const INTL_LANG_OPTIONS: { code: string; label: string; flag: string }[] = [
  { code: "es", label: "Spanish",    flag: "🇪🇸" },
  { code: "fr", label: "French",     flag: "🇫🇷" },
  { code: "de", label: "German",     flag: "🇩🇪" },
  { code: "it", label: "Italian",    flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷" },
  { code: "ja", label: "Japanese",   flag: "🇯🇵" },
  { code: "zh", label: "Chinese",    flag: "🇨🇳" },
  { code: "ko", label: "Korean",     flag: "🇰🇷" },
  { code: "ar", label: "Arabic",     flag: "🇸🇦" },
  { code: "ru", label: "Russian",    flag: "🇷🇺" },
  { code: "nl", label: "Dutch",      flag: "🇳🇱" },
  { code: "tr", label: "Turkish",    flag: "🇹🇷" },
  { code: "pl", label: "Polish",     flag: "🇵🇱" },
  { code: "th", label: "Thai",       flag: "🇹🇭" },
  { code: "vi", label: "Vietnamese", flag: "🇻🇳" },
  { code: "id", label: "Indonesian", flag: "🇮🇩" },
  { code: "ms", label: "Malay",      flag: "🇲🇾" },
  { code: "tl", label: "Filipino",   flag: "🇵🇭" },
];

// Combined lookup by code
const ALL_LANG_MAP: Record<string, { label: string; flag: string }> = {};
[...INDIAN_LANG_OPTIONS, ...INTL_LANG_OPTIONS].forEach((l) => {
  ALL_LANG_MAP[l.code] = { label: l.label, flag: l.flag };
});

// BCP-47 tags for Web Speech API (Speak button)
const SPEECH_LANG_MAP: Record<string, string> = {
  en: "en-US", hi: "hi-IN", te: "te-IN", ta: "ta-IN", kn: "kn-IN",
  ml: "ml-IN", bn: "bn-BD", mr: "mr-IN", gu: "gu-IN", pa: "pa-IN",
  es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-BR",
  ja: "ja-JP", zh: "zh-CN", ko: "ko-KR", ar: "ar-SA", ru: "ru-RU",
  nl: "nl-NL", tr: "tr-TR", pl: "pl-PL", th: "th-TH", vi: "vi-VN",
  id: "id-ID", ms: "ms-MY", tl: "fil-PH",
};

function getApiBase(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:8080/api";
}

const LANG_FLAGS: Record<string, string> = {
  en: "🇺🇸", hi: "🇮🇳", te: "🇮🇳", ta: "🇮🇳", kn: "🇮🇳",
  ml: "🇮🇳", bn: "🇧🇩", mr: "🇮🇳", gu: "🇮🇳", pa: "🇮🇳",
  ur: "🇵🇰", ne: "🇳🇵", si: "🇱🇰", es: "🇪🇸", fr: "🇫🇷",
  de: "🇩🇪", it: "🇮🇹", pt: "🇧🇷", ja: "🇯🇵", zh: "🇨🇳",
  ko: "🇰🇷", ar: "🇸🇦", ru: "🇷🇺", nl: "🇳🇱", tr: "🇹🇷",
  pl: "🇵🇱", th: "🇹🇭", vi: "🇻🇳", id: "🇮🇩", ms: "🇲🇾",
  tl: "🇵🇭", uk: "🇺🇦", he: "🇮🇱", fa: "🇮🇷", sw: "🇰🇪",
};

const LANG_LABELS: Record<string, string> = {
  en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", kn: "Kannada",
  ml: "Malayalam", bn: "Bengali", mr: "Marathi", gu: "Gujarati", pa: "Punjabi",
  ur: "Urdu", or: "Odia", as: "Assamese", ne: "Nepali", si: "Sinhala",
  es: "Spanish", fr: "French", de: "German", it: "Italian", pt: "Portuguese",
  ja: "Japanese", zh: "Chinese", ko: "Korean", ar: "Arabic", ru: "Russian",
  nl: "Dutch", tr: "Turkish", pl: "Polish", th: "Thai", vi: "Vietnamese",
  id: "Indonesian", ms: "Malay", tl: "Filipino", uk: "Ukrainian",
  he: "Hebrew", fa: "Persian", sw: "Swahili",
};

function getLangLabel(code: string): string {
  const c = code?.toLowerCase().split("-")[0] ?? "";
  return LANG_LABELS[c] ?? ALL_LANG_MAP[c]?.label ?? code ?? "Unknown";
}

function getLangFlag(code: string): string {
  const c = code?.toLowerCase().split("-")[0] ?? "";
  return LANG_FLAGS[c] ?? ALL_LANG_MAP[c]?.flag ?? "🌐";
}

const DEMO_SAMPLES = [
  { lang: "hi", label: "Hindi",     text: "नमस्ते, आप कैसे हैं? मैं ठीक हूँ धन्यवाद।" },
  { lang: "te", label: "Telugu",    text: "నమస్కారం, మీరు ఎలా ఉన్నారు?" },
  { lang: "ta", label: "Tamil",     text: "வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?" },
  { lang: "kn", label: "Kannada",   text: "ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?" },
  { lang: "ml", label: "Malayalam", text: "നമസ്കാരം, സുഖമാണോ?" },
  { lang: "bn", label: "Bengali",   text: "নমস্কার, আপনি কেমন আছেন?" },
  { lang: "mr", label: "Marathi",   text: "नमस्कार, तुम्ही कसे आहात?" },
  { lang: "es", label: "Spanish",   text: "Hola, ¿cómo estás? Estoy muy bien, gracias." },
  { lang: "fr", label: "French",    text: "Bonjour, comment allez-vous? Je suis très bien." },
  { lang: "ar", label: "Arabic",    text: "مرحباً، كيف حالك؟ أنا بخير شكراً." },
  { lang: "ja", label: "Japanese",  text: "こんにちは、お元気ですか？私は元気です。" },
  { lang: "zh", label: "Chinese",   text: "你好，你好吗？我很好，谢谢。" },
];

const DEMO_LANG_OPTIONS = [
  { code: "hi", label: "Hindi" }, { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" }, { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" }, { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" }, { code: "gu", label: "Gujarati" },
  { code: "pa", label: "Punjabi" }, { code: "es", label: "Spanish" },
  { code: "fr", label: "French" }, { code: "de", label: "German" },
  { code: "ar", label: "Arabic" }, { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" }, { code: "ru", label: "Russian" },
];

// ── Types ───────────────────────────────────────────────────────────────────

type CaptionStatus = "idle" | "listening" | "processing" | "error";

type CaptionEntry = {
  id: string;
  timestamp: number;
  original: string;
  english: string;
  languageCode: string;
  languageLabel: string;
};

type TranslationState = { text: string; loading: boolean };
type TranslationsByLang = Record<string, TranslationState>;

// ── Storage helpers ─────────────────────────────────────────────────────────

function loadStoredKey(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY_EL_KEY) ?? "";
}

function saveStoredKey(key: string) {
  if (typeof localStorage === "undefined") return;
  if (key) localStorage.setItem(STORAGE_KEY_EL_KEY, key);
  else localStorage.removeItem(STORAGE_KEY_EL_KEY);
}

function loadHistory(): CaptionEntry[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) ?? "[]"); }
  catch { return []; }
}

function saveHistory(entries: CaptionEntry[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(entries.slice(0, 50)));
}

function loadTargetLangs(): string[] {
  if (typeof localStorage === "undefined") return ["en"];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TARGET_LANGS);
    if (!raw) return ["en"];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ["en"];
  } catch { return ["en"]; }
}

function saveTargetLangs(langs: string[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY_TARGET_LANGS, JSON.stringify(langs));
}

// ── Audio helpers ────────────────────────────────────────────────────────────

function getBestMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return candidates.find((t) => {
    try { return MediaRecorder.isTypeSupported(t); } catch { return false; }
  }) ?? "";
}

function mimeToExt(mime: string): string {
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

// ── TTS helper ───────────────────────────────────────────────────────────────

function speakText(
  text: string,
  langCode: string,
  onStart?: () => void,
  onEnd?: () => void,
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = SPEECH_LANG_MAP[langCode] ?? langCode;
  utter.onstart = () => onStart?.();
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

// ── Main component ──────────────────────────────────────────────────────────

export default function LiveCaptionsTab() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  // Settings
  const [elKey, setElKey] = useState<string>("");
  const [elKeyInput, setElKeyInput] = useState<string>("");
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [keySaved, setKeySaved] = useState<boolean>(false);

  // Caption state
  const [status, setStatus] = useState<CaptionStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [langCode, setLangCode] = useState<string>("");
  const [langLabel, setLangLabel] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [captionTimestamp, setCaptionTimestamp] = useState<string>("");

  // Multi-target language translations
  const [targetLangs, setTargetLangs] = useState<string[]>(["en"]);
  const [translationsByLang, setTranslationsByLang] = useState<TranslationsByLang>({});

  // Countdown (seconds remaining in current 10s window)
  const [countdown, setCountdown] = useState<number | null>(null);

  // TTS playback
  const [speakingLang, setSpeakingLang] = useState<string | null>(null);

  // Demo mode
  const [demoText, setDemoText] = useState<string>("");
  const [demoLang, setDemoLang] = useState<string>("hi");
  const [demoLoading, setDemoLoading] = useState<boolean>(false);

  // History
  const [history, setHistory] = useState<CaptionEntry[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState<boolean>(false);

  // Refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segmentStartRef = useRef<number | null>(null);
  const activeMimeRef = useRef<string>("");
  const elKeyRef = useRef<string>("");
  const accumulatedRef = useRef<string>("");
  const accumulatedByLangRef = useRef<Record<string, string>>({});
  const listeningRef = useRef<boolean>(false);
  const targetLangsRef = useRef<string[]>(["en"]);

  // Load stored key, history, and target langs on mount
  useEffect(() => {
    const stored = loadStoredKey();
    if (stored) {
      setElKey(stored);
      setElKeyInput(stored);
      elKeyRef.current = stored;
    }
    setHistory(loadHistory());
    const tl = loadTargetLangs();
    setTargetLangs(tl);
    targetLangsRef.current = tl;
  }, []);

  // Countdown ticker — active while listening or processing
  const isLive = status === "listening" || status === "processing";
  useEffect(() => {
    if (!isLive) {
      setCountdown(null);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }
    countdownIntervalRef.current = setInterval(() => {
      if (segmentStartRef.current === null) return;
      const elapsed = Math.floor((Date.now() - segmentStartRef.current) / 1000);
      const remaining = Math.max(0, 10 - elapsed);
      setCountdown(remaining);
    }, 250);
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isLive]);

  // ── Helpers ──

  const stamp = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const translateText = useCallback(async (text: string, fromLang: string, toLang: string): Promise<string> => {
    if (!text.trim()) return "";
    const from = (fromLang || "").split("-")[0];
    const to = (toLang || "").split("-")[0];
    if (!from || !to || from === to) return text;
    try {
      const res = await fetch(`${getApiBase()}/ai/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fromLang: from, toLang: to }),
      });
      if (!res.ok) throw new Error("translate failed");
      const data = await res.json() as { translation?: string };
      return data.translation ?? text;
    } catch {
      return text;
    }
  }, []);

  const translateToEnglish = useCallback(async (text: string, fromLang: string): Promise<string> => {
    if (!text.trim()) return "";
    const normalizedFrom = (fromLang || "").split("-")[0];
    if (!normalizedFrom || normalizedFrom === "en") return text;
    return translateText(text, normalizedFrom, "en");
  }, [translateText]);

  // Translate source text into all selected target languages in parallel
  const translateToAllTargets = useCallback(async (
    newText: string,
    srcLang: string,
  ) => {
    const langs = targetLangsRef.current;
    const srcNorm = (srcLang || "").split("-")[0];

    // Mark loading for each language that needs translation
    setTranslationsByLang((prev) => {
      const next = { ...prev };
      for (const lang of langs) {
        next[lang] = { text: next[lang]?.text ?? "", loading: lang !== srcNorm };
      }
      return next;
    });

    await Promise.all(langs.map(async (lang) => {
      let text: string;
      if (lang === srcNorm) {
        // Same as source — show original
        text = newText;
      } else if (lang === "en") {
        text = await translateToEnglish(newText, srcNorm);
      } else {
        const from = srcNorm || "en";
        text = await translateText(newText, from, lang);
      }
      accumulatedByLangRef.current[lang] = accumulatedByLangRef.current[lang]
        ? `${accumulatedByLangRef.current[lang]} ${text}`
        : text;
      setTranslationsByLang((prev) => ({
        ...prev,
        [lang]: { text: accumulatedByLangRef.current[lang] ?? "", loading: false },
      }));
    }));
  }, [translateToEnglish, translateText]);

  // Send audio chunk → transcribe → translate to all targets
  const sendChunk = useCallback(async (blob: Blob) => {
    if (blob.size < 1000) return;
    setStatus("processing");
    try {
      const form = new FormData();
      const ext = mimeToExt(activeMimeRef.current || blob.type);
      form.append("audio", blob, `chunk.${ext}`);
      const headers: Record<string, string> = {};
      if (elKeyRef.current) headers["x-elevenlabs-key"] = elKeyRef.current;

      const res = await fetch(`${getApiBase()}/live-captions/transcribe`, {
        method: "POST",
        headers,
        body: form,
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "Transcription failed");
      }

      const data = await res.json() as {
        text: string;
        languageCode: string;
        languageLabel: string;
        languageProbability: number;
      };

      const newText = data.text?.trim();
      if (!newText) {
        if (listeningRef.current) setStatus("listening");
        return;
      }

      accumulatedRef.current = accumulatedRef.current
        ? `${accumulatedRef.current} ${newText}`
        : newText;

      setTranscript(accumulatedRef.current);
      setLangCode(data.languageCode);
      setLangLabel(data.languageLabel || getLangLabel(data.languageCode));
      setCaptionTimestamp(stamp());
      if (listeningRef.current) setStatus("listening");

      await translateToAllTargets(newText, data.languageCode);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transcription failed";
      setErrorMsg(msg);
      if (listeningRef.current) setStatus("listening");
    }
  }, [translateToAllTargets]);

  // ── Controls ──

  const handleStartListening = useCallback(async () => {
    if (status === "listening" || status === "processing") return;
    setStatus("listening");
    setErrorMsg("");
    setTranscript("");
    setTranslationsByLang({});
    setLangCode("");
    setLangLabel("");
    setCaptionTimestamp("");
    accumulatedRef.current = "";
    accumulatedByLangRef.current = {};

    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setStatus("error");
      setErrorMsg("Microphone not available on this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const mimeType = getBestMimeType();
      activeMimeRef.current = mimeType;
      listeningRef.current = true;

      // Stop/restart cycle — iOS Safari only fires ondataavailable on .stop()
      // Default window: 10 seconds per segment
      const SEGMENT_MS = 10000;

      const startSegment = () => {
        if (!listeningRef.current || !streamRef.current?.active) return;

        // Reset countdown for this segment
        segmentStartRef.current = Date.now();

        let rec: MediaRecorder;
        try {
          rec = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
        } catch {
          rec = new MediaRecorder(streamRef.current);
          activeMimeRef.current = "";
        }
        recorderRef.current = rec;

        rec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) sendChunk(e.data);
        };

        rec.onstop = () => {
          if (listeningRef.current) startSegment();
        };

        rec.onerror = () => {
          if (listeningRef.current) {
            setErrorMsg("Recording error. Try again.");
            setStatus("error");
          }
        };

        rec.start();

        chunkTimerRef.current = setTimeout(() => {
          if (rec.state === "recording") {
            try { rec.stop(); } catch {}
          }
        }, SEGMENT_MS);
      };

      startSegment();
    } catch (err) {
      listeningRef.current = false;
      const msg = err instanceof Error ? err.message : "Microphone access denied";
      if (msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("permission")) {
        setErrorMsg("Microphone permission denied. Please allow mic access in your browser settings and try again.");
      } else if (msg.toLowerCase().includes("found") || msg.toLowerCase().includes("device") || msg.toLowerCase().includes("hardware")) {
        setErrorMsg("No microphone found. Please connect a microphone and try again.");
      } else if (msg.toLowerCase().includes("notsupported") || msg.toLowerCase().includes("not supported")) {
        setErrorMsg("Your browser does not support audio recording. Try Chrome or Safari.");
      } else {
        setErrorMsg(msg);
      }
      setStatus("error");
    }
  }, [status, sendChunk]);

  const handleStopListening = useCallback(() => {
    listeningRef.current = false;
    segmentStartRef.current = null;
    if (chunkTimerRef.current !== null) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    try {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    } catch {}
    setTimeout(() => {
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      recorderRef.current = null;
      streamRef.current = null;
    }, 600);
    setStatus("idle");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      listeningRef.current = false;
      segmentStartRef.current = null;
      if (chunkTimerRef.current !== null) clearTimeout(chunkTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      try { recorderRef.current?.stop(); } catch {}
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    };
  }, []);

  // ── Key management ──

  const handleSaveKey = useCallback(() => {
    const trimmed = elKeyInput.trim();
    setElKey(trimmed);
    elKeyRef.current = trimmed;
    saveStoredKey(trimmed);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }, [elKeyInput]);

  const handleClearKey = useCallback(() => {
    setElKey("");
    setElKeyInput("");
    elKeyRef.current = "";
    saveStoredKey("");
  }, []);

  // ── Target language management ──

  const handleAddTargetLang = useCallback((code: string) => {
    setTargetLangs((prev) => {
      if (prev.includes(code)) return prev;
      const next = [...prev, code];
      targetLangsRef.current = next;
      saveTargetLangs(next);
      return next;
    });
    // Clear accumulated for this lang so fresh translation fills it
    accumulatedByLangRef.current[code] = "";
    setTranslationsByLang((prev) => ({ ...prev, [code]: { text: "", loading: false } }));
  }, []);

  const handleRemoveTargetLang = useCallback((code: string) => {
    setTargetLangs((prev) => {
      const next = prev.filter((c) => c !== code);
      const final = next.length === 0 ? ["en"] : next;
      targetLangsRef.current = final;
      saveTargetLangs(final);
      return final;
    });
    setTranslationsByLang((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
  }, []);

  // ── TTS ──

  const handleSpeak = useCallback((text: string, langCode: string) => {
    if (!text) return;
    if (speakingLang === langCode) {
      // Toggle off — stop current playback
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      setSpeakingLang(null);
      return;
    }
    setSpeakingLang(langCode);
    speakText(text, langCode, undefined, () => setSpeakingLang(null));
  }, [speakingLang]);

  // ── Demo mode ──

  const handleDemoTranslate = useCallback(async () => {
    if (!demoText.trim()) return;
    setDemoLoading(true);
    setErrorMsg("");
    setTranslationsByLang({});
    accumulatedByLangRef.current = {};
    try {
      const label = getLangLabel(demoLang);
      setLangCode(demoLang);
      setLangLabel(label);
      setTranscript(demoText.trim());
      setCaptionTimestamp(stamp());
      accumulatedRef.current = demoText.trim();

      await translateToAllTargets(demoText.trim(), demoLang);
    } catch {
      setErrorMsg("Translation failed. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  }, [demoText, demoLang, translateToAllTargets]);

  const handleDemoSample = useCallback(async (sample: typeof DEMO_SAMPLES[0]) => {
    setDemoText(sample.text);
    setDemoLang(sample.lang);
    setLangCode(sample.lang);
    setLangLabel(sample.label);
    setTranscript(sample.text);
    setCaptionTimestamp(stamp());
    accumulatedRef.current = sample.text;
    setTranslationsByLang({});
    accumulatedByLangRef.current = {};
    setDemoLoading(true);
    try {
      await translateToAllTargets(sample.text, sample.lang);
    } catch {
      // Fallback: show original
      setTranslationsByLang({ en: { text: sample.text, loading: false } });
    } finally {
      setDemoLoading(false);
    }
  }, [translateToAllTargets]);

  // ── Actions ──

  const handleCopy = useCallback(() => {
    if (!transcript) return;
    const parts: string[] = [];
    if (langCode && !langCode.startsWith("en")) {
      parts.push(`Original (${langLabel}):\n${transcript}`);
    }
    for (const [code, ts] of Object.entries(translationsByLang)) {
      const label = ALL_LANG_MAP[code]?.label ?? getLangLabel(code);
      parts.push(`${label}:\n${ts.text}`);
    }
    const text = parts.length > 0 ? parts.join("\n\n") : transcript;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, [transcript, translationsByLang, langCode, langLabel]);

  const handleClear = useCallback(() => {
    setTranscript("");
    setTranslationsByLang({});
    setLangCode("");
    setLangLabel("");
    setCaptionTimestamp("");
    setErrorMsg("");
    accumulatedRef.current = "";
    accumulatedByLangRef.current = {};
  }, []);

  const handleSaveToHistory = useCallback(() => {
    if (!transcript) return;
    const englishText = translationsByLang["en"]?.text ?? transcript;
    const entry: CaptionEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      original: transcript,
      english: englishText,
      languageCode: langCode,
      languageLabel: langLabel || "Unknown",
    };
    const updated = [entry, ...history].slice(0, 50);
    setHistory(updated);
    saveHistory(updated);
  }, [transcript, translationsByLang, langCode, langLabel, history]);

  const handleDeleteHistory = useCallback((id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  }, [history]);

  // ── Derived ──

  const hasKey = !!elKey;
  const hasCaption = !!transcript;
  const tabBottom = insets.bottom + 80;

  const targetLangsText = targetLangs.length === 0 ? "English"
    : targetLangs.map((c) => ALL_LANG_MAP[c]?.label ?? getLangLabel(c)).join(", ");

  // ── Render ──

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.liveDot, isLive && styles.liveDotActive]} />
            <View>
              <Text style={styles.headerTitle}>Live Interpreter</Text>
              <Text style={styles.headerSub}>Speak → transcript + multi-language translations</Text>
            </View>
          </View>
          <Pressable style={styles.settingsBtn} onPress={() => setSettingsOpen((v) => !v)}>
            <Feather name={settingsOpen ? "x" : "settings"} size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* ── How it works note ──────────────────────────────────────── */}
        <View style={styles.howItWorksCard}>
          <View style={styles.howItWorksRow}>
            <Feather name="info" size={13} color={Colors.accent} style={{ marginTop: 1 }} />
            <Text style={styles.howItWorksText}>
              <Text style={styles.howItWorksBold}>How to use: </Text>
              Speak in your language — the app listens for up to 10 seconds, transcribes what you said, and instantly translates it into one or more languages you select below. Tap <Text style={styles.howItWorksBold}>Speak</Text> on any translation card to hear it read aloud in that language.
            </Text>
          </View>
        </View>

        {/* ── Settings card ───────────────────────────────────────────── */}
        {settingsOpen && (
          <Animated.View entering={FadeInDown} style={styles.settingsCard}>
            <View style={styles.settingsRow}>
              <Feather name="key" size={13} color={Colors.accent} />
              <Text style={styles.settingsLabel}>ElevenLabs API Key</Text>
              {hasKey && (
                <View style={styles.keyActiveBadge}>
                  <Text style={styles.keyActiveBadgeText}>Active</Text>
                </View>
              )}
            </View>
            <TextInput
              style={styles.keyInput}
              placeholder="Paste your ElevenLabs API key…"
              placeholderTextColor={Colors.textTertiary}
              value={elKeyInput}
              onChangeText={setElKeyInput}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.keyActions}>
              <Pressable
                style={[styles.saveKeyBtn, !elKeyInput.trim() && { opacity: 0.4 }]}
                onPress={handleSaveKey}
                disabled={!elKeyInput.trim()}
              >
                <Feather name="check" size={13} color="#fff" />
                <Text style={styles.saveKeyBtnText}>{keySaved ? "Saved!" : "Save Key"}</Text>
              </Pressable>
              {hasKey && (
                <Pressable style={styles.clearKeyBtn} onPress={handleClearKey}>
                  <Feather name="trash-2" size={13} color={Colors.error} />
                  <Text style={styles.clearKeyBtnText}>Remove</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.keyHint}>
              {hasKey
                ? "✓ Using ElevenLabs Scribe for transcription. Key stored only on this device."
                : "Without a key, audio is transcribed using AI (OpenAI Whisper). Your key enables ElevenLabs Scribe with better language detection."}
            </Text>
          </Animated.View>
        )}

        {/* ── Mode badge ──────────────────────────────────────────────── */}
        <View style={styles.modeBadgeRow}>
          <View style={[styles.modeBadge, hasKey ? styles.modeBadgeLive : styles.modeBadgeDemo]}>
            <Feather
              name={hasKey ? "activity" : "cpu"}
              size={11}
              color={hasKey ? ACCENT_LIVE : Colors.accentTertiary}
            />
            <Text style={[styles.modeBadgeText, { color: hasKey ? ACCENT_LIVE : Colors.accentTertiary }]}>
              {hasKey ? "LIVE MODE — ElevenLabs Scribe" : "DEMO / AI MODE — OpenAI Whisper fallback"}
            </Text>
          </View>
        </View>

        {/* ── Target Language Selector ─────────────────────────────────── */}
        <View style={styles.targetLangCard}>
          <View style={styles.targetLangCardHeader}>
            <Feather name="globe" size={13} color={Colors.accentTertiary} />
            <Text style={styles.targetLangCardTitle}>Target Languages</Text>
          </View>

          {/* Selected language chips with remove (×) */}
          {targetLangs.length > 0 && (
            <View style={styles.selectedLangsRow}>
              {targetLangs.map((code) => {
                const info = ALL_LANG_MAP[code];
                return (
                  <View key={code} style={styles.selectedLangChip}>
                    <Text style={styles.selectedLangChipFlag}>{info?.flag ?? "🌐"}</Text>
                    <Text style={styles.selectedLangChipText}>{info?.label ?? code}</Text>
                    <Pressable
                      style={styles.selectedLangChipRemove}
                      onPress={() => handleRemoveTargetLang(code)}
                    >
                      <Feather name="x" size={11} color={Colors.accentTertiary} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Indian Languages group */}
          <Text style={styles.langGroupLabel}>🇮🇳 Indian Languages</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langGroupRow}
          >
            {INDIAN_LANG_OPTIONS.map((opt) => {
              const selected = targetLangs.includes(opt.code);
              return (
                <Pressable
                  key={opt.code}
                  style={[styles.langPickerChip, selected && styles.langPickerChipActive]}
                  onPress={() => selected ? handleRemoveTargetLang(opt.code) : handleAddTargetLang(opt.code)}
                >
                  <Text style={[styles.langPickerChipText, selected && styles.langPickerChipTextActive]}>
                    {opt.flag} {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* International Languages group */}
          <Text style={styles.langGroupLabel}>🌍 International Languages</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langGroupRow}
          >
            {INTL_LANG_OPTIONS.map((opt) => {
              const selected = targetLangs.includes(opt.code);
              return (
                <Pressable
                  key={opt.code}
                  style={[styles.langPickerChip, selected && styles.langPickerChipActive]}
                  onPress={() => selected ? handleRemoveTargetLang(opt.code) : handleAddTargetLang(opt.code)}
                >
                  <Text style={[styles.langPickerChipText, selected && styles.langPickerChipTextActive]}>
                    {opt.flag} {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Future expansion note */}
          <Text style={styles.futureLangNote}>
            ✦ More languages will be added in future updates.
          </Text>
        </View>

        {/* ── Mic Controls ────────────────────────────────────────────── */}
        <View style={styles.controlsCard}>
          <View style={styles.controlsRow}>
            <Pressable
              style={[styles.ctrlBtn, styles.ctrlBtnStart, isLive && styles.ctrlBtnDisabled]}
              onPress={handleStartListening}
              disabled={isLive}
            >
              <Feather name="mic" size={16} color={isLive ? Colors.textTertiary : "#fff"} />
              <Text style={[styles.ctrlBtnText, isLive && { color: Colors.textTertiary }]}>
                Start Listening
              </Text>
            </Pressable>

            <Pressable
              style={[styles.ctrlBtn, styles.ctrlBtnStop, !isLive && styles.ctrlBtnDisabled]}
              onPress={handleStopListening}
              disabled={!isLive}
            >
              <Feather name="square" size={16} color={!isLive ? Colors.textTertiary : "#fff"} />
              <Text style={[styles.ctrlBtnText, !isLive && { color: Colors.textTertiary }]}>
                Stop
              </Text>
            </Pressable>
          </View>

          {/* Status row with countdown */}
          <View style={styles.statusRow}>
            <View style={[
              styles.statusDot,
              status === "listening" && styles.statusDotListening,
              status === "processing" && styles.statusDotProcessing,
              status === "error" && styles.statusDotError,
            ]} />
            <Text style={[
              styles.statusText,
              status === "listening" && { color: ACCENT_LIVE },
              status === "processing" && { color: Colors.accent },
              status === "error" && { color: Colors.error },
            ]}>
              {status === "idle" ? "Idle — ready to start"
                : status === "listening"
                  ? countdown !== null
                    ? `Listening for 10 seconds… (${countdown}s remaining)`
                    : "Listening… speak now"
                  : status === "processing" ? "Processing audio chunk…"
                  : `Error: ${errorMsg}`}
            </Text>
          </View>

          {status === "error" && !!errorMsg && (
            <Animated.View entering={FadeInUp} style={styles.errorBox}>
              <Feather name="alert-circle" size={13} color={Colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </Animated.View>
          )}
        </View>

        {/* ── Results panel ───────────────────────────────────────────── */}
        {hasCaption && (
          <Animated.View entering={FadeInDown} style={styles.captionPanel}>
            {/* Detected language + timestamp */}
            <View style={styles.captionHeader}>
              <View style={styles.langBadge}>
                <Text style={styles.langBadgeFlag}>{getLangFlag(langCode)}</Text>
                <Text style={styles.langBadgeText}>
                  {langLabel || "Detecting…"}
                </Text>
              </View>
              {!!captionTimestamp && (
                <Text style={styles.captionTime}>{captionTimestamp}</Text>
              )}
            </View>

            {/* Original transcript */}
            <View style={styles.originalBlock}>
              <Text style={styles.originalLabel}>Original Transcript</Text>
              <Text style={styles.originalText}>{transcript}</Text>
            </View>

            {/* Translation cards — one per selected target language */}
            {targetLangs.map((code) => {
              const info = ALL_LANG_MAP[code];
              const ts = translationsByLang[code];
              const isPlaying = speakingLang === code;
              return (
                <View key={code} style={styles.translationCard}>
                  <View style={styles.translationCardHeader}>
                    <Text style={styles.translationCardFlag}>{info?.flag ?? "🌐"}</Text>
                    <Text style={styles.translationCardLabel}>{info?.label ?? getLangLabel(code)}</Text>
                    {ts?.loading && (
                      <View style={styles.translatingBadge}>
                        <Text style={styles.translatingText}>translating…</Text>
                      </View>
                    )}
                    <View style={styles.translationCardActions}>
                      {/* Copy */}
                      <Pressable
                        style={styles.translationIconBtn}
                        onPress={() => {
                          if (ts?.text && typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(ts.text).catch(() => {});
                          }
                        }}
                      >
                        <Feather name="copy" size={13} color={Colors.textTertiary} />
                      </Pressable>
                      {/* Speak */}
                      <Pressable
                        style={[styles.speakBtn, isPlaying && styles.speakBtnActive]}
                        onPress={() => handleSpeak(ts?.text ?? "", code)}
                        disabled={!ts?.text}
                      >
                        <Feather
                          name={isPlaying ? "volume-x" : "volume-2"}
                          size={13}
                          color={isPlaying ? Colors.accentTertiary : Colors.textSecondary}
                        />
                        <Text style={[styles.speakBtnText, isPlaying && { color: Colors.accentTertiary }]}>
                          {isPlaying ? "Stop" : "Speak"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.translationCardText}>
                    {ts?.text || (ts?.loading ? "Translating…" : "—")}
                  </Text>
                </View>
              );
            })}

            {/* Caption actions */}
            <View style={styles.captionActions}>
              <Pressable style={styles.captionAction} onPress={handleCopy}>
                <Feather name="copy" size={13} color={Colors.textSecondary} />
                <Text style={styles.captionActionText}>Copy All</Text>
              </Pressable>
              <Pressable style={styles.captionAction} onPress={handleSaveToHistory}>
                <Feather name="bookmark" size={13} color={Colors.textSecondary} />
                <Text style={styles.captionActionText}>Save</Text>
              </Pressable>
              <Pressable style={styles.captionAction} onPress={handleClear}>
                <Feather name="trash-2" size={13} color={Colors.textSecondary} />
                <Text style={styles.captionActionText}>Clear</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* ── Demo / Manual Translate panel ───────────────────────────── */}
        <View style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <Feather name="edit-3" size={13} color={Colors.accentTertiary} />
            <Text style={styles.demoHeaderText}>Demo / Manual Translate</Text>
          </View>
          <Text style={styles.demoHint}>
            No microphone? Pick a sample phrase or type any text — translations appear in all selected target languages.
          </Text>

          {/* Sample phrases */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.samplesScroll}
            contentContainerStyle={styles.samplesContent}
          >
            {DEMO_SAMPLES.map((s) => (
              <Pressable
                key={s.lang}
                style={[styles.sampleChip, demoLang === s.lang && styles.sampleChipActive]}
                onPress={() => handleDemoSample(s)}
              >
                <Text style={styles.sampleChipFlag}>{LANG_FLAGS[s.lang] ?? "🌐"}</Text>
                <Text style={[styles.sampleChipText, demoLang === s.lang && { color: Colors.accentTertiary }]}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Manual input */}
          <TextInput
            style={styles.demoInput}
            placeholder="Type text in any language…"
            placeholderTextColor={Colors.textTertiary}
            value={demoText}
            onChangeText={setDemoText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Source language selector */}
          <View style={styles.demoLangRow}>
            <Text style={styles.demoLangLabel}>Source Language:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.demoLangOptions}
            >
              {DEMO_LANG_OPTIONS.map((l) => (
                <Pressable
                  key={l.code}
                  style={[styles.demoLangChip, demoLang === l.code && styles.demoLangChipActive]}
                  onPress={() => setDemoLang(l.code)}
                >
                  <Text style={[styles.demoLangChipText, demoLang === l.code && { color: Colors.accentTertiary }]}>
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <Pressable
            style={[styles.translateBtn, (!demoText.trim() || demoLoading) && { opacity: 0.4 }]}
            onPress={handleDemoTranslate}
            disabled={!demoText.trim() || demoLoading}
          >
            <Feather name="globe" size={14} color="#fff" />
            <Text style={styles.translateBtnText}>
              {demoLoading
                ? "Translating…"
                : `Translate → ${targetLangsText}`}
            </Text>
          </Pressable>
        </View>

        {/* ── History ─────────────────────────────────────────────────── */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Pressable
              style={styles.historySectionHeader}
              onPress={() => setHistoryExpanded((v) => !v)}
            >
              <Feather name="clock" size={13} color={Colors.textSecondary} />
              <Text style={styles.historySectionTitle}>Saved Sessions ({history.length})</Text>
              <Feather
                name={historyExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={Colors.textTertiary}
              />
            </Pressable>

            {historyExpanded && history.map((entry) => {
              const dt = new Date(entry.timestamp);
              const timeStr = dt.toLocaleDateString([], { month: "short", day: "numeric" }) +
                " " + dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <Animated.View key={entry.id} entering={FadeInDown} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyLangBadge}>
                      <Text style={styles.historyLangFlag}>
                        {getLangFlag(entry.languageCode?.split("-")[0] ?? "")}
                      </Text>
                      <Text style={styles.historyLangText}>{entry.languageLabel}</Text>
                    </View>
                    <Text style={styles.historyTime}>{timeStr}</Text>
                    <Pressable onPress={() => handleDeleteHistory(entry.id)} style={styles.historyDeleteBtn}>
                      <Feather name="x" size={12} color={Colors.textTertiary} />
                    </Pressable>
                  </View>
                  {entry.original && entry.original !== entry.english && (
                    <Text style={styles.historyOriginal} numberOfLines={2}>{entry.original}</Text>
                  )}
                  <Text style={styles.historyEnglish} numberOfLines={3}>{entry.english}</Text>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingTop: Platform.OS === "ios" ? 60 : (StatusBar.currentHeight ?? 24) + 16,
    paddingHorizontal: 18,
    gap: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cardBorder,
  },
  liveDotActive: {
    backgroundColor: ACCENT_LIVE,
    shadowColor: ACCENT_LIVE,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  // How it works info card
  howItWorksCard: {
    backgroundColor: Colors.accent + "0C",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.accent + "33",
  },
  howItWorksRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  howItWorksText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  howItWorksBold: {
    fontWeight: "700",
    color: Colors.text,
  },

  // Settings
  settingsCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    flex: 1,
  },
  keyActiveBadge: {
    backgroundColor: ACCENT_LIVE_DIM,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: ACCENT_LIVE_BORDER,
  },
  keyActiveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: ACCENT_LIVE,
  },
  keyInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  keyActions: {
    flexDirection: "row",
    gap: 8,
  },
  saveKeyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveKeyBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  clearKeyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.error + "44",
  },
  clearKeyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.error,
  },
  keyHint: {
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 16,
  },

  // Mode badge
  modeBadgeRow: { flexDirection: "row" },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeBadgeLive: {
    backgroundColor: ACCENT_LIVE_DIM,
    borderColor: ACCENT_LIVE_BORDER,
  },
  modeBadgeDemo: {
    backgroundColor: Colors.accentTertiary + "18",
    borderColor: Colors.accentTertiary + "44",
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Target language selector card
  targetLangCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accentTertiary + "33",
    gap: 10,
  },
  targetLangCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  targetLangCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.accentTertiary,
  },
  selectedLangsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  selectedLangChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.accentTertiary + "22",
    borderRadius: 20,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.accentTertiary + "55",
  },
  selectedLangChipFlag: { fontSize: 12 },
  selectedLangChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.accentTertiary,
  },
  selectedLangChipRemove: {
    padding: 2,
  },
  langGroupLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  langGroupRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 2,
  },
  langPickerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  langPickerChipActive: {
    backgroundColor: Colors.accentTertiary + "22",
    borderColor: Colors.accentTertiary + "66",
  },
  langPickerChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  langPickerChipTextActive: {
    color: Colors.accentTertiary,
  },
  futureLangNote: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontStyle: "italic",
    textAlign: "center",
    paddingTop: 2,
  },

  // Controls card
  controlsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 10,
  },
  ctrlBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  ctrlBtnStart: {
    backgroundColor: ACCENT_LIVE,
    borderColor: ACCENT_LIVE,
  },
  ctrlBtnStop: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  ctrlBtnDisabled: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
  },
  ctrlBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },
  statusDotListening: { backgroundColor: ACCENT_LIVE },
  statusDotProcessing: { backgroundColor: Colors.accent },
  statusDotError: { backgroundColor: Colors.error },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.error + "18",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.error + "44",
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    flex: 1,
    lineHeight: 17,
  },

  // Caption / results panel
  captionPanel: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  captionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  langBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent + "18",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.accent + "44",
  },
  langBadgeFlag: { fontSize: 14 },
  langBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.accent,
  },
  captionTime: {
    fontSize: 11,
    color: Colors.textTertiary,
  },

  // Original transcript block
  originalBlock: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  originalLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  originalText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Individual translation card
  translationCard: {
    backgroundColor: Colors.accentTertiary + "0C",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accentTertiary + "33",
    gap: 8,
  },
  translationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  translationCardFlag: { fontSize: 14 },
  translationCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.accentTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  translatingBadge: {
    backgroundColor: Colors.accent + "22",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  translatingText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.accent,
  },
  translationCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  translationIconBtn: {
    padding: 4,
  },
  speakBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  speakBtnActive: {
    borderColor: Colors.accentTertiary + "66",
    backgroundColor: Colors.accentTertiary + "18",
  },
  speakBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  translationCardText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 28,
    letterSpacing: -0.3,
  },

  // Caption actions row
  captionActions: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 10,
  },
  captionAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  captionActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  // Demo card
  demoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.accentTertiary + "33",
    gap: 12,
  },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  demoHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.accentTertiary,
  },
  demoHint: {
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  samplesScroll: { marginHorizontal: -4 },
  samplesContent: {
    paddingHorizontal: 4,
    gap: 6,
    flexDirection: "row",
  },
  sampleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sampleChipActive: {
    borderColor: Colors.accentTertiary + "66",
    backgroundColor: Colors.accentTertiary + "18",
  },
  sampleChipFlag: { fontSize: 13 },
  sampleChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  demoInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    minHeight: 72,
    lineHeight: 20,
  },
  demoLangRow: { gap: 8 },
  demoLangLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textTertiary,
  },
  demoLangOptions: {
    flexDirection: "row",
    gap: 6,
  },
  demoLangChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  demoLangChipActive: {
    borderColor: Colors.accentTertiary + "66",
    backgroundColor: Colors.accentTertiary + "18",
  },
  demoLangChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  translateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accentTertiary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  translateBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  // History
  historySection: { gap: 8 },
  historySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  historySectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  historyCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 6,
  },
  historyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyLangBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  historyLangFlag: { fontSize: 11 },
  historyLangText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  historyTime: {
    flex: 1,
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: "right",
  },
  historyDeleteBtn: { padding: 3 },
  historyOriginal: {
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
  historyEnglish: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
  },
});
