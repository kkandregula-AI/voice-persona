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

// ── Script mismatch detection ────────────────────────────────────────────────
const LC_SCRIPT_RANGES: Record<string, { re: RegExp; name: string }> = {
  te: { re: /[\u0C00-\u0C7F]/, name: "Telugu" },
  hi: { re: /[\u0900-\u097F]/, name: "Hindi" },
  mr: { re: /[\u0900-\u097F]/, name: "Marathi" },
  ta: { re: /[\u0B80-\u0BFF]/, name: "Tamil" },
  kn: { re: /[\u0C80-\u0CFF]/, name: "Kannada" },
  ml: { re: /[\u0D00-\u0D7F]/, name: "Malayalam" },
  bn: { re: /[\u0980-\u09FF]/, name: "Bengali" },
  gu: { re: /[\u0A80-\u0AFF]/, name: "Gujarati" },
  pa: { re: /[\u0A00-\u0A7F]/, name: "Punjabi" },
  ar: { re: /[\u0600-\u06FF]/, name: "Arabic" },
  ur: { re: /[\u0600-\u06FF]/, name: "Urdu" },
  zh: { re: /[\u4E00-\u9FFF]/, name: "Chinese" },
  ja: { re: /[\u3040-\u30FF]/, name: "Japanese" },
  ko: { re: /[\uAC00-\uD7AF]/, name: "Korean" },
  ru: { re: /[\u0400-\u04FF]/, name: "Russian" },
  th: { re: /[\u0E00-\u0E7F]/, name: "Thai" },
  he: { re: /[\u0590-\u05FF]/, name: "Hebrew" },
};
function lcCheckScriptMismatch(text: string, langCode: string): string | null {
  if (!text.trim()) return null;
  const base = langCode.split("-")[0]!.toLowerCase();
  const s = LC_SCRIPT_RANGES[base];
  if (!s) return null;
  if (s.re.test(text)) return null;
  return `Looks like the text is not in ${s.name} script — translating anyway. For best accuracy, try typing in ${s.name}.`;
}

function getApiBase(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:8080/api";
}

function copyToClipboard(text: string): void {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string): void {
  if (typeof document === "undefined") return;
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
  document.body.appendChild(el);
  el.focus();
  el.select();
  el.setSelectionRange(0, el.value.length);
  try { document.execCommand("copy"); } catch { /* silent */ }
  document.body.removeChild(el);
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

// ── Web Speech API fallback transcription ────────────────────────────────────

type SpeechRecognitionEvent = {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
};

function hasSpeechRecognition(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as unknown as Record<string, unknown>)["SpeechRecognition"] ||
    (window as unknown as Record<string, unknown>)["webkitSpeechRecognition"]
  );
}

type WebSpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function transcribeWithWebSpeech(
  stream: MediaStream,
  langCode: string,
  onResult: (text: string, detectedLang: string) => void,
  onError: (msg: string) => void,
): (() => void) {
  const Win = window as unknown as Record<string, unknown>;
  const SpeechRecognitionCtor =
    (Win["SpeechRecognition"] as (new () => WebSpeechRecognitionType) | undefined) ??
    (Win["webkitSpeechRecognition"] as (new () => WebSpeechRecognitionType) | undefined);

  if (!SpeechRecognitionCtor) return () => {};

  void stream; // stream is used for mic permission but Web Speech manages its own

  const rec = new SpeechRecognitionCtor();
  rec.continuous = true;
  rec.interimResults = false;
  const bcp = SPEECH_LANG_MAP[langCode] ?? "en-US";
  rec.lang = bcp;

  rec.onresult = (e: SpeechRecognitionEvent) => {
    let text = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      text += e.results[i]![0]!.transcript;
    }
    if (text.trim()) onResult(text.trim(), langCode || "en");
  };

  rec.onerror = (e: { error: string }) => {
    if (e.error !== "no-speech" && e.error !== "aborted") {
      onError(`Speech recognition error: ${e.error}`);
    }
  };

  rec.onend = () => { /* restarted externally */ };

  try { rec.start(); } catch { /* already started */ }

  return () => { try { rec.stop(); } catch { /* ignore */ } };
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
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

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
  const [langWarning, setLangWarning] = useState<string>("");
  const langWarnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // History
  const [history, setHistory] = useState<CaptionEntry[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState<boolean>(false);

  // Shared Room
  const [roomId, setRoomId] = useState<string>("");
  const [showRoomCard, setShowRoomCard] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [viewerCodeInput, setViewerCodeInput] = useState("");
  const [viewerTranslations, setViewerTranslations] = useState<{ id: string; original: string; translations: Record<string, string>; timestamp: number }[]>([]);
  const [viewerLastTs, setViewerLastTs] = useState(0);
  const [roomError, setRoomError] = useState("");
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Refs
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segmentStartRef = useRef<number | null>(null);
  const activeMimeRef = useRef<string>("");
  const accumulatedRef = useRef<string>("");
  const accumulatedByLangRef = useRef<Record<string, string>>({});
  const listeningRef = useRef<boolean>(false);
  const webSpeechModeRef = useRef<boolean>(false);
  const webSpeechStopRef = useRef<(() => void) | null>(null);
  const targetLangsRef = useRef<string[]>(["en"]);
  const viewerPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRoomIdRef = useRef<string>("");
  const viewerLastTsRef = useRef<number>(0);

  // Load history and target langs on mount
  useEffect(() => {
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
      const data = await res.json() as { translated?: string; translation?: string };
      return data.translated ?? data.translation ?? text;
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
      const res = await fetch(`${getApiBase()}/live-captions/transcribe`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        let errMsg = "Transcription failed";
        try { const e = await res.json() as { error?: string }; errMsg = e.error ?? errMsg; } catch { /* ignore */ }
        // 503 = OpenAI key not configured on server — fall back to Web Speech API if available
        if (res.status === 503 && hasSpeechRecognition() && streamRef.current) {
          webSpeechModeRef.current = true;
          // Stop MediaRecorder loop — Web Speech takes over
          if (chunkTimerRef.current !== null) { clearTimeout(chunkTimerRef.current); chunkTimerRef.current = null; }
          try { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); } catch { /* ignore */ }
          const stopFn = transcribeWithWebSpeech(
            streamRef.current,
            targetLangsRef.current[0] ?? "en",
            (text, detectedLang) => {
              if (!listeningRef.current) return;
              accumulatedRef.current = accumulatedRef.current ? `${accumulatedRef.current} ${text}` : text;
              setTranscript(accumulatedRef.current);
              setLangCode(detectedLang);
              setLangLabel(getLangLabel(detectedLang));
              setCaptionTimestamp(stamp());
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
              void translateToAllTargets(text, detectedLang);
            },
            (errMsg2) => {
              listeningRef.current = false;
              webSpeechModeRef.current = false;
              setErrorMsg(errMsg2);
              setStatus("error");
            },
          );
          webSpeechStopRef.current = stopFn;
          setStatus("listening");
          return;
        }
        throw new Error(errMsg);
      }

      const data = await res.json() as {
        text: string;
        languageCode: string;
        languageLabel: string;
        languageProbability: number;
      };

      const newText = data.text?.trim();
      if (!newText) {
        setStatus(listeningRef.current ? "listening" : "idle");
        return;
      }

      accumulatedRef.current = accumulatedRef.current
        ? `${accumulatedRef.current} ${newText}`
        : newText;

      setTranscript(accumulatedRef.current);
      setLangCode(data.languageCode);
      setLangLabel(data.languageLabel || getLangLabel(data.languageCode));
      setCaptionTimestamp(stamp());
      setStatus(listeningRef.current ? "listening" : "idle");

      // Scroll down so the results panel is visible
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

      await translateToAllTargets(newText, data.languageCode);

      if (activeRoomIdRef.current) {
        const translationsSnapshot: Record<string, string> = {};
        for (const [lang, val] of Object.entries(accumulatedByLangRef.current)) {
          translationsSnapshot[lang] = val;
        }
        void pushToRoom(accumulatedRef.current, translationsSnapshot);
      }
    } catch (err) {
      // Always surface errors — status "error" is the only way the error box renders
      listeningRef.current = false;
      if (chunkTimerRef.current !== null) { clearTimeout(chunkTimerRef.current); chunkTimerRef.current = null; }
      try { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); } catch { /* ignore */ }
      setTimeout(() => {
        try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
        recorderRef.current = null;
        streamRef.current = null;
      }, 400);
      const msg = err instanceof Error ? err.message : "Transcription failed";
      setErrorMsg(msg);
      setStatus("error");
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
    webSpeechModeRef.current = false;
    if (webSpeechStopRef.current) { webSpeechStopRef.current(); webSpeechStopRef.current = null; }

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
    // Stop Web Speech if in fallback mode
    if (webSpeechStopRef.current) {
      webSpeechStopRef.current();
      webSpeechStopRef.current = null;
    }
    webSpeechModeRef.current = false;
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
      if (webSpeechStopRef.current) { webSpeechStopRef.current(); webSpeechStopRef.current = null; }
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      try { recorderRef.current?.stop(); } catch {}
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    };
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

  function showLangWarning(msg: string) {
    setLangWarning(msg);
    if (langWarnTimerRef.current) clearTimeout(langWarnTimerRef.current);
    langWarnTimerRef.current = setTimeout(() => setLangWarning(""), 7000);
  }

  const handleDemoTranslate = useCallback(async () => {
    if (!demoText.trim()) return;
    // Check if typed text matches the selected language's script
    const warning = lcCheckScriptMismatch(demoText.trim(), demoLang);
    if (warning) setLangWarning(warning);
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

  const handleDemoLangSelect = useCallback(async (code: string, label: string) => {
    setDemoLang(code);
    const sample = DEMO_SAMPLES.find((s) => s.lang === code);
    // If text box is empty and we have a sample phrase, auto-fill and translate
    if (!demoText.trim() && sample) {
      setDemoText(sample.text);
      setLangCode(code);
      setLangLabel(label);
      setTranscript(sample.text);
      setCaptionTimestamp(stamp());
      accumulatedRef.current = sample.text;
      setTranslationsByLang({});
      accumulatedByLangRef.current = {};
      setDemoLoading(true);
      try {
        await translateToAllTargets(sample.text, code);
      } catch {
        setTranslationsByLang({ en: { text: sample.text, loading: false } });
      } finally {
        setDemoLoading(false);
      }
    }
    // If text is already typed, just update source language (don't overwrite text)
  }, [demoText, translateToAllTargets]);

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
    copyToClipboard(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
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

  // ── Shared Room ──

  const handleCreateRoom = useCallback(async () => {
    setRoomError("");
    try {
      const res = await fetch(`${getApiBase()}/rooms`, { method: "POST" });
      if (!res.ok) throw new Error("Could not create room");
      const data = await res.json() as { roomId: string };
      setRoomId(data.roomId);
      activeRoomIdRef.current = data.roomId;
      setShowRoomCard(true);
    } catch (err) {
      setRoomError(err instanceof Error ? err.message : "Failed to create room");
    }
  }, []);

  const pushToRoom = useCallback(async (original: string, translations: Record<string, string>) => {
    const id = activeRoomIdRef.current;
    if (!id) return;
    try {
      await fetch(`${getApiBase()}/rooms/${id}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, translations }),
      });
    } catch {
      // silently skip push errors
    }
  }, []);

  const handleJoinRoom = useCallback(async () => {
    const code = viewerCodeInput.trim().toUpperCase();
    if (!code) return;
    setRoomError("");
    try {
      const res = await fetch(`${getApiBase()}/rooms/${code}`);
      if (!res.ok) throw new Error("Room not found or expired");
      viewerLastTsRef.current = 0;
      setIsViewer(true);
      setViewerLastTs(0);
      setViewerTranslations([]);
      activeRoomIdRef.current = code;
      if (viewerPollRef.current) clearInterval(viewerPollRef.current);
      viewerPollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(
            `${getApiBase()}/rooms/${activeRoomIdRef.current}/pull?since=${viewerLastTsRef.current}`
          );
          if (!pollRes.ok) return;
          const pollData = await pollRes.json() as { translations: { id: string; original: string; translations: Record<string, string>; timestamp: number }[] };
          if (pollData.translations?.length > 0) {
            setViewerTranslations((prev) => {
              const ids = new Set(prev.map((t) => t.id));
              const fresh = pollData.translations.filter((t) => !ids.has(t.id));
              return [...prev, ...fresh].slice(-30);
            });
            const latest = pollData.translations[pollData.translations.length - 1];
            if (latest) {
              viewerLastTsRef.current = latest.timestamp;
              setViewerLastTs(latest.timestamp);
            }
          }
        } catch { /* skip */ }
      }, 2500);
    } catch (err) {
      setRoomError(err instanceof Error ? err.message : "Could not join room");
    }
  }, [viewerCodeInput]);

  const stopViewer = useCallback(() => {
    if (viewerPollRef.current) { clearInterval(viewerPollRef.current); viewerPollRef.current = null; }
    setIsViewer(false);
    setViewerTranslations([]);
    setViewerCodeInput("");
    activeRoomIdRef.current = "";
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setRoomId("");
    activeRoomIdRef.current = "";
    setShowRoomCard(false);
  }, []);

  // ── Derived ──

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
          <View style={styles.headerActions}>
            {!isViewer && (
              <Pressable
                style={[styles.shareRoomBtn, (roomId || showRoomCard) && { borderColor: Colors.accent + "60", backgroundColor: Colors.accent + "12" }]}
                onPress={() => {
                  if (roomId) {
                    setShowRoomCard((v) => !v);
                  } else {
                    setShowRoomCard((v) => !v);
                  }
                }}
              >
                <Feather name="share-2" size={14} color={roomId ? Colors.accent : Colors.textSecondary} />
              </Pressable>
            )}
            {isViewer && (
              <Pressable style={styles.leaveRoomBtn} onPress={stopViewer}>
                <Feather name="x" size={13} color={Colors.error ?? "#EF4444"} />
                <Text style={styles.leaveRoomBtnText}>Leave</Text>
              </Pressable>
            )}
            <Pressable style={styles.settingsBtn} onPress={() => setSettingsOpen((v) => !v)}>
              <Feather name={settingsOpen ? "x" : "settings"} size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* ── Room card ───────────────────────────────────────────────── */}
        {showRoomCard && !isViewer && (
          <Animated.View entering={FadeInDown} style={styles.roomCard}>
            {roomId ? (
              <>
                {/* Header */}
                <View style={styles.roomCardHeader}>
                  <View style={styles.roomBroadcastBadge}>
                    <View style={styles.roomBroadcastDot} />
                    <Text style={styles.roomBroadcastText}>Broadcasting</Text>
                  </View>
                  <Pressable style={styles.roomCloseBtn} onPress={handleLeaveRoom}>
                    <Feather name="x" size={13} color={Colors.textTertiary} />
                  </Pressable>
                </View>

                {/* Room code + copy */}
                <Text style={styles.roomCodeLabel}>Your room code</Text>
                <View style={styles.roomCodeRow}>
                  <Text style={styles.roomCode}>{roomId}</Text>
                  <Pressable
                    style={[styles.roomCopyBtn, copiedRoomCode && { backgroundColor: Colors.accent + "25", borderColor: Colors.accent + "60" }]}
                    onPress={() => {
                      copyToClipboard(roomId);
                      setCopiedRoomCode(true);
                      setTimeout(() => setCopiedRoomCode(false), 2000);
                    }}
                  >
                    <Feather name={copiedRoomCode ? "check" : "copy"} size={13} color={Colors.accent} />
                    <Text style={styles.roomCopyText}>{copiedRoomCode ? "Copied!" : "Copy Code"}</Text>
                  </Pressable>
                </View>

                {/* What happens */}
                <View style={styles.roomExplainBox}>
                  <Text style={styles.roomExplainTitle}>What happens now?</Text>
                  <Text style={styles.roomExplainBody}>
                    As you speak and get translations, they sync to this room automatically. Your colleague can watch them appear live on their own phone — no login required.
                  </Text>
                </View>

                {/* Step-by-step for colleague */}
                <Text style={styles.roomStepsTitle}>Tell your colleague to:</Text>
                {[
                  "Open Voice Persona AI on their device",
                  "Go to the Interpreter tab",
                  `Tap the share icon (top-right) → Join Room`,
                  `Enter code  ${roomId}  and tap Join`,
                ].map((step, i) => (
                  <View key={i} style={styles.roomStep}>
                    <View style={styles.roomStepNum}>
                      <Text style={styles.roomStepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.roomStepText}>{step}</Text>
                  </View>
                ))}

                <Text style={styles.roomHint}>Room expires automatically after 2 hours.</Text>
              </>
            ) : (
              <>
                <View style={styles.roomCardHeader}>
                  <Feather name="share-2" size={14} color={Colors.accent} />
                  <Text style={styles.roomCardTitle}>Session Rooms</Text>
                  <Pressable style={styles.roomCloseBtn} onPress={() => setShowRoomCard(false)}>
                    <Feather name="x" size={13} color={Colors.textTertiary} />
                  </Pressable>
                </View>

                <Text style={styles.roomExplainBody}>
                  A room lets someone on another device follow your live translations as you speak — in real time, with no account needed.
                </Text>

                {!!roomError && <Text style={styles.roomErrorText}>{roomError}</Text>}

                <Pressable style={styles.roomCreateBtn} onPress={handleCreateRoom}>
                  <Feather name="radio" size={14} color="#000" />
                  <Text style={styles.roomCreateBtnText}>Start Broadcasting (Create Room)</Text>
                </Pressable>

                <View style={styles.roomDivider}>
                  <View style={styles.roomDividerLine} />
                  <Text style={styles.roomDividerText}>or join someone else's room</Text>
                  <View style={styles.roomDividerLine} />
                </View>

                <Text style={styles.roomCodeLabel}>Enter a room code shared with you:</Text>
                <View style={styles.roomJoinRow}>
                  <TextInput
                    style={styles.roomCodeInput}
                    placeholder="e.g. B34961"
                    placeholderTextColor={Colors.textTertiary}
                    value={viewerCodeInput}
                    onChangeText={(t) => setViewerCodeInput(t.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={8}
                  />
                  <Pressable
                    style={[styles.roomJoinBtn, !viewerCodeInput.trim() && { opacity: 0.4 }]}
                    onPress={handleJoinRoom}
                    disabled={!viewerCodeInput.trim()}
                  >
                    <Text style={styles.roomJoinBtnText}>Join</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Animated.View>
        )}

        {/* ── Viewer mode panel ───────────────────────────────────────── */}
        {isViewer && (
          <Animated.View entering={FadeInDown} style={styles.viewerPanel}>
            <View style={styles.viewerPanelHeader}>
              <View style={styles.viewerLiveDot} />
              <Text style={styles.viewerPanelTitle}>Viewing Room · {activeRoomIdRef.current}</Text>
            </View>
            {viewerTranslations.length === 0 ? (
              <Text style={styles.viewerWaiting}>Waiting for translations from the host…</Text>
            ) : (
              viewerTranslations.slice().reverse().map((item) => (
                <View key={item.id} style={styles.viewerEntry}>
                  <Text style={styles.viewerOriginal}>{item.original}</Text>
                  {Object.entries(item.translations).map(([lang, text]) => (
                    <Text key={lang} style={styles.viewerTranslation}>
                      <Text style={styles.viewerLangLabel}>{ALL_LANG_MAP[lang]?.label ?? lang}: </Text>
                      {text}
                    </Text>
                  ))}
                </View>
              ))
            )}
          </Animated.View>
        )}

        {/* ── How it works note ──────────────────────────────────────── */}
        <View style={styles.howItWorksCard}>
          <View style={styles.howItWorksRow}>
            <Feather name="info" size={13} color={Colors.accent} style={{ marginTop: 1 }} />
            <Text style={styles.howItWorksText}>
              <Text style={styles.howItWorksBold}>How to use:{"\n"}</Text>
              {"\n"}{"🎤  "}
              <Text style={styles.howItWorksBold}>Tap Speak</Text> — talk in any language. The app transcribes and translates into all your selected target languages at once.{"\n\n"}
              {"🔊  "}
              <Text style={styles.howItWorksBold}>Tap the speaker icon</Text> on any translation card to hear it read aloud.{"\n\n"}
              {"📡  "}
              <Text style={styles.howItWorksBold}>Share icon</Text> — create a shared room so others can follow your live translations on their own device (read-only).{"\n\n"}
              For two-way conversation use the <Text style={styles.howItWorksBold}>Talk tab</Text> instead.
            </Text>
          </View>
        </View>

        {/* ── Settings card ───────────────────────────────────────────── */}
        {settingsOpen && (
          <Animated.View entering={FadeInDown} style={styles.settingsCard}>
            <View style={styles.settingsRow}>
              <Feather name="cpu" size={13} color={Colors.accent} />
              <Text style={styles.settingsLabel}>Transcription Engine</Text>
            </View>
            <Text style={styles.keyHint}>
              Audio is transcribed using AI (OpenAI Whisper via Replit proxy) — no API key needed. Transcription is free as part of the app and will not charge you anything extra.
            </Text>
          </Animated.View>
        )}

        {/* ── Mode badge ──────────────────────────────────────────────── */}
        <View style={styles.modeBadgeRow}>
          <View style={[styles.modeBadge, styles.modeBadgeDemo]}>
            <Feather name="cpu" size={11} color={Colors.accentTertiary} />
            <Text style={[styles.modeBadgeText, { color: Colors.accentTertiary }]}>
              AI Transcription — OpenAI Whisper · Free
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
                          if (ts?.text) copyToClipboard(ts.text);
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
                <Feather name={copiedAll ? "check" : "copy"} size={13} color={copiedAll ? Colors.accent : Colors.textSecondary} />
                <Text style={[styles.captionActionText, copiedAll && { color: Colors.accent }]}>{copiedAll ? "Copied!" : "Copy All"}</Text>
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
            Select a language to load a sample phrase (or type your own), then tap Translate.
          </Text>

          {/* Source language — tap to set source; auto-fills sample text when box is empty */}
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
                  onPress={() => handleDemoLangSelect(l.code, l.label)}
                >
                  <Text style={styles.sampleChipFlag}>{LANG_FLAGS[l.code] ?? "🌐"}</Text>
                  <Text style={[styles.demoLangChipText, demoLang === l.code && { color: Colors.accentTertiary }]}>
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Manual input */}
          <TextInput
            style={styles.demoInput}
            placeholder={`Type in ${LANG_LABELS[demoLang] ?? demoLang}…`}
            placeholderTextColor={Colors.textTertiary}
            value={demoText}
            onChangeText={setDemoText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            // @ts-ignore – web-only: hints Gboard/Chrome to offer the right keyboard
            lang={demoLang}
          />
          {demoLang !== "en" && (
            <View style={styles.keyboardHintRow}>
              <Feather name="info" size={11} color={Colors.textTertiary} />
              <Text style={styles.keyboardHintText}>
                Switch your device keyboard to <Text style={{ color: Colors.textSecondary }}>{LANG_LABELS[demoLang] ?? demoLang}</Text> to type natively.
                {" "}On Android, Gboard may switch automatically.
                {" "}On iPhone, use the 🌐 globe key.
              </Text>
            </View>
          )}

          {!!langWarning && (
            <Animated.View entering={FadeInUp} style={styles.langWarnBox}>
              <Feather name="alert-triangle" size={13} color="#F59E0B" />
              <Text style={styles.langWarnText}>{langWarning}</Text>
            </Animated.View>
          )}

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
  keyboardHintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  keyboardHintText: {
    flex: 1,
    fontSize: 11.5,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  langWarnBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F59E0B18",
    borderWidth: 1,
    borderColor: "#F59E0B44",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  langWarnText: {
    flex: 1,
    fontSize: 12,
    color: "#F59E0B",
    lineHeight: 17,
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

  // ── Header Actions ──
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shareRoomBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  leaveRoomBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: (Colors.error ?? "#EF4444") + "15",
    borderWidth: 1,
    borderColor: (Colors.error ?? "#EF4444") + "40",
  },
  leaveRoomBtnText: {
    color: Colors.error ?? "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Room Card ──
  roomCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  roomCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  roomCloseBtn: {
    padding: 4,
  },
  roomBroadcastBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roomBroadcastDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    shadowColor: "#22C55E",
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  roomBroadcastText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#22C55E",
    letterSpacing: 0.3,
  },
  roomExplainBox: {
    backgroundColor: Colors.accent + "0C",
    borderRadius: 10,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.accent + "22",
  },
  roomExplainTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.accent,
  },
  roomExplainBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  roomStepsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  roomStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  roomStepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent + "22",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  roomStepNumText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.accent,
  },
  roomStepText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  roomCodeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  roomCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roomCode: {
    flex: 1,
    fontSize: 28,
    fontWeight: "800",
    color: Colors.accent,
    letterSpacing: 4,
  },
  roomCopyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.accent + "15",
    borderWidth: 1,
    borderColor: Colors.accent + "40",
  },
  roomCopyText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  roomHint: {
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  roomCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
  },
  roomCreateBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },
  roomDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  roomDividerText: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  roomJoinRow: {
    flexDirection: "row",
    gap: 8,
  },
  roomCodeInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    letterSpacing: 3,
  },
  roomJoinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    justifyContent: "center",
  },
  roomJoinBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },
  roomErrorText: {
    color: Colors.error ?? "#EF4444",
    fontSize: 12,
  },

  // ── Viewer Panel ──
  viewerPanel: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  viewerPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewerLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  viewerPanelTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  viewerWaiting: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: "center",
    paddingVertical: 8,
  },
  viewerEntry: {
    gap: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  viewerOriginal: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
  },
  viewerTranslation: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  viewerLangLabel: {
    color: Colors.textTertiary,
    fontWeight: "600",
  },
});
