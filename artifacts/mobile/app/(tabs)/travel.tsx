import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { DetailScreen } from "@/components/DetailScreen";
import { MemoryScreen } from "@/components/MemoryScreen";
import {
  type ConversationSession,
  type SavedPhrase,
  type SessionMessage,
  createNewSession,
  deletePhrase,
  deleteSession,
  exportSessionText,
  loadSavedPhrases,
  loadSessions,
  pinSession,
  renameSession,
  setSessionInsights,
  upsertPhrase,
  upsertSession,
} from "@/utils/travelStorage";

const ACCENT_TRAVEL = "#10B981";
const ACCENT_TRAVEL_DIM = "#10B98122";
const ACCENT_TRAVEL_BORDER = "#10B98155";

type Language = { code: string; label: string; flag: string; name: string };

const LANGUAGES: Language[] = [
  // ── Global ─────────────────────────────────────────────────────────────────
  { code: "en-US", label: "English",     flag: "🇺🇸", name: "English"     },
  { code: "es-ES", label: "Spanish",     flag: "🇪🇸", name: "Spanish"     },
  { code: "fr-FR", label: "French",      flag: "🇫🇷", name: "French"      },
  { code: "de-DE", label: "German",      flag: "🇩🇪", name: "German"      },
  { code: "it-IT", label: "Italian",     flag: "🇮🇹", name: "Italian"     },
  { code: "pt-BR", label: "Portuguese",  flag: "🇧🇷", name: "Portuguese"  },
  { code: "ja-JP", label: "Japanese",    flag: "🇯🇵", name: "Japanese"    },
  { code: "zh-CN", label: "Chinese",     flag: "🇨🇳", name: "Chinese"     },
  { code: "ko-KR", label: "Korean",      flag: "🇰🇷", name: "Korean"      },
  { code: "ar-SA", label: "Arabic",      flag: "🇸🇦", name: "Arabic"      },
  { code: "ru-RU", label: "Russian",     flag: "🇷🇺", name: "Russian"     },
  { code: "nl-NL", label: "Dutch",       flag: "🇳🇱", name: "Dutch"       },
  { code: "tr-TR", label: "Turkish",     flag: "🇹🇷", name: "Turkish"     },
  { code: "pl-PL", label: "Polish",      flag: "🇵🇱", name: "Polish"      },
  { code: "th-TH", label: "Thai",        flag: "🇹🇭", name: "Thai"        },
  { code: "vi-VN", label: "Vietnamese",  flag: "🇻🇳", name: "Vietnamese"  },
  { code: "id-ID", label: "Indonesian",  flag: "🇮🇩", name: "Indonesian"  },
  { code: "ms-MY", label: "Malay",       flag: "🇲🇾", name: "Malay"       },
  { code: "tl-PH", label: "Filipino",    flag: "🇵🇭", name: "Filipino"    },
  { code: "uk-UA", label: "Ukrainian",   flag: "🇺🇦", name: "Ukrainian"   },
  { code: "cs-CZ", label: "Czech",       flag: "🇨🇿", name: "Czech"       },
  { code: "ro-RO", label: "Romanian",    flag: "🇷🇴", name: "Romanian"    },
  { code: "hu-HU", label: "Hungarian",   flag: "🇭🇺", name: "Hungarian"   },
  { code: "el-GR", label: "Greek",       flag: "🇬🇷", name: "Greek"       },
  { code: "sv-SE", label: "Swedish",     flag: "🇸🇪", name: "Swedish"     },
  { code: "da-DK", label: "Danish",      flag: "🇩🇰", name: "Danish"      },
  { code: "fi-FI", label: "Finnish",     flag: "🇫🇮", name: "Finnish"     },
  { code: "nb-NO", label: "Norwegian",   flag: "🇳🇴", name: "Norwegian"   },
  { code: "sk-SK", label: "Slovak",      flag: "🇸🇰", name: "Slovak"      },
  { code: "bg-BG", label: "Bulgarian",   flag: "🇧🇬", name: "Bulgarian"   },
  { code: "hr-HR", label: "Croatian",    flag: "🇭🇷", name: "Croatian"    },
  { code: "sr-RS", label: "Serbian",     flag: "🇷🇸", name: "Serbian"     },
  { code: "he-IL", label: "Hebrew",      flag: "🇮🇱", name: "Hebrew"      },
  { code: "fa-IR", label: "Persian",     flag: "🇮🇷", name: "Persian"     },
  { code: "sw-KE", label: "Swahili",     flag: "🇰🇪", name: "Swahili"     },
  { code: "af-ZA", label: "Afrikaans",   flag: "🇿🇦", name: "Afrikaans"   },
  { code: "ca-ES", label: "Catalan",     flag: "🏳️",   name: "Catalan"     },
  { code: "cy-GB", label: "Welsh",       flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", name: "Welsh"       },
  { code: "ka-GE", label: "Georgian",    flag: "🇬🇪", name: "Georgian"    },
  { code: "hy-AM", label: "Armenian",    flag: "🇦🇲", name: "Armenian"    },
  { code: "az-AZ", label: "Azerbaijani", flag: "🇦🇿", name: "Azerbaijani" },
  { code: "kk-KZ", label: "Kazakh",      flag: "🇰🇿", name: "Kazakh"      },
  { code: "uz-UZ", label: "Uzbek",       flag: "🇺🇿", name: "Uzbek"       },
  { code: "sq-AL", label: "Albanian",    flag: "🇦🇱", name: "Albanian"    },
  // ── Indian Languages ───────────────────────────────────────────────────────
  { code: "hi-IN", label: "Hindi",       flag: "🇮🇳", name: "Hindi"       },
  { code: "bn-BD", label: "Bengali",     flag: "🇧🇩", name: "Bengali"     },
  { code: "ta-IN", label: "Tamil",       flag: "🇮🇳", name: "Tamil"       },
  { code: "te-IN", label: "Telugu",      flag: "🇮🇳", name: "Telugu"      },
  { code: "mr-IN", label: "Marathi",     flag: "🇮🇳", name: "Marathi"     },
  { code: "gu-IN", label: "Gujarati",    flag: "🇮🇳", name: "Gujarati"    },
  { code: "kn-IN", label: "Kannada",     flag: "🇮🇳", name: "Kannada"     },
  { code: "ml-IN", label: "Malayalam",   flag: "🇮🇳", name: "Malayalam"   },
  { code: "pa-IN", label: "Punjabi",     flag: "🇮🇳", name: "Punjabi"     },
  { code: "ur-PK", label: "Urdu",        flag: "🇵🇰", name: "Urdu"        },
  { code: "or-IN", label: "Odia",        flag: "🇮🇳", name: "Odia"        },
  { code: "as-IN", label: "Assamese",    flag: "🇮🇳", name: "Assamese"    },
  { code: "ne-NP", label: "Nepali",      flag: "🇳🇵", name: "Nepali"      },
  { code: "si-LK", label: "Sinhala",     flag: "🇱🇰", name: "Sinhala"     },
  { code: "sd-PK", label: "Sindhi",      flag: "🇵🇰", name: "Sindhi"      },
  { code: "mai",   label: "Maithili",    flag: "🇮🇳", name: "Maithili"    },
  { code: "sa-IN", label: "Sanskrit",    flag: "🇮🇳", name: "Sanskrit"    },
];

const QUICK_PHRASES = [
  "Where is the station?",
  "How much is this?",
  "I need help.",
  "Thank you!",
  "Where is the bathroom?",
  "Do you speak English?",
  "Call the police.",
  "I am lost.",
];

type Mode = "speak" | "listen" | "live" | "translate";
type Status = "idle" | "listening" | "processing" | "speaking";

type LiveLine = {
  id: string;
  speaker: "you" | "them";
  original: string;
  translated: string;
  translating: boolean;
  timestamp: number;
  confidence: number;
  saved: boolean;
};

type ConvEntry = {
  id: string;
  speaker: "you" | "them";
  original: string;
  translated: string;
  originalLang: string;
  translatedLang: string;
  timestamp: number;
};

function getApiBase(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:8080/api";
}

async function translateText(
  text: string,
  fromCode: string,
  toCode: string
): Promise<string> {
  const res = await fetch(`${getApiBase()}/ai/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, fromLang: fromCode, toLang: toCode }),
  });
  const data = (await res.json()) as { translation?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Translation failed");
  if (!data.translation) throw new Error("Translation unavailable. Please try again.");
  return data.translation;
}

function speakText(text: string, langCode: string) {
  if (Platform.OS !== "web" || typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  const voices = window.speechSynthesis.getVoices();
  const match =
    voices.find((v) => v.lang === langCode) ||
    voices.find((v) => v.lang.startsWith(langCode.split("-")[0]));
  if (match) utterance.voice = match;
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

// ─── iOS detection ───────────────────────────────────────────────────────────
// On iOS (iPhone/iPad) all browsers use WebKit's SpeechRecognition which breaks
// on the 2nd session. We use MediaRecorder + server-side Whisper instead.
function isIOSBrowser(): boolean {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function getBestMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

async function transcribeAudio(blob: Blob, langCode: string): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "recording.audio");
  form.append("language", langCode.split("-")[0] ?? "");
  const res = await fetch(`${getApiBase()}/ai/transcribe`, { method: "POST", body: form });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Transcription failed");
  return data.text ?? "";
}

// ─── Web Speech API (Android / Desktop only) ─────────────────────────────────
// Single persistent SpeechRecognition instance — creating new ones after the
// first use produces silent zombies on iOS Safari.
let _sharedSR: SpeechRecognition | null = null;

function getSharedRecognition(): SpeechRecognition | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) return null;
  if (!_sharedSR) _sharedSR = new SR();
  return _sharedSR;
}

function startSpeechRecognition(
  langCode: string,
  onResult: (text: string) => void,
  onEnd: () => void,
  onError: (msg: string) => void
): (() => void) | null {
  const recognition = getSharedRecognition();
  if (!recognition) {
    onError("Voice input isn't supported in this browser. Use Chrome on Android or desktop, or type below.");
    return null;
  }

  // Wipe all handlers first, then abort. Any async events from abort fire into null.
  recognition.onstart = null;
  recognition.onresult = null;
  recognition.onend = null;
  recognition.onerror = null;
  try { recognition.abort(); } catch {}

  recognition.lang = langCode;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  // NOTE: callbacks passed here already contain session-ID guards (set in
  // handleMicPress). They will silently no-op if a newer session has started.
  recognition.onresult = (e: SpeechRecognitionEvent) => {
    const text = e.results[0]?.[0]?.transcript ?? "";
    if (text.trim()) onResult(text.trim());
  };
  recognition.onend = onEnd;
  recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
    if (e.error === "aborted") return; // intentional stop
    if (e.error === "no-speech") onError("No speech detected. Try again.");
    else if (e.error === "not-allowed") onError("Microphone access denied. Please allow mic in browser settings.");
    else onError(`Recognition error: ${e.error}`);
  };

  const t = setTimeout(() => {
    try { recognition.start(); } catch { onError("Could not start voice recognition. Tap to try again."); }
  }, 200);

  return () => {
    clearTimeout(t);
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onend = null;
    recognition.onerror = null;
    try { recognition.abort(); } catch {}
  };
}

// ─── Live Captions: separate SR instance (continuous = true) ─────────────────
// Must be separate from _sharedSR because continuous mode conflicts with
// the single-utterance path. A fresh instance is created on each Start.
function createLiveSR(): SpeechRecognition | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  return SR ? new SR() : null;
}

function LangPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: Language;
  onSelect: (l: Language) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Language</Text>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(l) => l.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.langRow, item.code === selected.code && styles.langRowActive]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={styles.langFlag}>{item.flag}</Text>
                <Text style={[styles.langLabel, item.code === selected.code && { color: ACCENT_TRAVEL }]}>
                  {item.label}
                </Text>
                {item.code === selected.code && (
                  <Feather name="check" size={16} color={ACCENT_TRAVEL} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            )}
            style={{ maxHeight: 420 }}
            showsVerticalScrollIndicator={false}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PulsingMic({ status }: { status: Status }) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (status === "listening") {
      scale.value = withRepeat(withTiming(1.18, { duration: 700 }), -1, true);
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [status]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bgColor =
    status === "listening" ? ACCENT_TRAVEL :
    status === "processing" ? Colors.accentSecondary :
    status === "speaking" ? Colors.accentTertiary :
    Colors.card;

  const iconColor = status === "idle" ? Colors.textSecondary : "#fff";

  return (
    <Animated.View style={[styles.micOuter, animStyle]}>
      <View style={[styles.micBtn, { backgroundColor: bgColor }]}>
        <Feather
          name={status === "speaking" ? "volume-2" : "mic"}
          size={36}
          color={iconColor}
        />
      </View>
    </Animated.View>
  );
}

function ConvCard({
  entry,
  onReplay,
  onCopy,
}: {
  entry: ConvEntry;
  onReplay: () => void;
  onCopy: () => void;
}) {
  const isYou = entry.speaker === "you";
  const date = new Date(entry.timestamp);
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <Animated.View entering={FadeInDown} style={[styles.convCard, isYou ? styles.convCardYou : styles.convCardThem]}>
      <View style={styles.convCardHeader}>
        <View style={[styles.speakerBadge, { backgroundColor: isYou ? ACCENT_TRAVEL_DIM : Colors.accentSecondary + "22" }]}>
          <Feather name={isYou ? "user" : "users"} size={10} color={isYou ? ACCENT_TRAVEL : Colors.accentSecondary} />
          <Text style={[styles.speakerLabel, { color: isYou ? ACCENT_TRAVEL : Colors.accentSecondary }]}>
            {isYou ? "You" : "Them"}
          </Text>
        </View>
        <Text style={styles.convTime}>{time}</Text>
      </View>
      <Text style={styles.convOriginal}>{entry.original}</Text>
      <View style={styles.convDivider} />
      <Text style={styles.convTranslated}>{entry.translated}</Text>
      <View style={styles.convActions}>
        <Pressable onPress={onReplay} style={styles.convActionBtn}>
          <Feather name="volume-2" size={13} color={Colors.textTertiary} />
          <Text style={styles.convActionText}>Play</Text>
        </Pressable>
        <Pressable onPress={onCopy} style={styles.convActionBtn}>
          <Feather name="copy" size={13} color={Colors.textTertiary} />
          <Text style={styles.convActionText}>Copy</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function TravelTalkScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const [myLang, setMyLang] = useState<Language>(LANGUAGES[0]!);
  const [theirLang, setTheirLang] = useState<Language>(LANGUAGES[1]!);
  const [mode, setMode] = useState<Mode>("speak");
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [conversation, setConversation] = useState<ConvEntry[]>([]);
  const [showMyPicker, setShowMyPicker] = useState(false);
  const [showTheirPicker, setShowTheirPicker] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [error, setError] = useState("");
  const [typeInput, setTypeInput] = useState("");
  const [typeTranslation, setTypeTranslation] = useState("");
  const [typeLoading, setTypeLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);

  const stopRecognitionRef = useRef<(() => void) | null>(null);
  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);
  // iOS MediaRecorder refs
  const iosRecorderRef = useRef<MediaRecorder | null>(null);
  const iosStreamRef = useRef<MediaStream | null>(null);
  const iosChunksRef = useRef<Blob[]>([]);
  const [onIOS] = useState(() => isIOSBrowser());

  // Live Captions state
  const [liveLines, setLiveLines] = useState<LiveLine[]>([]);
  const [liveRunning, setLiveRunning] = useState(false);
  const [liveInterim, setLiveInterim] = useState("");
  const liveSRRef = useRef<SpeechRecognition | null>(null);
  const liveRunningRef = useRef(false);
  const liveCaptionsScrollRef = useRef<ScrollView>(null);
  // Speaker toggle — mutable ref keeps the SR callback always in sync
  const [liveActiveSpeaker, setLiveActiveSpeaker] = useState<"you" | "them">("you");
  const liveActiveSpeakerRef = useRef<"you" | "them">("you");
  // Auto-speak translated result via TTS
  const [liveAutoSpeak, setLiveAutoSpeak] = useState(false);
  const liveAutoSpeakRef = useRef(false);
  // tgtLang code needed inside SR callback
  const liveTgtLangRef = useRef<Language | null>(null);
  // ID of the most-recently added card (for flash highlight)
  const [liveHighlightId, setLiveHighlightId] = useState<string | null>(null);

  // ─── Session / memory state ───────────────────────────────────────────────
  const [allSessions, setAllSessions] = useState<ConversationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const currentSessionRef = useRef<ConversationSession | null>(null);
  const [subview, setSubview] = useState<"main" | "memory" | "detail">("main");
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);
  const [memorySearch, setMemorySearch] = useState("");
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const clearListenTimeout = () => {
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
  };

  const stopLiveCaptions = useCallback(() => {
    liveRunningRef.current = false;
    setLiveRunning(false);
    setLiveInterim("");
    const sr = liveSRRef.current;
    if (sr) {
      sr.onresult = null;
      sr.onend = null;
      sr.onerror = null;
      try { sr.abort(); } catch {}
      liveSRRef.current = null;
    }
  }, []);

  // On mount: check whether the browser supports Web Speech API.
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
      setSpeechSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    } else {
      setSpeechSupported(false);
    }
  }, []);

  // Stop any active recognition/recording and speech when switching modes.
  useEffect(() => {
    sessionRef.current++; // invalidate all in-flight callbacks immediately
    clearListenTimeout();
    // Web Speech API path
    if (stopRecognitionRef.current) {
      stopRecognitionRef.current();
      stopRecognitionRef.current = null;
    }
    // iOS MediaRecorder path — onstop fires but session check kills it
    if (iosRecorderRef.current) {
      try { iosRecorderRef.current.stop(); } catch {}
      iosRecorderRef.current = null;
    }
    if (iosStreamRef.current) {
      iosStreamRef.current.getTracks().forEach((t) => t.stop());
      iosStreamRef.current = null;
    }
    iosChunksRef.current = [];
    // Live captions path
    stopLiveCaptions();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus("idle");
    setTranscript("");
    setTranslation("");
    setError("");
  }, [mode, stopLiveCaptions]);

  // Derived: which session to show in the detail screen
  const detailSession = useMemo(
    () => allSessions.find((s) => s.id === detailSessionId) ?? null,
    [allSessions, detailSessionId]
  );

  // Load all sessions and create initial session on mount
  useEffect(() => {
    const sessions = loadSessions();
    setAllSessions(sessions);
    setSavedPhrases(loadSavedPhrases());
    const sess = createNewSession(
      LANGUAGES[0]!.label, LANGUAGES[1]!.label,
      LANGUAGES[0]!.code, LANGUAGES[1]!.code,
      "speak"
    );
    currentSessionRef.current = sess;
    setCurrentSession(sess);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save conversation + live lines to active session whenever they change
  useEffect(() => {
    const session = currentSessionRef.current;
    if (!session) return;

    const convMsgs: SessionMessage[] = conversation.map((e) => ({
      id: e.id,
      speaker: e.speaker,
      original: e.original,
      translated: e.translated,
      timestamp: e.timestamp,
      direction: (e.speaker === "you" ? "my-to-their" : "their-to-my") as SessionMessage["direction"],
    }));

    const liveMsgs: SessionMessage[] = liveLines
      .filter((l) => !l.translating && l.translated && !l.translated.startsWith("⚠"))
      .map((l) => ({
        id: l.id,
        speaker: l.speaker,
        original: l.original,
        translated: l.translated,
        timestamp: l.timestamp,
        direction: (l.speaker === "you" ? "my-to-their" : "their-to-my") as SessionMessage["direction"],
        confidence: l.confidence,
      }));

    const allMsgs = [...convMsgs, ...liveMsgs].sort((a, b) => a.timestamp - b.timestamp);
    if (!allMsgs.length && !session.messages.length) return;

    const updated: ConversationSession = {
      ...session,
      messages: allMsgs,
      mode,
      srcLang: myLang.label,
      tgtLang: theirLang.label,
      srcCode: myLang.code,
      tgtCode: theirLang.code,
      updatedAt: Date.now(),
    };
    currentSessionRef.current = updated;
    setCurrentSession(updated);
    upsertSession(updated);
    setAllSessions(loadSessions());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, liveLines]);

  const sourceLang = (mode === "speak" || mode === "translate") ? myLang : theirLang;
  const targetLang = (mode === "speak" || mode === "translate") ? theirLang : myLang;
  const statusLabel =
    status === "listening"
      ? (onIOS ? "Recording… Tap again to stop"
          : mode === "listen" ? "Listening to them…"
          : "Listening…")
      : status === "processing" ? (onIOS ? "Transcribing…" : "Translating…")
      : status === "speaking" ? "Speaking translation…"
      : mode === "listen" ? (onIOS ? "Tap to record them" : "Tap to listen")
      : mode === "translate" ? (onIOS ? "Tap to record" : "Tap to speak — text only")
      : (onIOS ? "Tap to record" : "Tap to speak");

  const handleSwap = () => {
    setMyLang(theirLang);
    setTheirLang(myLang);
    setTranscript("");
    setTranslation("");
    setError("");
    setTypeTranslation("");
  };

  const startLiveCaptions = useCallback((srcLang: Language, tgtLang: Language) => {
    const sr = createLiveSR();
    if (!sr) return;

    // Snapshot tgtLang into ref so onresult callbacks stay in sync with toggle
    liveTgtLangRef.current = tgtLang;
    liveRunningRef.current = true;
    setLiveRunning(true);
    setLiveInterim("");
    liveSRRef.current = sr;

    sr.lang = srcLang.code;
    sr.continuous = true;
    sr.interimResults = true;
    sr.maxAlternatives = 1;

    sr.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result) continue;
        const alt = result[0];
        if (!alt) continue;
        if (result.isFinal) {
          const text = alt.transcript.trim();
          if (!text) continue;
          const lineId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
          const confidence = typeof alt.confidence === "number" ? alt.confidence : 1;
          const speaker = liveActiveSpeakerRef.current;
          const activeTgt = liveTgtLangRef.current ?? tgtLang;
          setLiveLines((prev) => [
            ...prev,
            { id: lineId, speaker, original: text, translated: "", translating: true, timestamp: Date.now(), confidence, saved: false },
          ]);
          setLiveHighlightId(lineId);
          setTimeout(() => setLiveHighlightId(null), 1400);
          setLiveInterim("");
          translateText(text, srcLang.code, activeTgt.code)
            .then((translated) => {
              setLiveLines((prev) =>
                prev.map((l) => (l.id === lineId ? { ...l, translated, translating: false } : l))
              );
              // Auto-speak if enabled
              if (liveAutoSpeakRef.current) speakText(translated, activeTgt.code);
              setTimeout(() => { liveCaptionsScrollRef.current?.scrollToEnd({ animated: true }); }, 80);
            })
            .catch(() => {
              setLiveLines((prev) =>
                prev.map((l) => (l.id === lineId ? { ...l, translated: "⚠ Translation error", translating: false } : l))
              );
            });
          setTimeout(() => { liveCaptionsScrollRef.current?.scrollToEnd({ animated: true }); }, 50);
        } else {
          interim += alt.transcript;
        }
      }
      setLiveInterim(interim);
    };

    sr.onend = () => {
      if (liveRunningRef.current) {
        setTimeout(() => {
          if (liveRunningRef.current && liveSRRef.current) {
            try { liveSRRef.current.start(); } catch {}
          }
        }, 150);
      }
    };

    sr.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "aborted" || e.error === "no-speech") return;
      liveRunningRef.current = false;
      setLiveRunning(false);
    };

    setTimeout(() => {
      if (liveRunningRef.current) {
        try { sr.start(); } catch {}
      }
    }, 100);
  }, []);

  // Shared helper: translate text and update conversation (used by both paths)
  const handleTranscript = useCallback(async (text: string, sid: number) => {
    if (sessionRef.current !== sid) return;
    setTranscript(text);
    setStatus("processing");
    try {
      const result = await translateText(text, sourceLang.code, targetLang.code);
      if (sessionRef.current !== sid) return;
      setTranslation(result);
      if (mode !== "translate") {
        setStatus("speaking");
        speakText(result, targetLang.code);
        const speakMs = Math.max(3000, result.length * 75);
        setTimeout(() => { if (sessionRef.current === sid) setStatus("idle"); }, speakMs);
      } else {
        setStatus("idle");
      }
      setConversation((prev) => [
        {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          speaker: (mode === "speak" || mode === "translate" ? "you" : "them") as "you" | "them",
          original: text,
          translated: result,
          originalLang: sourceLang.label,
          translatedLang: targetLang.label,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 30));
    } catch (err) {
      if (sessionRef.current !== sid) return;
      setError(err instanceof Error ? err.message : "Translation failed");
      setStatus("idle");
    }
  }, [sourceLang, targetLang, mode]);

  const handleMicPress = useCallback(async () => {
    setError("");
    if (status === "processing" || status === "speaking") return;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // ── iOS path: MediaRecorder push-to-talk ─────────────────────────────────
    if (onIOS) {
      if (status === "listening") {
        // Second tap: stop recording — onstop will transcribe
        sessionRef.current++;
        const sid = sessionRef.current;
        const recorder = iosRecorderRef.current;
        const stream = iosStreamRef.current;
        const chunks = [...iosChunksRef.current];
        iosRecorderRef.current = null;
        iosStreamRef.current = null;
        iosChunksRef.current = [];
        setStatus("processing");
        try { recorder?.stop(); } catch {}
        // Stop tracks immediately
        stream?.getTracks().forEach((t) => t.stop());
        // Wait 500 ms before transcribing (lets audio flush)
        await new Promise<void>((r) => setTimeout(r, 500));
        if (sessionRef.current !== sid) return;
        if (!chunks.length) {
          setError("No audio captured. Tap and speak, then tap again to stop.");
          setStatus("idle");
          return;
        }
        const mimeType = chunks[0]?.type || getBestMimeType();
        const blob = new Blob(chunks, { type: mimeType });
        try {
          const text = await transcribeAudio(blob, sourceLang.code);
          if (sessionRef.current !== sid) return;
          if (!text.trim()) {
            setError("No speech detected. Tap the mic and try again.");
            setStatus("idle");
            return;
          }
          await handleTranscript(text.trim(), sid);
        } catch (err) {
          if (sessionRef.current !== sid) return;
          setError(err instanceof Error ? err.message : "Transcription failed");
          setStatus("idle");
        }
        return;
      }

      // First tap: start recording
      const mimeType = getBestMimeType();
      if (!mimeType) {
        setError("Audio recording is not supported in this browser.");
        return;
      }
      const sid = ++sessionRef.current;
      setTranscript("");
      setTranslation("");
      setStatus("listening");
      try {
        // Fresh getUserMedia every turn (user's spec)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (sessionRef.current !== sid) { stream.getTracks().forEach((t) => t.stop()); return; }
        iosStreamRef.current = stream;
        iosChunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType });
        iosRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => { if (e.data.size > 0) iosChunksRef.current.push(e.data); };
        recorder.start(250);
      } catch {
        if (sessionRef.current !== sid) return;
        setStatus("idle");
        setError("Microphone access denied. Please allow mic and try again.");
      }
      return;
    }

    // ── Android / Desktop path: Web Speech API ───────────────────────────────
    if (status === "listening") {
      sessionRef.current++;
      clearListenTimeout();
      stopRecognitionRef.current?.();
      stopRecognitionRef.current = null;
      setStatus("idle");
      return;
    }

    const sid = ++sessionRef.current;
    setTranscript("");
    setTranslation("");
    setStatus("listening");

    listenTimeoutRef.current = setTimeout(() => {
      listenTimeoutRef.current = null;
      if (sessionRef.current !== sid) return;
      sessionRef.current++;
      stopRecognitionRef.current?.();
      stopRecognitionRef.current = null;
      setStatus((prev) => {
        if (prev === "listening") { setError("No speech detected. Tap the mic and try again."); return "idle"; }
        return prev;
      });
    }, 15000);

    const stop = startSpeechRecognition(
      sourceLang.code,
      async (text) => {
        if (sessionRef.current !== sid) return;
        clearListenTimeout();
        await handleTranscript(text, sid);
      },
      () => {
        if (sessionRef.current !== sid) return;
        clearListenTimeout();
        setStatus((prev) => (prev === "listening" ? "idle" : prev));
      },
      (msg) => {
        if (sessionRef.current !== sid) return;
        clearListenTimeout();
        setError(msg);
        setStatus("idle");
      }
    );
    stopRecognitionRef.current = stop;
  }, [status, sourceLang, targetLang, mode, onIOS, handleTranscript]);

  const handleSpeak = () => {
    if (!translation) return;
    setStatus("speaking");
    speakText(translation, targetLang.code);
    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleQuickPhrase = async (phrase: string) => {
    setError("");
    setTranscript(phrase);
    setTranslation("");
    setStatus("processing");
    try {
      const result = await translateText(phrase, myLang.code, theirLang.code);
      setTranslation(result);
      setStatus("speaking");
      speakText(result, theirLang.code);
      const speakMs = Math.max(3000, result.length * 75);
      setTimeout(() => setStatus("idle"), speakMs);
      const entry: ConvEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        speaker: "you",
        original: phrase,
        translated: result,
        originalLang: myLang.label,
        translatedLang: theirLang.label,
        timestamp: Date.now(),
      };
      setConversation((prev) => [entry, ...prev].slice(0, 30));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
      setStatus("idle");
    }
  };

  const handleCopyConv = (entry: ConvEntry) => {
    const text = `${entry.original}\n→ ${entry.translated}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const handleReplayConv = (entry: ConvEntry) => {
    speakText(entry.translated, entry.speaker === "you" ? theirLang.code : myLang.code);
  };

  const handleClearConv = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Clear all conversation history?")) setConversation([]);
    } else {
      Alert.alert("Clear", "Clear conversation history?", [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => setConversation([]) },
      ]);
    }
  };

  // ── Live conversation handlers ─────────────────────────────────────────────
  const handleLiveReplay = useCallback((line: LiveLine) => {
    if (!line.translated) return;
    const lang = line.speaker === "you" ? theirLang.code : myLang.code;
    speakText(line.translated, lang);
  }, [myLang, theirLang]);

  const handleLiveSavePhrase = useCallback((lineId: string) => {
    setLiveLines((prev) => prev.map((l) => l.id === lineId ? { ...l, saved: !l.saved } : l));
  }, []);

  const handleLiveExport = useCallback(() => {
    if (!liveLines.length) return;
    const header = `Live Conversation — ${myLang.label} ↔ ${theirLang.label}\n${new Date().toLocaleString()}\n${"─".repeat(50)}\n\n`;
    const body = liveLines.map((l) => {
      const time = new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const who = l.speaker === "you" ? "You" : "Other Person";
      return `[${time}] ${who}\n${l.original}\n→ ${l.translated}`;
    }).join("\n\n");
    const text = header + body;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    // Also trigger a download
    if (typeof document !== "undefined") {
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `live-conversation-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [liveLines, myLang, theirLang]);

  const handleLiveSpeakerToggle = useCallback(() => {
    setLiveActiveSpeaker((prev) => {
      const next = prev === "you" ? "them" : "you";
      liveActiveSpeakerRef.current = next;
      return next;
    });
  }, []);

  const handleLiveAutoSpeakToggle = useCallback(() => {
    setLiveAutoSpeak((prev) => {
      const next = !prev;
      liveAutoSpeakRef.current = next;
      return next;
    });
  }, []);

  const handleLiveClear = useCallback(() => {
    setLiveLines([]);
    setLiveInterim("");
  }, []);

  const handleLiveToggle = useCallback(() => {
    if (liveRunning) {
      stopLiveCaptions();
    } else {
      // Update tgtLang ref before starting (handles language changes between sessions)
      liveTgtLangRef.current = theirLang;
      startLiveCaptions(myLang, theirLang);
    }
  }, [liveRunning, myLang, theirLang, startLiveCaptions, stopLiveCaptions]);

  // ─── Session management handlers ─────────────────────────────────────────
  const handleNewSession = useCallback(() => {
    const sess = createNewSession(
      myLang.label, theirLang.label,
      myLang.code, theirLang.code,
      mode
    );
    currentSessionRef.current = sess;
    setCurrentSession(sess);
    setAllSessions(loadSessions());
    setConversation([]);
    setLiveLines([]);
    setTranscript("");
    setTranslation("");
    setLiveInterim("");
    setTypeTranslation("");
    setError("");
  }, [myLang, theirLang, mode]);

  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(id);
    setAllSessions(loadSessions());
    setDetailSessionId((prev) => {
      if (prev === id) { setSubview("memory"); return null; }
      return prev;
    });
  }, []);

  const handleRenameSession = useCallback((id: string) => {
    const title = typeof window !== "undefined" ? window.prompt("Rename conversation:") : null;
    if (title?.trim()) {
      renameSession(id, title.trim());
      setAllSessions(loadSessions());
      if (currentSessionRef.current?.id === id) {
        const t = title.trim();
        setCurrentSession((prev) => prev ? { ...prev, title: t } : prev);
        if (currentSessionRef.current) currentSessionRef.current.title = t;
      }
    }
  }, []);

  const handleOpenDetail = useCallback((id: string) => {
    setDetailSessionId(id);
    setInsightsError("");
    setSubview("detail");
  }, []);

  const handleExportSession = useCallback((session: ConversationSession) => {
    const text = exportSessionText(session);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    if (typeof document !== "undefined") {
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `travel-talk-${session.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleGenerateInsights = useCallback(async (session: ConversationSession) => {
    if (!session.messages.length) return;
    setInsightsLoading(true);
    setInsightsError("");
    try {
      const res = await fetch(`${getApiBase()}/ai/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: session.messages,
          srcLang: session.srcLang,
          tgtLang: session.tgtLang,
        }),
      });
      const data = await res.json() as { summary?: string; keyPhrases?: string[]; topic?: string; totalExchanges?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Insights failed");
      const insights = {
        summary: data.summary ?? "",
        keyPhrases: data.keyPhrases ?? [],
        topic: data.topic ?? "Travel",
        totalExchanges: data.totalExchanges ?? 0,
      };
      setSessionInsights(session.id, insights);
      setAllSessions(loadSessions());
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const handleSavePhrase = useCallback((msg: SessionMessage, srcLang: string, tgtLang: string) => {
    const phrase: SavedPhrase = {
      id: msg.id + "_phrase",
      original: msg.original,
      translated: msg.translated,
      srcLang,
      tgtLang,
      createdAt: Date.now(),
    };
    upsertPhrase(phrase);
    setSavedPhrases(loadSavedPhrases());
  }, []);

  const handleDeletePhrase = useCallback((phraseId: string) => {
    deletePhrase(phraseId);
    setSavedPhrases(loadSavedPhrases());
  }, []);

  const handlePinSession = useCallback((id: string, isPinned: boolean) => {
    pinSession(id, !isPinned);
    setAllSessions(loadSessions());
  }, []);

  const handleTypeTranslate = async () => {
    const text = typeInput.trim();
    if (!text || typeLoading) return;
    setTypeLoading(true);
    setTypeTranslation("");
    try {
      const result = await translateText(text, myLang.code, theirLang.code);
      setTypeTranslation(result);
      speakText(result, theirLang.code);
      const entry: ConvEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        speaker: "you",
        original: text,
        translated: result,
        originalLang: myLang.label,
        translatedLang: theirLang.label,
        timestamp: Date.now(),
      };
      setConversation((prev) => [entry, ...prev].slice(0, 30));
    } catch (err) {
      setTypeTranslation("⚠ " + (err instanceof Error ? err.message : "Translation failed"));
    } finally {
      setTypeLoading(false);
    }
  };

  const resizeImageForOcr = (file: File, maxDim = 1280): Promise<{ base64: string; mimeType: string }> =>
    new Promise((resolve, reject) => {
      const img = new (window as any).Image() as HTMLImageElement;
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve({ base64: dataUrl.split(",")[1] ?? "", mimeType: "image/jpeg" });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not load image")); };
      img.src = url;
    });

  const handleOcrCapture = async (file: File) => {
    setOcrLoading(true);
    setOcrError("");
    try {
      const { base64, mimeType } = await resizeImageForOcr(file);
      const res = await fetch(`${getApiBase()}/ocr-translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          targetLang: theirLang.code,
          targetLangName: theirLang.label,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? `Server error ${res.status}`);
      }
      const data = await res.json() as { extractedText: string; translatedText: string };
      if (!data.extractedText && !data.translatedText) {
        throw new Error("No text found in image — try a clearer photo");
      }
      const ocrEntry: ConvEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        speaker: "you",
        original: data.extractedText ?? "",
        translated: data.translatedText ?? "",
        originalLang: myLang.label,
        translatedLang: theirLang.label,
        timestamp: Date.now(),
      };
      setConversation((prev) => [ocrEntry, ...prev].slice(0, 30));
      setTypeInput(data.extractedText ?? "");
      setTypeTranslation(data.translatedText ?? "");
      if (data.translatedText) speakText(data.translatedText, theirLang.code);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : "OCR failed — try a clearer photo");
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {subview === "memory" && (
        <MemoryScreen
          sessions={allSessions}
          searchQuery={memorySearch}
          onSearch={setMemorySearch}
          onOpen={handleOpenDetail}
          onDelete={handleDeleteSession}
          onRename={handleRenameSession}
          onExport={handleExportSession}
          onPin={handlePinSession}
          onBack={() => setSubview("main")}
          topPad={topPad}
        />
      )}
      {subview === "detail" && !!detailSession && (
        <DetailScreen
          session={detailSession}
          savedPhrases={savedPhrases}
          onBack={() => setSubview("memory")}
          onDelete={handleDeleteSession}
          onExport={handleExportSession}
          onGenerateInsights={handleGenerateInsights}
          onSavePhrase={handleSavePhrase}
          onDeleteSavedPhrase={handleDeletePhrase}
          insightsLoading={insightsLoading}
          insightsError={insightsError}
          topPad={topPad}
          speakFn={speakText}
          srcCode={detailSession.srcCode}
          tgtCode={detailSession.tgtCode}
        />
      )}
      {subview === "main" && (<>
      <LangPickerModal
        visible={showMyPicker}
        selected={myLang}
        onSelect={setMyLang}
        onClose={() => setShowMyPicker(false)}
      />
      <LangPickerModal
        visible={showTheirPicker}
        selected={theirLang}
        onSelect={setTheirLang}
        onClose={() => setShowTheirPicker(false)}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Travel Talk</Text>
            <Text style={styles.subtitle}>Speak naturally. Let AI bridge the language.</Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: ACCENT_TRAVEL_DIM, borderColor: ACCENT_TRAVEL_BORDER }]}>
            <Feather name="globe" size={16} color={ACCENT_TRAVEL} />
          </View>
        </View>

        {/* How to use note */}
        <View style={styles.howItWorksCard}>
          <View style={styles.howItWorksRow}>
            <Feather name="info" size={13} color={ACCENT_TRAVEL} style={{ marginTop: 1 }} />
            <Text style={styles.howItWorksText}>
              <Text style={styles.howItWorksBold}>How to use:{"\n"}</Text>
              {"\n"}{"🎤  "}
              <Text style={styles.howItWorksBold}>Speak</Text> — tap the mic, say something in your language, and the translation appears instantly.{"\n\n"}
              {"⌨️  "}
              <Text style={styles.howItWorksBold}>Type</Text> — type any phrase and tap Translate.{"\n\n"}
              {"📷  "}
              <Text style={styles.howItWorksBold}>Scan</Text> — point your camera at a sign, menu, or document to get an instant translation.{"\n\n"}
              Conversations are auto-saved so you can review them later under Saved.
            </Text>
          </View>
        </View>

        {/* Language selector */}
        <View style={styles.langSelector}>
          <Pressable style={styles.langBtn} onPress={() => setShowMyPicker(true)}>
            <Text style={styles.langFlag}>{myLang.flag}</Text>
            <View>
              <Text style={styles.langBtnLabel}>My Language</Text>
              <Text style={styles.langBtnValue}>{myLang.label}</Text>
            </View>
            <Feather name="chevron-down" size={14} color={Colors.textTertiary} style={{ marginLeft: "auto" }} />
          </Pressable>

          <Pressable onPress={handleSwap} style={styles.swapBtn}>
            <Feather name="repeat" size={18} color={ACCENT_TRAVEL} />
          </Pressable>

          <Pressable style={styles.langBtn} onPress={() => setShowTheirPicker(true)}>
            <Text style={styles.langFlag}>{theirLang.flag}</Text>
            <View>
              <Text style={styles.langBtnLabel}>Their Language</Text>
              <Text style={styles.langBtnValue}>{theirLang.label}</Text>
            </View>
            <Feather name="chevron-down" size={14} color={Colors.textTertiary} style={{ marginLeft: "auto" }} />
          </Pressable>
        </View>

        {/* Session bar */}
        <View style={styles.sessionBar}>
          <View style={styles.sessionInfo}>
            <View style={[styles.sessionDot, { backgroundColor: ACCENT_TRAVEL }]} />
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {currentSession?.title ?? "New Session"}
            </Text>
          </View>
          <View style={styles.sessionActions}>
            <Pressable style={styles.sessionBtn} onPress={handleNewSession}>
              <Feather name="plus-circle" size={12} color={Colors.textTertiary} />
              <Text style={styles.sessionBtnText}>New</Text>
            </Pressable>
            <Pressable
              style={[styles.sessionBtn, { borderColor: ACCENT_TRAVEL_BORDER }]}
              onPress={() => { setMemorySearch(""); setSubview("memory"); }}
            >
              <Feather name="archive" size={12} color={ACCENT_TRAVEL} />
              <Text style={[styles.sessionBtnText, { color: ACCENT_TRAVEL }]}>
                {allSessions.filter((s) => s.messages.length > 0).length} saved
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeBtn, mode === "speak" && { backgroundColor: ACCENT_TRAVEL_DIM, borderColor: ACCENT_TRAVEL }]}
            onPress={() => { setMode("speak"); setTranscript(""); setTranslation(""); setError(""); }}
          >
            <Feather name="mic" size={14} color={mode === "speak" ? ACCENT_TRAVEL : Colors.textSecondary} />
            <Text style={[styles.modeBtnText, mode === "speak" && { color: ACCENT_TRAVEL }]}>Speak Out</Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === "listen" && { backgroundColor: Colors.accentSecondary + "22", borderColor: Colors.accentSecondary }]}
            onPress={() => { setMode("listen"); setTranscript(""); setTranslation(""); setError(""); }}
          >
            <Feather name="headphones" size={14} color={mode === "listen" ? Colors.accentSecondary : Colors.textSecondary} />
            <Text style={[styles.modeBtnText, mode === "listen" && { color: Colors.accentSecondary }]}>Listen Back</Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === "live" && { backgroundColor: "#7C3AED22", borderColor: "#7C3AED" }]}
            onPress={() => { setMode("live"); setTranscript(""); setTranslation(""); setError(""); }}
          >
            <Feather name="radio" size={14} color={mode === "live" ? "#A78BFA" : Colors.textSecondary} />
            <Text style={[styles.modeBtnText, mode === "live" && { color: "#A78BFA" }]}>Live</Text>
          </Pressable>
        </View>

        {/* Quick Translate — full-width 4th mode button */}
        <Pressable
          style={[styles.quickTranslateBtn, mode === "translate" && styles.quickTranslateBtnActive]}
          onPress={() => { setMode("translate"); setTranscript(""); setTranslation(""); setError(""); }}
        >
          <View style={styles.quickTranslateBtnLeft}>
            <Feather name="type" size={16} color={mode === "translate" ? "#00D4FF" : Colors.textSecondary} />
            <View>
              <Text style={[styles.quickTranslateBtnTitle, mode === "translate" && { color: "#00D4FF" }]}>
                Quick Translate
              </Text>
              <Text style={styles.quickTranslateBtnHint}>
                Speak any language · 60+ supported · Text only, no playback
              </Text>
            </View>
          </View>
          {mode === "translate" ? (
            <View style={styles.quickTranslateActiveChip}>
              <Text style={styles.quickTranslateActiveText}>ACTIVE</Text>
            </View>
          ) : (
            <Feather name="chevron-right" size={14} color={Colors.textTertiary} />
          )}
        </Pressable>

        {/* Live Conversation — only shown in live mode */}
        {mode === "live" && (
          <Animated.View entering={FadeInDown} style={styles.livePanel}>

            {/* ─ Header ─────────────────────────────────────────────────────── */}
            <View style={styles.liveHeader}>
              <View style={styles.liveTitleRow}>
                <View style={[styles.liveDot, liveRunning && styles.liveDotActive]} />
                <Text style={styles.liveTitle}>Live Conversation</Text>
                <Text style={styles.liveCount}>{liveLines.length > 0 ? `${liveLines.length} messages` : ""}</Text>
              </View>
              <View style={styles.liveHeaderActions}>
                {/* Auto-speak toggle */}
                <Pressable
                  style={[styles.liveToggleChip, liveAutoSpeak && styles.liveToggleChipActive]}
                  onPress={handleLiveAutoSpeakToggle}
                >
                  <Feather name="volume-2" size={11} color={liveAutoSpeak ? "#A78BFA" : Colors.textTertiary} />
                  <Text style={[styles.liveToggleChipText, liveAutoSpeak && { color: "#A78BFA" }]}>
                    Auto-speak
                  </Text>
                </Pressable>
                {/* Export */}
                <Pressable
                  style={[styles.liveToggleChip, !liveLines.length && { opacity: 0.35 }]}
                  onPress={handleLiveExport}
                  disabled={!liveLines.length}
                >
                  <Feather name="download" size={11} color={Colors.textTertiary} />
                  <Text style={styles.liveToggleChipText}>Export</Text>
                </Pressable>
              </View>
              <Text style={styles.liveSubtitle}>
                {myLang.flag} {myLang.label} → {theirLang.flag} {theirLang.label}
              </Text>
            </View>

            {/* ─ Speaker toggle bar ─────────────────────────────────────────── */}
            <View style={styles.liveSpeakerBar}>
              <Text style={styles.liveSpeakerLabel}>Speaking as:</Text>
              <Pressable style={styles.liveSpeakerToggle} onPress={handleLiveSpeakerToggle}>
                <View style={[styles.liveSpeakerPill, liveActiveSpeaker === "you" && styles.liveSpeakerPillYouActive]}>
                  <Feather name="user" size={11} color={liveActiveSpeaker === "you" ? "#A78BFA" : Colors.textTertiary} />
                  <Text style={[styles.liveSpeakerPillText, liveActiveSpeaker === "you" && { color: "#A78BFA" }]}>You</Text>
                </View>
                <Feather name="repeat" size={12} color={Colors.textTertiary} />
                <View style={[styles.liveSpeakerPill, liveActiveSpeaker === "them" && styles.liveSpeakerPillThemActive]}>
                  <Feather name="users" size={11} color={liveActiveSpeaker === "them" ? ACCENT_TRAVEL : Colors.textTertiary} />
                  <Text style={[styles.liveSpeakerPillText, liveActiveSpeaker === "them" && { color: ACCENT_TRAVEL }]}>Other Person</Text>
                </View>
              </Pressable>
            </View>

            {/* ─ Chat feed ──────────────────────────────────────────────────── */}
            <ScrollView
              ref={liveCaptionsScrollRef}
              style={styles.liveCaptionsScroll}
              contentContainerStyle={styles.liveCaptionsContent}
              showsVerticalScrollIndicator={false}
            >
              {liveLines.length === 0 && !liveInterim && (
                <View style={styles.liveEmpty}>
                  <Feather name="message-circle" size={32} color="#7C3AED44" />
                  <Text style={styles.liveEmptyText}>
                    {liveRunning
                      ? `Listening as "${liveActiveSpeaker === "you" ? "You" : "Other Person"}"…\nSpeak clearly`
                      : "Tap Start — then speak.\nToggle who is speaking above."}
                  </Text>
                </View>
              )}

              {liveLines.map((line) => {
                const isYou = line.speaker === "you";
                const isHighlighted = liveHighlightId === line.id;
                const time = new Date(line.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const lowConfidence = line.confidence > 0 && line.confidence < 0.7;
                return (
                  <Animated.View
                    key={line.id}
                    entering={FadeInDown.duration(300)}
                    style={[
                      styles.liveChatCard,
                      isYou ? styles.liveChatCardYou : styles.liveChatCardThem,
                      isHighlighted && styles.liveChatCardHighlight,
                    ]}
                  >
                    {/* Speaker + time */}
                    <View style={styles.liveChatMeta}>
                      <View style={styles.liveChatSpeakerRow}>
                        <Feather
                          name={isYou ? "user" : "users"}
                          size={10}
                          color={isYou ? "#A78BFA" : ACCENT_TRAVEL}
                        />
                        <Text style={[styles.liveChatSpeakerText, { color: isYou ? "#A78BFA" : ACCENT_TRAVEL }]}>
                          {isYou ? "You" : "Other Person"}
                        </Text>
                        {lowConfidence && (
                          <View style={styles.liveConfidenceBadge}>
                            <Text style={styles.liveConfidenceText}>low confidence</Text>
                          </View>
                        )}
                        {line.saved && (
                          <Feather name="star" size={10} color="#F59E0B" />
                        )}
                      </View>
                      <Text style={styles.liveChatTime}>{time}</Text>
                    </View>

                    {/* Original */}
                    <Text style={styles.liveChatOriginal}>{line.original}</Text>

                    {/* Translation */}
                    {line.translating ? (
                      <Text style={styles.liveChatTranslating}>translating…</Text>
                    ) : (
                      <Text style={[styles.liveChatTranslated, { color: isYou ? "#C4B5FD" : "#6EE7B7" }]}>
                        → {line.translated}
                      </Text>
                    )}

                    {/* Per-card actions */}
                    {!line.translating && (
                      <View style={styles.liveChatActions}>
                        <Pressable style={styles.liveChatActionBtn} onPress={() => handleLiveReplay(line)}>
                          <Feather name="volume-2" size={12} color={Colors.textTertiary} />
                          <Text style={styles.liveChatActionText}>Replay</Text>
                        </Pressable>
                        <Pressable style={styles.liveChatActionBtn} onPress={() => handleLiveSavePhrase(line.id)}>
                          <Feather name={line.saved ? "star" : "bookmark"} size={12} color={line.saved ? "#F59E0B" : Colors.textTertiary} />
                          <Text style={[styles.liveChatActionText, line.saved && { color: "#F59E0B" }]}>
                            {line.saved ? "Saved" : "Save"}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </Animated.View>
                );
              })}

              {/* Interim text (what you're saying right now) */}
              {!!liveInterim && (
                <View style={[styles.liveInterimBlock, { borderColor: liveActiveSpeaker === "you" ? "#7C3AED44" : ACCENT_TRAVEL_BORDER }]}>
                  <Text style={[styles.liveInterimSpeaker, { color: liveActiveSpeaker === "you" ? "#A78BFA" : ACCENT_TRAVEL }]}>
                    {liveActiveSpeaker === "you" ? "You" : "Other Person"} is speaking…
                  </Text>
                  <Text style={styles.liveInterimText}>{liveInterim}</Text>
                </View>
              )}
            </ScrollView>

            {/* Not supported notice */}
            {!speechSupported && (
              <View style={styles.liveUnsupported}>
                <Feather name="info" size={13} color={Colors.textSecondary} />
                <Text style={styles.liveUnsupportedText}>
                  Live mode requires Chrome on Android or desktop.
                </Text>
              </View>
            )}

            {/* ─ Controls ───────────────────────────────────────────────────── */}
            <View style={styles.liveControls}>
              <Pressable
                style={[styles.liveStartBtn, liveRunning && styles.liveStopBtn, !speechSupported && { opacity: 0.4 }]}
                disabled={!speechSupported}
                onPress={handleLiveToggle}
              >
                <Feather name={liveRunning ? "square" : "play"} size={15} color="#fff" />
                <Text style={styles.liveStartBtnText}>{liveRunning ? "Stop" : "Start"}</Text>
              </Pressable>
              <Pressable style={styles.liveClearBtn} onPress={handleLiveClear}>
                <Feather name="trash-2" size={14} color={Colors.textSecondary} />
                <Text style={styles.liveClearBtnText}>Clear</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Main interaction card */}
        {(mode === "speak" || mode === "listen" || mode === "translate") && (
        <View style={styles.interactCard}>
          <Text style={styles.modeContext}>
            {(mode === "speak" || mode === "translate")
              ? `${myLang.flag} ${myLang.label} → ${theirLang.flag} ${theirLang.label}`
              : `${theirLang.flag} ${theirLang.label} → ${myLang.flag} ${myLang.label}`}
          </Text>
          {mode === "translate" && (
            <View style={styles.translateTextOnlyBadge}>
              <Feather name="eye-off" size={10} color="#00D4FF" />
              <Text style={styles.translateTextOnlyText}>Text only · No audio playback</Text>
            </View>
          )}

          {/* Mic button */}
          <Pressable
            onPress={handleMicPress}
            style={[styles.micWrapper, !speechSupported && { opacity: 0.35 }]}
            disabled={status === "processing" || !speechSupported}
          >
            <PulsingMic status={status} />
          </Pressable>

          {/* Status */}
          <Text style={[styles.statusText, status === "listening" && { color: ACCENT_TRAVEL }, status === "processing" && { color: Colors.accentSecondary }]}>
            {speechSupported ? statusLabel : "Voice not supported"}
          </Text>

          {/* iOS / unsupported browser notice */}
          {!speechSupported && (
            <Animated.View entering={FadeInUp} style={styles.noSpeechBanner}>
              <Feather name="info" size={13} color={Colors.textSecondary} />
              <Text style={styles.noSpeechText}>
                Voice input requires Chrome on Android or desktop.{"\n"}Use <Text style={{ color: ACCENT_TRAVEL, fontWeight: "700" }}>Type to Translate</Text> below — it works on all devices.
              </Text>
            </Animated.View>
          )}

          {/* Error */}
          {!!error && (
            <Animated.View entering={FadeInUp} style={styles.errorBox}>
              <Feather name="alert-circle" size={13} color={Colors.accentSecondary} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Result area */}
          {!!transcript && (
            <Animated.View entering={FadeInDown} style={styles.resultArea}>
              <View style={styles.resultRow}>
                <View style={styles.resultLangTag}>
                  <Text style={styles.resultLangText}>{sourceLang.flag} Original</Text>
                </View>
              </View>
              <Text style={styles.transcriptText}>{transcript}</Text>

              {!!translation && (
                <Animated.View entering={FadeInDown} style={styles.translationCard}>
                  <View style={styles.translationCardHeader}>
                    <View style={[styles.resultLangTag, { backgroundColor: ACCENT_TRAVEL_DIM, borderColor: ACCENT_TRAVEL_BORDER }]}>
                      <Text style={[styles.resultLangText, { color: ACCENT_TRAVEL }]}>
                        {targetLang.flag} {targetLang.label}
                      </Text>
                    </View>
                    <View style={styles.showToThemBadge}>
                      <Feather name={mode === "translate" ? "eye-off" : "eye"} size={11} color={mode === "translate" ? "#00D4FF" : ACCENT_TRAVEL} />
                      <Text style={[styles.showToThemText, mode === "translate" && { color: "#00D4FF" }]}>
                        {mode === "speak" ? "Show to them" : mode === "translate" ? "Translation" : "Your translation"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.translationTextLarge}>{translation}</Text>
                  {mode !== "translate" && (
                    <Pressable onPress={handleSpeak} style={styles.speakBtn}>
                      <Feather name="volume-2" size={15} color="#fff" />
                      <Text style={styles.speakBtnText}>Speak Again</Text>
                    </Pressable>
                  )}
                </Animated.View>
              )}
            </Animated.View>
          )}

          {status === "processing" && !translation && (
            <View style={styles.processingRow}>
              <Feather name="loader" size={14} color={Colors.accentSecondary} />
              <Text style={styles.processingText}>Translating…</Text>
            </View>
          )}
        </View>
        )}

        {/* Other options for translation */}
        <View style={styles.otherOptionsHeader}>
          <Feather name="layers" size={13} color={ACCENT_TRAVEL} />
          <Text style={styles.otherOptionsLabel}>Other options for translation</Text>
        </View>

        {/* Type to Translate */}
        <View style={styles.typeSection}>
          <View style={styles.typeSectionHeader}>
            <Feather name="edit-3" size={13} color={ACCENT_TRAVEL} />
            <Text style={styles.typeSectionLabel}>Type to Translate</Text>
            {Platform.OS === "web" && (
              <Pressable
                style={[styles.ocrCameraBtn, ocrLoading && { opacity: 0.5 }]}
                onPress={() => {
                  if (typeof document === "undefined" || ocrLoading) return;
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.capture = "environment";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleOcrCapture(file);
                  };
                  input.click();
                }}
                disabled={ocrLoading}
              >
                <Feather name={ocrLoading ? "loader" : "camera"} size={13} color={ACCENT_TRAVEL} />
                <Text style={styles.ocrCameraBtnText}>{ocrLoading ? "Scanning…" : "Scan Image"}</Text>
              </Pressable>
            )}
          </View>
          {!!ocrError && (
            <Text style={styles.ocrErrorText}>{ocrError}</Text>
          )}
          <View style={styles.typeInputRow}>
            <TextInput
              style={styles.typeInput}
              placeholder={`Type in ${myLang.label}…`}
              placeholderTextColor={Colors.textTertiary}
              value={typeInput}
              onChangeText={(t) => { setTypeInput(t); setTypeTranslation(""); }}
              onSubmitEditing={handleTypeTranslate}
              returnKeyType="send"
              multiline={false}
              editable={!typeLoading}
              // @ts-ignore – web-only: hints Gboard/Chrome to offer the right keyboard
              lang={myLang.code.split("-")[0]}
            />
            <Pressable
              style={[styles.typeBtn, (!typeInput.trim() || typeLoading) && { opacity: 0.4 }]}
              onPress={handleTypeTranslate}
              disabled={!typeInput.trim() || typeLoading}
            >
              <Feather name={typeLoading ? "loader" : "send"} size={16} color="#fff" />
            </Pressable>
          </View>
          {myLang.code !== "en-US" && (
            <View style={styles.keyboardHintRow}>
              <Feather name="info" size={11} color={Colors.textTertiary} />
              <Text style={styles.keyboardHintText}>
                Switch your device keyboard to <Text style={{ color: Colors.textSecondary }}>{myLang.label}</Text> to type natively.
                {" "}On Android, Gboard may switch automatically.
                {" "}On iPhone, use the 🌐 globe key on your keyboard.
              </Text>
            </View>
          )}
          {!!typeTranslation && (
            <Animated.View entering={FadeInDown} style={styles.typeResult}>
              <View style={styles.typeResultHeader}>
                <Text style={styles.typeResultLang}>{theirLang.flag} {theirLang.label}</Text>
                <View style={styles.showToThemBadge}>
                  <Feather name="eye" size={11} color={ACCENT_TRAVEL} />
                  <Text style={styles.showToThemText}>Show to them</Text>
                </View>
              </View>
              <Text style={styles.translationTextLarge}>{typeTranslation}</Text>
              <Pressable onPress={() => speakText(typeTranslation, theirLang.code)} style={styles.typeSpeakBtn}>
                <Feather name="volume-2" size={14} color={ACCENT_TRAVEL} />
                <Text style={styles.typeSpeakBtnText}>Speak Again</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>

        {/* Quick phrases */}
        <Pressable
          style={styles.phrasesToggle}
          onPress={() => setShowPhrases((p) => !p)}
        >
          <Feather name="bookmark" size={14} color={ACCENT_TRAVEL} />
          <Text style={styles.phrasesToggleText}>Quick Travel Phrases</Text>
          <Feather name={showPhrases ? "chevron-up" : "chevron-down"} size={14} color={Colors.textTertiary} style={{ marginLeft: "auto" }} />
        </Pressable>

        {showPhrases && (
          <Animated.View entering={FadeInDown} style={styles.phrasesGrid}>
            {QUICK_PHRASES.map((p) => (
              <Pressable key={p} style={styles.phraseChip} onPress={() => handleQuickPhrase(p)}>
                <Text style={styles.phraseText}>{p}</Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Conversation history */}
        {conversation.length > 0 && (
          <View style={styles.convSection}>
            <View style={styles.convHeader}>
              <Text style={styles.convTitle}>Conversation</Text>
              <Pressable onPress={handleClearConv} style={styles.clearConvBtn}>
                <Feather name="trash-2" size={14} color={Colors.textTertiary} />
              </Pressable>
            </View>
            {conversation.map((entry) => (
              <ConvCard
                key={entry.id}
                entry={entry}
                onReplay={() => handleReplayConv(entry)}
                onCopy={() => handleCopyConv(entry)}
              />
            ))}
          </View>
        )}

        {/* Saved Conversations footer */}
        <Pressable
          style={styles.memoryFooterBtn}
          onPress={() => { setMemorySearch(""); setSubview("memory"); }}
        >
          <Feather name="archive" size={14} color={ACCENT_TRAVEL} />
          <Text style={styles.memoryFooterText}>
            Saved Conversations ({allSessions.filter((s) => s.messages.length > 0).length})
          </Text>
          <Feather name="chevron-right" size={14} color={Colors.textTertiary} style={{ marginLeft: "auto" }} />
        </Pressable>

        <View style={{ height: 120 }} />
      </ScrollView>
      </>)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 18,
  },

  howItWorksCard: {
    backgroundColor: ACCENT_TRAVEL + "0C",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: ACCENT_TRAVEL + "33",
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

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    maxWidth: 260,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  langSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  langBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  langFlag: {
    fontSize: 22,
  },
  langBtnLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  langBtnValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 1,
  },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ACCENT_TRAVEL_DIM,
    borderWidth: 1,
    borderColor: ACCENT_TRAVEL_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },

  quickTranslateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    marginBottom: 14,
  },
  quickTranslateBtnActive: {
    backgroundColor: "#00D4FF12",
    borderColor: "#00D4FF55",
  },
  quickTranslateBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  quickTranslateBtnTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  quickTranslateBtnHint: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  quickTranslateActiveChip: {
    backgroundColor: "#00D4FF22",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  quickTranslateActiveText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#00D4FF",
    letterSpacing: 0.5,
  },
  translateTextOnlyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#00D4FF12",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#00D4FF33",
    alignSelf: "center",
  },
  translateTextOnlyText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#00D4FF",
  },

  interactCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  modeContext: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  micWrapper: {
    marginVertical: 4,
  },
  micOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  noSpeechBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignSelf: "stretch",
  },
  noSpeechText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accentSecondary + "18",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.accentSecondary + "44",
    alignSelf: "stretch",
  },
  errorText: {
    fontSize: 12,
    color: Colors.accentSecondary,
    flex: 1,
    lineHeight: 17,
  },
  resultArea: {
    alignSelf: "stretch",
    gap: 6,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultLangTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  resultLangText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  transcriptText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontWeight: "500",
  },
  translationCard: {
    marginTop: 4,
    backgroundColor: ACCENT_TRAVEL_DIM,
    borderWidth: 1,
    borderColor: ACCENT_TRAVEL_BORDER,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    alignSelf: "stretch",
  },
  translationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  showToThemBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ACCENT_TRAVEL + "25",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  showToThemText: {
    fontSize: 10,
    fontWeight: "700",
    color: ACCENT_TRAVEL,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  translationTextLarge: {
    fontSize: 22,
    color: Colors.text,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  speakBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ACCENT_TRAVEL,
    borderRadius: 12,
    paddingVertical: 13,
    alignSelf: "stretch",
  },
  speakBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  processingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  otherOptionsHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 0, marginTop: 8, marginBottom: 4,
    paddingHorizontal: 2,
  },
  otherOptionsLabel: {
    fontSize: 11, fontWeight: "700", color: ACCENT_TRAVEL,
    textTransform: "uppercase", letterSpacing: 0.8,
  },

  typeSection: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  typeSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  typeSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: ACCENT_TRAVEL,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    flex: 1,
  },
  ocrCameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT_TRAVEL + "40",
    backgroundColor: ACCENT_TRAVEL + "0C",
  },
  ocrCameraBtnText: {
    color: ACCENT_TRAVEL,
    fontSize: 11,
    fontWeight: "600",
  },
  ocrErrorText: {
    color: Colors.error ?? "#EF4444",
    fontSize: 11,
    marginBottom: 6,
  },
  typeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border ?? "#1E1E2E",
  },
  typeBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: ACCENT_TRAVEL,
    alignItems: "center",
    justifyContent: "center",
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
  typeResult: {
    marginTop: 12,
    padding: 14,
    backgroundColor: ACCENT_TRAVEL_DIM,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT_TRAVEL_BORDER,
    gap: 8,
  },
  typeResultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeResultLang: {
    fontSize: 11,
    fontWeight: "700",
    color: ACCENT_TRAVEL,
  },
  typeSpeakBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  typeSpeakBtnText: {
    fontSize: 12,
    color: ACCENT_TRAVEL,
    fontWeight: "600",
  },

  phrasesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  phrasesToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  phrasesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  phraseChip: {
    backgroundColor: ACCENT_TRAVEL_DIM,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: ACCENT_TRAVEL_BORDER,
  },
  phraseText: {
    fontSize: 13,
    color: ACCENT_TRAVEL,
    fontWeight: "600",
  },

  convSection: {
    marginTop: 8,
  },
  convHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  convTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearConvBtn: {
    padding: 4,
  },
  convCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  convCardYou: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
  },
  convCardThem: {
    backgroundColor: Colors.accentSecondary + "11",
    borderColor: Colors.accentSecondary + "44",
  },
  convCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  speakerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  speakerLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  convTime: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  convOriginal: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: "500",
  },
  convDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 8,
  },
  convTranslated: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 23,
    fontWeight: "700",
  },
  convActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  convActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  convActionText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "500",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  langRowActive: {
    backgroundColor: ACCENT_TRAVEL_DIM,
  },
  langLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
  },

  // ── Live Conversation ──────────────────────────────────────────────────────
  livePanel: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#7C3AED44",
    marginBottom: 12,
    overflow: "hidden",
  },
  liveHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#7C3AED22",
    gap: 8,
  },
  liveTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cardBorder,
  },
  liveDotActive: {
    backgroundColor: "#A78BFA",
  },
  liveTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#A78BFA",
    letterSpacing: -0.2,
    flex: 1,
  },
  liveCount: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: "600",
  },
  liveHeaderActions: {
    flexDirection: "row",
    gap: 6,
  },
  liveToggleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  liveToggleChipActive: {
    borderColor: "#7C3AED66",
    backgroundColor: "#7C3AED18",
  },
  liveToggleChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textTertiary,
  },
  liveSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 16,
  },
  // Speaker bar
  liveSpeakerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#7C3AED15",
    gap: 10,
  },
  liveSpeakerLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: "600",
  },
  liveSpeakerToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  liveSpeakerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background,
  },
  liveSpeakerPillYouActive: {
    borderColor: "#7C3AED66",
    backgroundColor: "#7C3AED18",
  },
  liveSpeakerPillThemActive: {
    borderColor: ACCENT_TRAVEL_BORDER,
    backgroundColor: ACCENT_TRAVEL_DIM,
  },
  liveSpeakerPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textTertiary,
  },
  // Chat feed
  liveCaptionsScroll: {
    height: 380,
  },
  liveCaptionsContent: {
    padding: 14,
    gap: 10,
    flexGrow: 1,
  },
  liveEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
  },
  liveEmptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 22,
  },
  // Chat cards
  liveChatCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  liveChatCardYou: {
    backgroundColor: "#1A0F2E",
    borderColor: "#7C3AED44",
  },
  liveChatCardThem: {
    backgroundColor: "#0A1F1A",
    borderColor: "#10B98133",
  },
  liveChatCardHighlight: {
    borderColor: "#A78BFA",
  },
  liveChatMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  liveChatSpeakerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveChatSpeakerText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  liveChatTime: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  liveConfidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: "#92400E22",
    borderWidth: 1,
    borderColor: "#92400E55",
  },
  liveConfidenceText: {
    fontSize: 9,
    color: "#F59E0B",
    fontWeight: "600",
  },
  liveChatOriginal: {
    fontSize: 19,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 27,
  },
  liveChatTranslated: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "500",
  },
  liveChatTranslating: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
  liveChatActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#ffffff08",
  },
  liveChatActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveChatActionText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: "600",
  },
  // Interim
  liveInterimBlock: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#7C3AED0D",
    borderWidth: 1,
    gap: 4,
  },
  liveInterimSpeaker: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  liveInterimText: {
    fontSize: 18,
    color: Colors.textSecondary,
    lineHeight: 26,
    fontStyle: "italic",
  },
  // Unsupported
  liveUnsupported: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  liveUnsupportedText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  // Controls
  liveControls: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#7C3AED22",
  },
  liveStartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
  },
  liveStopBtn: {
    backgroundColor: "#DC2626",
  },
  liveStartBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  liveClearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  liveClearBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  // ─── Session bar ────────────────────────────────────────────────────────────
  sessionBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  sessionInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    overflow: "hidden",
  },
  sessionDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    flexShrink: 0,
  },
  sessionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    flex: 1,
  },
  sessionActions: {
    flexDirection: "row",
    gap: 6,
  },
  sessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sessionBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textTertiary,
  },

  // ─── Memory footer button ────────────────────────────────────────────────────
  memoryFooterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ACCENT_TRAVEL_DIM,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 8,
    borderWidth: 1,
    borderColor: ACCENT_TRAVEL_BORDER,
  },
  memoryFooterText: {
    fontSize: 13,
    fontWeight: "700",
    color: ACCENT_TRAVEL,
    flex: 1,
  },
});
