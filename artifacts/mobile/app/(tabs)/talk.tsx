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
  ActivityIndicator,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

// ── Palette ─────────────────────────────────────────────────────────────────
const ACCENT_A = "#00D4FF";
const ACCENT_B = "#A78BFA";

// ── Language options ─────────────────────────────────────────────────────────
const LANG_OPTIONS = [
  { code: "en", label: "English",    flag: "🇺🇸" },
  { code: "hi", label: "Hindi",      flag: "🇮🇳" },
  { code: "te", label: "Telugu",     flag: "🇮🇳" },
  { code: "ta", label: "Tamil",      flag: "🇮🇳" },
  { code: "kn", label: "Kannada",    flag: "🇮🇳" },
  { code: "ml", label: "Malayalam",  flag: "🇮🇳" },
  { code: "bn", label: "Bengali",    flag: "🇧🇩" },
  { code: "mr", label: "Marathi",    flag: "🇮🇳" },
  { code: "gu", label: "Gujarati",   flag: "🇮🇳" },
  { code: "pa", label: "Punjabi",    flag: "🇮🇳" },
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
  { code: "sw", label: "Swahili",    flag: "🇰🇪" },
  { code: "uk", label: "Ukrainian",  flag: "🇺🇦" },
];

const SPEECH_LANG_MAP: Record<string, string> = {
  en: "en-US", hi: "hi-IN", te: "te-IN", ta: "ta-IN", kn: "kn-IN",
  ml: "ml-IN", bn: "bn-BD", mr: "mr-IN", gu: "gu-IN", pa: "pa-IN",
  es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-BR",
  ja: "ja-JP", zh: "zh-CN", ko: "ko-KR", ar: "ar-SA", ru: "ru-RU",
  nl: "nl-NL", tr: "tr-TR", pl: "pl-PL", th: "th-TH", vi: "vi-VN",
  id: "id-ID", ms: "ms-MY", tl: "fil-PH", sw: "sw-KE", uk: "uk-UA",
};

function getLangInfo(code: string) {
  return LANG_OPTIONS.find((l) => l.code === code) ?? { code, label: code, flag: "🌐" };
}

// ── Script mismatch detection ────────────────────────────────────────────────
const SCRIPT_RANGES: Record<string, { re: RegExp; name: string }> = {
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
  uk: { re: /[\u0400-\u04FF]/, name: "Ukrainian" },
  th: { re: /[\u0E00-\u0E7F]/, name: "Thai" },
  he: { re: /[\u0590-\u05FF]/, name: "Hebrew" },
};
function checkScriptMismatch(text: string, langCode: string): string | null {
  if (!text.trim()) return null;
  const base = langCode.split("-")[0]!.toLowerCase();
  const s = SCRIPT_RANGES[base];
  if (!s) return null;
  if (s.re.test(text)) return null;
  return `Looks like you ${typeof window !== "undefined" ? "spoke" : "typed"} in a different script — translating anyway. For best results, use ${s.name} script.`;
}
function isNonLatin(langCode: string): boolean {
  return langCode.split("-")[0]!.toLowerCase() in SCRIPT_RANGES;
}

// ── Language picker modal (bottom sheet) ──────────────────────────────────────
function LangPickerModal({
  visible,
  selectedCode,
  title,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedCode: string;
  title: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={tlStyles.modalOverlay} onPress={onClose}>
        <Pressable style={tlStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={tlStyles.modalHandle} />
          <Text style={tlStyles.modalTitle}>{title}</Text>
          <FlatList
            data={LANG_OPTIONS}
            keyExtractor={(l) => l.code}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[tlStyles.modalItem, item.code === selectedCode && tlStyles.modalItemActive]}
                onPress={() => { onSelect(item.code); onClose(); }}
              >
                <Text style={tlStyles.modalItemFlag}>{item.flag}</Text>
                <Text style={[tlStyles.modalItemLabel, item.code === selectedCode && { color: ACCENT_A }]}>
                  {item.label}
                </Text>
                {item.code === selectedCode && (
                  <Feather name="check" size={15} color={ACCENT_A} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            )}
            style={{ maxHeight: 440 }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const tlStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#16161F",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  modalHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E2E",
  },
  modalItemActive: { backgroundColor: ACCENT_A + "10" },
  modalItemFlag:  { fontSize: 20 },
  modalItemLabel: { fontSize: 14, color: "#e0e0e0" },
});

// ── API helpers ──────────────────────────────────────────────────────────────
function getApiBase(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:8080/api";
}

function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string) {
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

// ── Types ────────────────────────────────────────────────────────────────────
interface TalkMessage {
  id: string;
  timestamp: number;
  senderRole: "A" | "B";
  original: string;
  translated: string;
}

type SpeakStatus = "idle" | "listening" | "translating" | "error";

// ── Component ────────────────────────────────────────────────────────────────
export default function TalkScreen() {
  const insets = useSafeAreaInsets();

  const [myLang, setMyLang]         = useState("en");
  const [theirLang, setTheirLang]   = useState("es");
  const [showMyPicker, setShowMyPicker]     = useState(false);
  const [showTheirPicker, setShowTheirPicker] = useState(false);

  const [roomId, setRoomId]         = useState<string | null>(null);
  const [myRole, setMyRole]         = useState<"A" | "B" | null>(null);
  const [joinInput, setJoinInput]   = useState("");
  const [roomError, setRoomError]   = useState("");
  const [messages, setMessages]     = useState<TalkMessage[]>([]);
  const [speakStatus, setSpeakStatus] = useState<SpeakStatus>("idle");
  const [speakError, setSpeakError]   = useState("");
  const [capturedText, setCapturedText] = useState(""); // what speech recognition heard
  const [demoInput, setDemoInput]     = useState("");
  const [langWarning, setLangWarning] = useState("");
  const langWarnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copiedCode, setCopiedCode]   = useState(false);
  const [copiedLink, setCopiedLink]   = useState(false);

  const scrollRef    = useRef<ScrollView>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTsRef    = useRef(0);
  const myRoleRef    = useRef<"A" | "B" | null>(null);
  const roomIdRef    = useRef<string | null>(null);
  const speakStatusRef = useRef<SpeakStatus>("idle"); // avoids stale closure in onend
  const recognizerRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const roomStartedAtRef = useRef<number>(0);
  const messagesRef  = useRef<TalkMessage[]>([]); // mirror for save-on-leave

  // keep refs in sync with state
  useEffect(() => { myRoleRef.current = myRole; }, [myRole]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const setSpeak = (s: SpeakStatus) => { speakStatusRef.current = s; setSpeakStatus(s); };

  function showLangWarning(msg: string) {
    setLangWarning(msg);
    if (langWarnTimerRef.current) clearTimeout(langWarnTimerRef.current);
    langWarnTimerRef.current = setTimeout(() => setLangWarning(""), 7000);
  }

  // ── Save & download conversation ───────────────────────────────────────────
  function buildTranscript(msgs: TalkMessage[], rid: string, role: "A" | "B" | null): string {
    const myLangLabel = getLangInfo(myLang).label;
    const theirLangLabel = getLangInfo(theirLang).label;
    const startedAt = roomStartedAtRef.current
      ? new Date(roomStartedAtRef.current).toLocaleString()
      : "Unknown";
    const endedAt = new Date().toLocaleString();
    const durMs = roomStartedAtRef.current ? Date.now() - roomStartedAtRef.current : 0;
    const durMin = Math.round(durMs / 60000);

    const lines = [
      "=================================================",
      "  TRANSLATE CALL — Conversation Transcript",
      "=================================================",
      `Room code : ${rid}`,
      `Your role : ${role === "A" ? "Host" : "Guest"}`,
      `Languages : ${myLangLabel} ↔ ${theirLangLabel}`,
      `Started   : ${startedAt}`,
      `Ended     : ${endedAt}`,
      `Duration  : ${durMin} min`,
      "=================================================",
      "",
    ];

    msgs.forEach((m) => {
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const speaker = m.senderRole === role ? "You" : "Them";
      lines.push(`[${time}] ${speaker}: ${m.original}`);
      lines.push(`         → ${m.translated}`);
      lines.push("");
    });

    return lines.join("\n");
  }

  function downloadTranscript(text: string, rid: string) {
    if (typeof document === "undefined") return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translate-call-${rid}-${Date.now()}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function saveTalkSession(msgs: TalkMessage[], rid: string, role: "A" | "B" | null) {
    if (!msgs.length) return;
    try {
      const key = "talk_sessions_v1";
      const prev: object[] = JSON.parse(localStorage.getItem(key) ?? "[]");
      const session = {
        id: `talk_${Date.now()}`,
        roomId: rid,
        role,
        myLang,
        theirLang,
        startedAt: roomStartedAtRef.current,
        endedAt: Date.now(),
        messages: msgs,
      };
      prev.unshift(session);
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 50)));
    } catch { /* ignore */ }
  }

  function handleEndTalk() {
    const msgs = messagesRef.current;
    const rid  = roomIdRef.current ?? "";
    const role = myRoleRef.current;
    if (msgs.length > 0) {
      saveTalkSession(msgs, rid, role);
      downloadTranscript(buildTranscript(msgs, rid, role), rid);
    }
    handleLeave();
  }

  // ── Polling ────────────────────────────────────────────────────────────────
  const startPolling = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const role = myRoleRef.current;
        const url = `${getApiBase()}/rooms/${id}/pull?since=${lastTsRef.current}&excludeRole=${role ?? ""}`;
        const r = await fetch(url);
        if (!r.ok) return;
        const data = await r.json() as { translations: Array<{
          id: string; timestamp: number; senderRole: "A" | "B";
          original: string; translations: Record<string, string>;
        }> };
        const incoming = data.translations ?? [];
        if (incoming.length === 0) return;
        const newMsgs: TalkMessage[] = incoming.map((t) => ({
          id: t.id,
          timestamp: t.timestamp,
          senderRole: t.senderRole,
          original: t.original,
          translated: Object.values(t.translations)[0] ?? t.original,
        }));
        const maxTs = Math.max(...incoming.map((t) => t.timestamp));
        if (maxTs > lastTsRef.current) lastTsRef.current = maxTs;
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const fresh = newMsgs.filter((m) => !ids.has(m.id));
          return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
      } catch { /* ignore */ }
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // ── Create room ────────────────────────────────────────────────────────────
  async function handleCreate() {
    setRoomError("");
    try {
      const r = await fetch(`${getApiBase()}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "talk" }),
      });
      const data = await r.json() as { roomId?: string; error?: string };
      if (!data.roomId) { setRoomError(data.error ?? "Failed to create room"); return; }
      setRoomId(data.roomId);
      setMyRole("A");
      setMessages([]);
      lastTsRef.current = 0;
      roomStartedAtRef.current = Date.now();
      startPolling(data.roomId);
    } catch {
      setRoomError("Network error — check your connection");
    }
  }

  // ── Join room ──────────────────────────────────────────────────────────────
  async function handleJoin() {
    const code = joinInput.trim().toUpperCase();
    if (!code) return;
    setRoomError("");
    try {
      const r = await fetch(`${getApiBase()}/rooms/${code}`);
      if (!r.ok) { setRoomError("Room not found — check the code"); return; }
      setRoomId(code);
      setMyRole("B");
      setMessages([]);
      lastTsRef.current = 0;
      roomStartedAtRef.current = Date.now();
      startPolling(code);
    } catch {
      setRoomError("Network error — check your connection");
    }
  }

  // ── Leave room ─────────────────────────────────────────────────────────────
  function handleLeave() {
    // Auto-save before clearing (silent, no download)
    const msgs = messagesRef.current;
    const rid  = roomIdRef.current ?? "";
    const role = myRoleRef.current;
    if (msgs.length > 0) saveTalkSession(msgs, rid, role);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setRoomId(null);
    setMyRole(null);
    setMessages([]);
    lastTsRef.current = 0;
    roomStartedAtRef.current = 0;
    setSpeakStatus("idle");
    setSpeakError("");
    setCapturedText("");
    setJoinInput("");
    setRoomError("");
  }

  // ── Push message to room ───────────────────────────────────────────────────
  async function pushMessage(original: string, translated: string) {
    const id   = roomIdRef.current;
    const role = myRoleRef.current;
    if (!id || !role) return;
    const translations: Record<string, string> = { [theirLang]: translated };
    try {
      const res = await fetch(`${getApiBase()}/rooms/${id}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, translations, senderRole: role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setSpeakError(`Send failed: ${err.error ?? res.status}`);
        return;
      }
    } catch (e) {
      setSpeakError("Network error — message not sent");
      return;
    }
    // Add to local feed only after successful push
    const msg: TalkMessage = {
      id: `local-${Date.now()}`,
      timestamp: Date.now(),
      senderRole: role,
      original,
      translated,
    };
    setMessages((prev) => [...prev, msg]);
  }

  // ── Translate text ─────────────────────────────────────────────────────────
  async function translateText(text: string): Promise<string> {
    try {
      const r = await fetch(`${getApiBase()}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, toLang: theirLang }),
      });
      if (!r.ok) return text; // fall back to original if API error
      const data = await r.json() as { translated?: string; error?: string };
      return data.translated?.trim() || text;
    } catch {
      return text; // fall back to original on network error
    }
  }

  // ── Speak button ───────────────────────────────────────────────────────────
  function handleSpeak() {
    // Stop if already listening
    if (speakStatusRef.current === "listening") {
      recognizerRef.current?.stop();
      setSpeak("idle");
      return;
    }
    // Ignore taps while a translation/send is in progress
    if (speakStatusRef.current === "translating") return;

    setSpeakError("");
    setCapturedText("");

    const SR = (typeof window !== "undefined")
      ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
      : null;

    if (!SR) {
      setSpeakError("Speech recognition is not supported in this browser. Use the text input below.");
      return;
    }

    const rec = new SR() as InstanceType<typeof SpeechRecognition>;
    rec.lang = SPEECH_LANG_MAP[myLang] ?? "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    recognizerRef.current = rec;

    rec.onstart = () => setSpeak("listening");

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setSpeak("error");
      setSpeakError(
        e.error === "not-allowed"
          ? "Microphone permission denied — please allow microphone access"
          : e.error === "no-speech"
          ? "No speech detected — tap the mic and speak clearly"
          : "Speech recognition failed — try again or use text input"
      );
      setTimeout(() => setSpeak("idle"), 3000);
    };

    rec.onresult = async (e: SpeechRecognitionEvent) => {
      const text = e.results[0]?.[0]?.transcript?.trim() ?? "";
      if (!text) {
        setSpeakError("No speech captured — please try again");
        setSpeak("idle");
        return;
      }
      setCapturedText(text); // show what was heard
      // Check if spoken text matches the expected script
      const warning = checkScriptMismatch(text, myLang);
      if (warning) showLangWarning(warning);
      setSpeak("translating");
      const translated = await translateText(text); // never throws; falls back to original
      await pushMessage(text, translated);
      setCapturedText(""); // clear after send
      setSpeak("idle");
    };

    // Use ref so onend always sees the CURRENT status (not stale closure value)
    rec.onend = () => {
      if (speakStatusRef.current === "listening") {
        setSpeakError("No speech detected — tap the mic and speak clearly");
        setSpeak("idle");
      }
    };

    rec.start();
  }

  // ── Demo / manual send ─────────────────────────────────────────────────────
  async function handleDemoSend() {
    const text = demoInput.trim();
    if (!text || !roomId) return;
    // Check script mismatch before sending
    const warning = checkScriptMismatch(text, myLang);
    if (warning) showLangWarning(warning);
    setSpeakStatus("translating");
    setDemoInput("");
    try {
      const translated = await translateText(text);
      await pushMessage(text, translated);
    } catch {
      setSpeakError("Translation failed");
    }
    setSpeakStatus("idle");
  }

  // ── Web link ───────────────────────────────────────────────────────────────
  function getWebLink() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/rooms/${roomId}/web`;
  }

  // ── UI ─────────────────────────────────────────────────────────────────────
  const paddingBottom = Math.max(insets.bottom, 16) + 80;

  const myInfo    = getLangInfo(myLang);
  const theirInfo = getLangInfo(theirLang);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View>
          <Text style={styles.headerTitle}>Translate Call</Text>
          <Text style={styles.headerSub}>
            {roomId
              ? `Room ${roomId} · ${myRole === "A" ? "Host" : "Guest"}`
              : "Talk across any language barrier, live"}
          </Text>
        </View>
        {roomId && (
          <Pressable style={styles.leaveBtn} onPress={handleLeave}>
            <Feather name="x" size={14} color={Colors.error} />
            <Text style={styles.leaveBtnText}>Leave</Text>
          </Pressable>
        )}
      </View>

      {/* ── Language picker modals ─────────────────────────────────────── */}
      <LangPickerModal
        visible={showMyPicker}
        selectedCode={myLang}
        title="My Language"
        onSelect={setMyLang}
        onClose={() => setShowMyPicker(false)}
      />
      <LangPickerModal
        visible={showTheirPicker}
        selectedCode={theirLang}
        title="Their Language"
        onSelect={setTheirLang}
        onClose={() => setShowTheirPicker(false)}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── NOT in room ── */}
        {!roomId && (
          <>
            {/* How to use */}
            <Animated.View entering={FadeInDown} style={styles.howCard}>
              <View style={styles.howHeader}>
                <Feather name="info" size={14} color={ACCENT_A} />
                <Text style={styles.howTitle}>How to use</Text>
              </View>

              <View style={styles.howSteps}>
                {[
                  { icon: "globe" as const,      text: "Set your language and your contact's language" },
                  { icon: "radio" as const,       text: "Tap Start Room and share the room code with them" },
                  { icon: "mic" as const,         text: "Both tap Speak, talk naturally — translations appear in real time" },
                  { icon: "download" as const,    text: "Host taps End Talk to save & download the full transcript" },
                ].map((s, i) => (
                  <View key={i} style={styles.howStep}>
                    <View style={styles.howStepNum}>
                      <Text style={styles.howStepNumText}>{i + 1}</Text>
                    </View>
                    <View style={styles.howStepBody}>
                      <Feather name={s.icon} size={13} color={ACCENT_A} style={{ marginTop: 2 }} />
                      <Text style={styles.howStepText}>{s.text}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.howFallbackBox}>
                <Feather name="smartphone" size={13} color={Colors.accentSecondary} />
                <Text style={styles.howFallbackText}>
                  <Text style={{ fontWeight: "700", color: Colors.accentSecondary }}>No app on their end? </Text>
                  Share the web link — they follow your translations live in any browser. Room stays active for <Text style={{ fontWeight: "700" }}>2 hours</Text>.
                </Text>
              </View>
            </Animated.View>

            {/* Language selectors */}
            <View style={styles.langCard}>
              <Text style={styles.sectionTitle}>Set your languages</Text>

              <View style={styles.langRow}>
                {/* My language */}
                <View style={styles.langCol}>
                  <Text style={styles.langLabel}>My Language</Text>
                  <Pressable style={styles.langBtn} onPress={() => { setShowMyPicker(true); setShowTheirPicker(false); }}>
                    <Text style={styles.langBtnFlag}>{myInfo.flag}</Text>
                    <Text style={styles.langBtnLabel}>{myInfo.label}</Text>
                    <Feather name="chevron-down" size={14} color={Colors.textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.langArrow}>
                  <Feather name="repeat" size={18} color={Colors.textTertiary} />
                </View>

                {/* Their language */}
                <View style={styles.langCol}>
                  <Text style={styles.langLabel}>Their Language</Text>
                  <Pressable style={styles.langBtn} onPress={() => { setShowTheirPicker(true); setShowMyPicker(false); }}>
                    <Text style={styles.langBtnFlag}>{theirInfo.flag}</Text>
                    <Text style={styles.langBtnLabel}>{theirInfo.label}</Text>
                    <Feather name="chevron-down" size={14} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Create / Join */}
            <View style={styles.setupCard}>
              {!!roomError && (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={13} color={Colors.error} />
                  <Text style={styles.errorText}>{roomError}</Text>
                </View>
              )}

              <Pressable style={styles.createBtn} onPress={handleCreate}>
                <Feather name="radio" size={16} color="#000" />
                <Text style={styles.createBtnText}>Start Room (you go first)</Text>
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or join someone's room</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.joinLabel}>Enter the room code they shared with you:</Text>
              <View style={styles.joinRow}>
                <TextInput
                  style={styles.joinInput}
                  placeholder="e.g. B34961"
                  placeholderTextColor={Colors.textTertiary}
                  value={joinInput}
                  onChangeText={(t) => setJoinInput(t.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <Pressable
                  style={[styles.joinBtn, !joinInput.trim() && { opacity: 0.4 }]}
                  onPress={handleJoin}
                  disabled={!joinInput.trim()}
                >
                  <Text style={styles.joinBtnText}>Join</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* ── IN room ── */}
        {roomId && (
          <>
            {/* Room info bar */}
            <Animated.View entering={FadeInDown} style={styles.roomBar}>
              <View style={styles.roomBarLeft}>
                <View style={styles.liveDot} />
                <Text style={styles.roomBarCode}>{roomId}</Text>
                <Text style={styles.roomBarRole}>· {myRole === "A" ? "Host" : "Guest"}</Text>
              </View>
              <View style={styles.roomBarActions}>
                <Pressable
                  style={styles.roomBarBtn}
                  onPress={() => {
                    copyToClipboard(roomId!);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                >
                  <Feather name={copiedCode ? "check" : "copy"} size={12} color={ACCENT_A} />
                  <Text style={styles.roomBarBtnText}>{copiedCode ? "Copied!" : "Copy Code"}</Text>
                </Pressable>
                <Pressable
                  style={styles.roomBarBtn}
                  onPress={() => {
                    copyToClipboard(getWebLink());
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                >
                  <Feather name={copiedLink ? "check" : "link"} size={12} color={Colors.accentSecondary} />
                  <Text style={[styles.roomBarBtnText, { color: Colors.accentSecondary }]}>
                    {copiedLink ? "Copied!" : "Web Link"}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Duration note */}
            <View style={styles.durationNote}>
              <Feather name="clock" size={11} color={Colors.textTertiary} />
              <Text style={styles.durationNoteText}>Room is valid for 2 hours from creation</Text>
            </View>

            {/* End Talk button — host only */}
            {myRole === "A" && (
              <Pressable style={styles.endTalkBtn} onPress={handleEndTalk}>
                <Feather name="phone-off" size={15} color="#fff" />
                <Text style={styles.endTalkBtnText}>End Talk &amp; Save Transcript</Text>
              </Pressable>
            )}

            {/* Language context bar */}
            <View style={styles.langContextBar}>
              <View style={[styles.langBadge, { backgroundColor: ACCENT_A + "15", borderColor: ACCENT_A + "40" }]}>
                <Text style={[styles.langBadgeText, { color: ACCENT_A }]}>{myInfo.flag} You speak {myInfo.label}</Text>
              </View>
              <Feather name="arrow-right" size={14} color={Colors.textTertiary} />
              <View style={[styles.langBadge, { backgroundColor: ACCENT_B + "15", borderColor: ACCENT_B + "40" }]}>
                <Text style={[styles.langBadgeText, { color: ACCENT_B }]}>{theirInfo.flag} They speak {theirInfo.label}</Text>
              </View>
            </View>

            {/* Chat feed */}
            {messages.length === 0 ? (
              <View style={styles.emptyChat}>
                <Feather name="message-circle" size={36} color={Colors.textTertiary} />
                <Text style={styles.emptyChatTitle}>Ready to talk</Text>
                <Text style={styles.emptyChatSub}>
                  {myRole === "A"
                    ? `Share the code ${roomId} with your contact, then tap Speak below`
                    : "The host will start speaking — their translations will appear here"}
                </Text>
              </View>
            ) : (
              <View style={styles.chatFeed}>
                {messages.map((msg) => {
                  const isMe = msg.senderRole === myRole;
                  const accent = isMe ? ACCENT_A : ACCENT_B;
                  const senderInfo = isMe ? myInfo : theirInfo;
                  return (
                    <View
                      key={msg.id}
                      style={[styles.msgBubble, isMe ? styles.msgBubbleRight : styles.msgBubbleLeft]}
                    >
                      <View style={[
                        styles.msgInner,
                        { backgroundColor: accent + "12", borderColor: accent + "35" },
                        isMe ? styles.msgInnerRight : styles.msgInnerLeft,
                      ]}>
                        <Text style={[styles.msgSender, { color: accent }]}>
                          {senderInfo.flag}  {isMe ? "You" : "Them"}
                        </Text>

                        {isMe ? (
                          <>
                            <Text style={styles.msgOriginal}>{msg.original}</Text>
                            <View style={styles.msgTranslateRow}>
                              <Feather name="arrow-right" size={11} color={Colors.textTertiary} />
                              <Text style={styles.msgTranslated}>{theirInfo.flag} {msg.translated}</Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <Text style={styles.msgTranslated}>{msg.translated}</Text>
                            <Text style={styles.msgOriginal}>{msg.original}</Text>
                          </>
                        )}

                        <Text style={styles.msgTime}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Speak button */}
            <View style={styles.speakSection}>
              {!!speakError && (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={13} color={Colors.error} />
                  <Text style={styles.errorText}>{speakError}</Text>
                </View>
              )}

              {!!langWarning && (
                <View style={styles.langWarnBox}>
                  <Feather name="alert-triangle" size={13} color="#F59E0B" />
                  <Text style={styles.langWarnText}>{langWarning}</Text>
                </View>
              )}

              {!!capturedText && (
                <View style={styles.capturedBox}>
                  <Feather name="mic" size={12} color={ACCENT_A} />
                  <Text style={styles.capturedText} numberOfLines={2}>"{capturedText}"</Text>
                </View>
              )}

              <Pressable
                style={[
                  styles.speakBtn,
                  speakStatus === "listening" && styles.speakBtnActive,
                  speakStatus === "translating" && styles.speakBtnTranslating,
                ]}
                onPress={handleSpeak}
                disabled={speakStatus === "translating"}
              >
                {speakStatus === "translating" ? (
                  <>
                    <ActivityIndicator size="small" color="#000" />
                    <Text style={styles.speakBtnLabel}>Translating & Sending…</Text>
                  </>
                ) : speakStatus === "listening" ? (
                  <>
                    <Feather name="square" size={18} color="#000" />
                    <Text style={styles.speakBtnLabel}>Stop (tap when done speaking)</Text>
                  </>
                ) : (
                  <>
                    <Feather name="mic" size={18} color="#000" />
                    <Text style={styles.speakBtnLabel}>
                      Speak in {myInfo.label}
                    </Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.speakHint}>
                Tap to start, speak in <Text style={{ fontWeight: "700", color: Colors.text }}>{myInfo.label}</Text>, then tap Stop — we'll translate to {theirInfo.label} and send live
              </Text>
              {isNonLatin(myLang) && (
                <View style={styles.langHintRow}>
                  <Feather name="info" size={11} color={Colors.textTertiary} />
                  <Text style={styles.langHintText}>
                    For best recognition, speak clearly in <Text style={{ color: Colors.textSecondary }}>{myInfo.label}</Text> script. If you speak in English or another language, the app will still translate — but accuracy may vary.
                  </Text>
                </View>
              )}
            </View>

            {/* Demo / text fallback */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>No microphone? Type instead:</Text>
              <View style={styles.demoRow}>
                <TextInput
                  style={styles.demoInput}
                  placeholder={`Type in ${myInfo.label}…`}
                  placeholderTextColor={Colors.textTertiary}
                  value={demoInput}
                  onChangeText={setDemoInput}
                  returnKeyType="send"
                  onSubmitEditing={handleDemoSend}
                  // @ts-ignore – web-only: hints Gboard/Chrome to offer the right keyboard
                  lang={myInfo.code}
                />
                <Pressable
                  style={[styles.demoSendBtn, !demoInput.trim() && { opacity: 0.4 }]}
                  onPress={handleDemoSend}
                  disabled={!demoInput.trim() || speakStatus === "translating"}
                >
                  <Feather name="send" size={15} color="#000" />
                </Pressable>
              </View>
              {myLang !== "en" && (
                <View style={styles.keyboardHintRow}>
                  <Feather name="info" size={11} color={Colors.textTertiary} />
                  <Text style={styles.keyboardHintText}>
                    Switch your device keyboard to <Text style={{ color: Colors.textSecondary }}>{myInfo.label}</Text> to type natively.
                    {" "}On Android, Gboard may switch automatically.
                    {" "}On iPhone, use the 🌐 globe key.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.text },
  headerSub:   { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  leaveBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.error + "15",
    borderWidth: 1, borderColor: Colors.error + "40",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  leaveBtnText: { fontSize: 13, fontWeight: "600", color: Colors.error },

  scroll: { flex: 1 },

  // ── How to use ─────────────────────────────────────────────────────────────
  howCard: {
    margin: 16,
    backgroundColor: ACCENT_A + "0C",
    borderWidth: 1,
    borderColor: ACCENT_A + "30",
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  howHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  howTitle:  { fontSize: 14, fontWeight: "700", color: Colors.text },
  howIntro:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  howSteps:  { gap: 10 },
  howStep:   { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  howStepNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: ACCENT_A + "22",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 1,
  },
  howStepNumText: { fontSize: 11, fontWeight: "700", color: ACCENT_A },
  howStepBody: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  howStepText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
  howFallbackBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: Colors.accentSecondary + "0C",
    borderWidth: 1, borderColor: Colors.accentSecondary + "25",
    borderRadius: 10, padding: 10,
  },
  howFallbackText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  // ── Language card ──────────────────────────────────────────────────────────
  langCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  langRow:    { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  langCol:    { flex: 1, gap: 6 },
  langLabel:  { fontSize: 11, color: Colors.textSecondary, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  langArrow:  { paddingTop: 30, alignItems: "center", justifyContent: "center", width: 30 },
  langBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  },
  langBtnFlag:  { fontSize: 18 },
  langBtnLabel: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: "600" },

  // ── Setup card ─────────────────────────────────────────────────────────────
  setupCard: {
    margin: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  createBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: ACCENT_A,
    borderRadius: 12, paddingVertical: 14,
  },
  createBtnText: { fontSize: 15, fontWeight: "700", color: "#000" },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.cardBorder },
  dividerText: { fontSize: 12, color: Colors.textTertiary },
  joinLabel: { fontSize: 12, color: Colors.textSecondary },
  joinRow:   { flexDirection: "row", gap: 8 },
  joinInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 16, color: Colors.text, fontFamily: "monospace", letterSpacing: 2,
  },
  joinBtn: {
    backgroundColor: ACCENT_B,
    borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10,
    alignItems: "center", justifyContent: "center",
  },
  joinBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: Colors.error + "12",
    borderWidth: 1, borderColor: Colors.error + "30",
    borderRadius: 10, padding: 10,
  },
  errorText: { flex: 1, fontSize: 12, color: Colors.error, lineHeight: 18 },

  capturedBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: ACCENT_A + "10",
    borderWidth: 1, borderColor: ACCENT_A + "30",
    borderRadius: 10, padding: 10, marginBottom: 8,
  },
  capturedText: { flex: 1, fontSize: 12, color: ACCENT_A, lineHeight: 18, fontStyle: "italic" },

  // ── Room bar ───────────────────────────────────────────────────────────────
  roomBar: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 14, padding: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  roomBarLeft:    { flexDirection: "row", alignItems: "center", gap: 8 },
  roomBarActions: { flexDirection: "row", gap: 8 },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E",
    shadowColor: "#22C55E", shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },
  roomBarCode: { fontSize: 15, fontWeight: "700", color: Colors.text, fontFamily: "monospace", letterSpacing: 1 },
  roomBarRole: { fontSize: 12, color: Colors.textTertiary },
  roomBarBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  roomBarBtnText: { fontSize: 11, fontWeight: "600", color: ACCENT_A },

  durationNote: {
    marginHorizontal: 16, marginTop: 6,
    flexDirection: "row", alignItems: "center", gap: 5,
  },
  durationNoteText: { fontSize: 11, color: Colors.textTertiary },

  endTalkBtn: {
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: Colors.error,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  endTalkBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  // ── Language context bar ───────────────────────────────────────────────────
  langContextBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginHorizontal: 16, marginTop: 10,
  },
  langBadge: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  langBadgeText: { fontSize: 12, fontWeight: "600" },

  // ── Empty chat ─────────────────────────────────────────────────────────────
  emptyChat: {
    alignItems: "center", padding: 40, gap: 10,
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 16,
  },
  emptyChatTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  emptyChatSub:   { fontSize: 13, color: Colors.textSecondary, textAlign: "center", lineHeight: 20 },

  // ── Chat feed ──────────────────────────────────────────────────────────────
  chatFeed: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  msgBubble: { width: "100%" },
  msgBubbleLeft:  { alignItems: "flex-start" },
  msgBubbleRight: { alignItems: "flex-end" },
  msgInner: {
    maxWidth: "82%",
    borderWidth: 1, borderRadius: 14,
    padding: 12, gap: 4,
  },
  msgInnerLeft:  { borderBottomLeftRadius: 4 },
  msgInnerRight: { borderBottomRightRadius: 4 },
  msgSender:       { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  msgOriginal:     { fontSize: 12, color: Colors.textTertiary, fontStyle: "italic" },
  msgTranslated:   { fontSize: 16, color: Colors.text, lineHeight: 22, fontWeight: "500" },
  msgTranslateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  msgTime:         { fontSize: 10, color: Colors.textTertiary, marginTop: 4, alignSelf: "flex-end" },

  // ── Speak section ──────────────────────────────────────────────────────────
  speakSection: { marginHorizontal: 16, marginTop: 16, gap: 10 },
  speakBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: ACCENT_A,
    borderRadius: 14, paddingVertical: 16,
  },
  speakBtnActive:      { backgroundColor: "#22C55E" },
  speakBtnTranslating: { backgroundColor: Colors.accentSecondary },
  speakBtnLabel: { fontSize: 16, fontWeight: "700", color: "#000" },
  speakHint: { fontSize: 12, color: Colors.textTertiary, textAlign: "center" },

  // ── Demo / text input ──────────────────────────────────────────────────────
  demoSection: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 14, padding: 12, gap: 8,
  },
  demoLabel: { fontSize: 12, color: Colors.textSecondary },
  demoRow:   { flexDirection: "row", gap: 8 },
  demoInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, color: Colors.text,
  },
  demoSendBtn: {
    width: 42, height: 42,
    backgroundColor: ACCENT_A,
    borderRadius: 10, alignItems: "center", justifyContent: "center",
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
    marginBottom: 8,
  },
  langWarnText: {
    flex: 1,
    fontSize: 12,
    color: "#F59E0B",
    lineHeight: 17,
  },
  langHintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  langHintText: {
    flex: 1,
    fontSize: 11.5,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
});
