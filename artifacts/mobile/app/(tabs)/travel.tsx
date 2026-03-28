import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
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
import Animated, { FadeInDown } from "react-native-reanimated";
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

  try {
    const mmRes = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    );
    if (mmRes.ok) {
      const mmData = (await mmRes.json()) as {
        responseStatus: number;
        responseData?: { translatedText?: string };
      };
      const translated = mmData.responseData?.translatedText ?? "";
      if (mmData.responseStatus === 200 && translated && translated !== text) {
        return translated;
      }
    }
  } catch {
    // fall through to AI
  }

  const res = await fetch(`${getApiBase()}/ai/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, fromLang: fromCode, toLang: toCode }),
  });
  const data = (await res.json()) as { translation?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Translation failed");
  return data.translation ?? "";
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
  const [conversation, setConversation] = useState<ConvEntry[]>([]);
  const [showMyPicker, setShowMyPicker] = useState(false);
  const [showTheirPicker, setShowTheirPicker] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [typeInput, setTypeInput] = useState("");
  const [typeTranslation, setTypeTranslation] = useState("");
  const [typeLoading, setTypeLoading] = useState(false);

  const handleSwap = () => {
    setMyLang(theirLang);
    setTheirLang(myLang);
    setTypeTranslation("");
  };

  const handleQuickPhrase = async (phrase: string) => {
    try {
      const result = await translateText(phrase, myLang.code, theirLang.code);
      speakText(result, theirLang.code);
      setConversation((prev) => [
        {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          speaker: "you",
          original: phrase,
          translated: result,
          originalLang: myLang.label,
          translatedLang: theirLang.label,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 30));
    } catch {
      // silent — phrase chips show no error state
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
      setConversation((prev) => [
        {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          speaker: "you",
          original: text,
          translated: result,
          originalLang: myLang.label,
          translatedLang: theirLang.label,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 30));
    } catch (err) {
      setTypeTranslation("⚠ " + (err instanceof Error ? err.message : "Translation failed"));
    } finally {
      setTypeLoading(false);
    }
  };

  const handleCopyConv = (entry: ConvEntry) => {
    const text = `${entry.original}\n→ ${entry.translated}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const handleReplayConv = (entry: ConvEntry) => {
    speakText(entry.translated, theirLang.code);
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
            <Text style={styles.subtitle}>Type a phrase. Let AI bridge the language.</Text>
          </View>
          <View style={[styles.headerBadge, { backgroundColor: ACCENT_TRAVEL_DIM, borderColor: ACCENT_TRAVEL_BORDER }]}>
            <Feather name="globe" size={16} color={ACCENT_TRAVEL} />
          </View>
        </View>

        {/* Language selector */}
        <View style={styles.langSelector}>
          <Pressable style={styles.langBtn} onPress={() => setShowMyPicker(true)}>
            <Text style={styles.langFlagLarge}>{myLang.flag}</Text>
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
            <Text style={styles.langFlagLarge}>{theirLang.flag}</Text>
            <View>
              <Text style={styles.langBtnLabel}>Their Language</Text>
              <Text style={styles.langBtnValue}>{theirLang.label}</Text>
            </View>
            <Feather name="chevron-down" size={14} color={Colors.textTertiary} style={{ marginLeft: "auto" }} />
          </Pressable>
        </View>

        {/* Direction indicator */}
        <View style={styles.directionRow}>
          <Text style={styles.directionText}>
            {myLang.flag} {myLang.label}
          </Text>
          <Feather name="arrow-right" size={14} color={ACCENT_TRAVEL} />
          <Text style={styles.directionText}>
            {theirLang.flag} {theirLang.label}
          </Text>
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
              <Text style={styles.typeResultText}>{typeTranslation}</Text>
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
    marginBottom: 10,
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
  langFlagLarge: {
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

  directionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  directionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
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
  typeResultText: {
    fontSize: 22,
    color: Colors.text,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.3,
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
  langFlag: {
    fontSize: 22,
  },
  langLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
  },
});
