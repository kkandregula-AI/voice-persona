import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

const ACCENT_TRAVEL = "#10B981";
const ACCENT_TRAVEL_DIM = "#10B98122";
const ACCENT_TRAVEL_BORDER = "#10B98155";

type Language = { code: string; label: string; flag: string; name: string };

const LANGUAGES: Language[] = [
  { code: "en-US", label: "English",    flag: "🇺🇸", name: "English"    },
  { code: "es-ES", label: "Spanish",    flag: "🇪🇸", name: "Spanish"    },
  { code: "fr-FR", label: "French",     flag: "🇫🇷", name: "French"     },
  { code: "de-DE", label: "German",     flag: "🇩🇪", name: "German"     },
  { code: "it-IT", label: "Italian",    flag: "🇮🇹", name: "Italian"    },
  { code: "pt-BR", label: "Portuguese", flag: "🇧🇷", name: "Portuguese" },
  { code: "ja-JP", label: "Japanese",   flag: "🇯🇵", name: "Japanese"   },
  { code: "zh-CN", label: "Chinese",    flag: "🇨🇳", name: "Chinese"    },
  { code: "ko-KR", label: "Korean",     flag: "🇰🇷", name: "Korean"     },
  { code: "ar-SA", label: "Arabic",     flag: "🇸🇦", name: "Arabic"     },
  { code: "hi-IN", label: "Hindi",      flag: "🇮🇳", name: "Hindi"      },
  { code: "ru-RU", label: "Russian",    flag: "🇷🇺", name: "Russian"    },
  { code: "nl-NL", label: "Dutch",      flag: "🇳🇱", name: "Dutch"      },
  { code: "tr-TR", label: "Turkish",    flag: "🇹🇷", name: "Turkish"    },
  { code: "pl-PL", label: "Polish",     flag: "🇵🇱", name: "Polish"     },
  { code: "th-TH", label: "Thai",       flag: "🇹🇭", name: "Thai"       },
  { code: "vi-VN", label: "Vietnamese", flag: "🇻🇳", name: "Vietnamese" },
  { code: "id-ID", label: "Indonesian", flag: "🇮🇩", name: "Indonesian" },
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

type Mode = "speak" | "listen";
type Status = "idle" | "listening" | "processing" | "speaking";

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
  const from = fromCode.split("-")[0];
  const to = toCode.split("-")[0];

  // Primary: AI server (best quality for conversational text)
  try {
    const aiRes = await fetch(`${getApiBase()}/ai/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fromLang: fromCode, toLang: toCode }),
    });
    if (aiRes.ok) {
      const aiData = (await aiRes.json()) as { translation?: string };
      if (aiData.translation) return aiData.translation;
    }
  } catch {
    // fall through to MyMemory
  }

  // Fallback: MyMemory — only accept high-confidence matches (score >= 0.8)
  try {
    const mmRes = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    );
    if (mmRes.ok) {
      const mmData = (await mmRes.json()) as {
        responseStatus: number;
        responseData?: { translatedText?: string; match?: number };
      };
      const translated = mmData.responseData?.translatedText ?? "";
      const match = mmData.responseData?.match ?? 0;
      if (mmData.responseStatus === 200 && translated && translated !== text && match >= 0.8) {
        return translated;
      }
    }
  } catch {
    // fall through to error
  }

  throw new Error("Translation unavailable. Please try again.");
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

// Request mic permission once and hold the stream so the browser
// remembers the grant and never prompts again during the session.
let micStreamCache: MediaStream | null = null;
async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return false;
  if (micStreamCache) return true;
  try {
    micStreamCache = await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch {
    return false;
  }
}

function startSpeechRecognition(
  langCode: string,
  onResult: (text: string) => void,
  onEnd: () => void,
  onError: (msg: string) => void
): (() => void) | null {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    onError("Speech recognition is only available in a web browser.");
    return null;
  }
  const SR =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition })
      .SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
  if (!SR) {
    onError("Voice input isn't supported in this browser. Use Chrome on Android or desktop, or type below.");
    return null;
  }
  const recognition = new SR();
  recognition.lang = langCode;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (e: SpeechRecognitionEvent) => {
    const text = e.results[0]?.[0]?.transcript ?? "";
    if (text.trim()) onResult(text.trim());
  };
  recognition.onend = onEnd;
  recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
    if (e.error === "no-speech") onError("No speech detected. Try again.");
    else if (e.error === "not-allowed") onError("Microphone access denied. Please allow mic in browser settings.");
    else onError(`Recognition error: ${e.error}`);
  };
  recognition.start();
  return () => { try { recognition.abort(); } catch {} };
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
  const [speechSupported, setSpeechSupported] = useState(true);

  const stopRecognitionRef = useRef<(() => void) | null>(null);

  // On mount: check speech support and pre-request mic permission so the
  // browser remembers the grant and never prompts mid-session.
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
      const supported = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
      setSpeechSupported(supported);
      if (supported) {
        // Silently request permission upfront — no repeated prompts later
        ensureMicPermission();
      }
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const sourceLang = mode === "speak" ? myLang : theirLang;
  const targetLang = mode === "speak" ? theirLang : myLang;
  const statusLabel =
    status === "listening" ? (mode === "speak" ? "Listening to you…" : "Listening to them…") :
    status === "processing" ? "Translating…" :
    status === "speaking" ? "Speaking translation…" :
    mode === "speak" ? "Tap to speak" : "Tap to listen";

  const handleSwap = () => {
    setMyLang(theirLang);
    setTheirLang(myLang);
    setTranscript("");
    setTranslation("");
    setError("");
    setTypeTranslation("");
  };

  const handleMicPress = useCallback(async () => {
    setError("");
    if (status === "listening") {
      stopRecognitionRef.current?.();
      stopRecognitionRef.current = null;
      setStatus("idle");
      return;
    }
    if (status === "processing" || status === "speaking") return;

    setTranscript("");
    setTranslation("");
    setStatus("listening");

    const stop = startSpeechRecognition(
      sourceLang.code,
      async (text) => {
        setTranscript(text);
        setStatus("processing");
        try {
          const result = await translateText(text, sourceLang.code, targetLang.code);
          setTranslation(result);
          setStatus("speaking");
          speakText(result, targetLang.code);
          const speakMs = Math.max(3000, result.length * 75);
          setTimeout(() => setStatus("idle"), speakMs);
          const entry: ConvEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            speaker: mode === "speak" ? "you" : "them",
            original: text,
            translated: result,
            originalLang: sourceLang.label,
            translatedLang: targetLang.label,
            timestamp: Date.now(),
          };
          setConversation((prev) => [entry, ...prev].slice(0, 30));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Translation failed");
          setStatus("idle");
        }
      },
      () => {
        if (status === "listening") setStatus("idle");
      },
      (msg) => {
        setError(msg);
        setStatus("idle");
      }
    );
    stopRecognitionRef.current = stop;
  }, [status, sourceLang, targetLang, mode]);

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

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
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
        </View>

        {/* Main interaction card */}
        <View style={styles.interactCard}>
          <Text style={styles.modeContext}>
            {mode === "speak"
              ? `${myLang.flag} ${myLang.label} → ${theirLang.flag} ${theirLang.label}`
              : `${theirLang.flag} ${theirLang.label} → ${myLang.flag} ${myLang.label}`}
          </Text>

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
                      <Feather name="eye" size={11} color={ACCENT_TRAVEL} />
                      <Text style={styles.showToThemText}>
                        {mode === "speak" ? "Show to them" : "Your translation"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.translationTextLarge}>{translation}</Text>
                  <Pressable onPress={handleSpeak} style={styles.speakBtn}>
                    <Feather name="volume-2" size={15} color="#fff" />
                    <Text style={styles.speakBtnText}>Speak Again</Text>
                  </Pressable>
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

        {/* Type to Translate */}
        <View style={styles.typeSection}>
          <View style={styles.typeSectionHeader}>
            <Feather name="edit-3" size={13} color={ACCENT_TRAVEL} />
            <Text style={styles.typeSectionLabel}>Type to Translate</Text>
          </View>
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
            />
            <Pressable
              style={[styles.typeBtn, (!typeInput.trim() || typeLoading) && { opacity: 0.4 }]}
              onPress={handleTypeTranslate}
              disabled={!typeInput.trim() || typeLoading}
            >
              <Feather name={typeLoading ? "loader" : "send"} size={16} color="#fff" />
            </Pressable>
          </View>
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

        <View style={{ height: 120 }} />
      </ScrollView>
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
  },
  typeSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: ACCENT_TRAVEL,
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
});
