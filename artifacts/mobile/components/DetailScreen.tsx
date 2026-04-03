import { Feather } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Colors } from "@/constants/colors";
import type { ConversationInsights, ConversationSession, SavedPhrase, SessionMessage } from "@/utils/travelStorage";

const ACCENT = "#10B981";
const ACCENT_DIM = "#10B98122";
const ACCENT_BORDER = "#10B98155";
const PURPLE = "#A78BFA";
const PURPLE_DIM = "#7C3AED22";
const PURPLE_BORDER = "#7C3AED55";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type Props = {
  session: ConversationSession;
  savedPhrases: SavedPhrase[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onExport: (session: ConversationSession) => void;
  onGenerateInsights: (session: ConversationSession) => void;
  onSavePhrase: (msg: SessionMessage, srcLang: string, tgtLang: string) => void;
  onDeleteSavedPhrase: (id: string) => void;
  insightsLoading: boolean;
  insightsError: string;
  topPad: number;
  speakFn: (text: string, langCode: string) => void;
  srcCode: string;
  tgtCode: string;
};

function InsightsBox({
  insights,
  loading,
  error,
  hasMessages,
  onGenerate,
}: {
  insights?: ConversationInsights;
  loading: boolean;
  error: string;
  hasMessages: boolean;
  onGenerate: () => void;
}) {
  if (!hasMessages) {
    return (
      <View style={styles.insightsEmpty}>
        <Text style={styles.insightsEmptyText}>No messages to analyze yet.</Text>
      </View>
    );
  }

  if (!insights && !loading) {
    return (
      <View style={styles.insightsGenBox}>
        <Feather name="cpu" size={20} color={PURPLE} />
        <Text style={styles.insightsGenTitle}>AI Conversation Insights</Text>
        <Text style={styles.insightsGenBody}>
          Generate a summary, key phrases, and topic detection from this conversation.
        </Text>
        {!!error && <Text style={styles.insightsErr}>{error}</Text>}
        <Pressable style={styles.insightsGenBtn} onPress={onGenerate}>
          <Feather name="zap" size={14} color="#fff" />
          <Text style={styles.insightsGenBtnText}>Generate Insights</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.insightsGenBox}>
        <Feather name="loader" size={20} color={PURPLE} />
        <Text style={styles.insightsGenTitle}>Analyzing conversation…</Text>
      </View>
    );
  }

  if (!insights) return null;

  return (
    <Animated.View entering={FadeInDown} style={styles.insightsBox}>
      <View style={styles.insightsTitleRow}>
        <Feather name="cpu" size={14} color={PURPLE} />
        <Text style={styles.insightsBoxTitle}>AI Insights</Text>
        <View style={styles.topicBadge}>
          <Text style={styles.topicText}>{insights.topic}</Text>
        </View>
      </View>

      <Text style={styles.insightsSummary}>{insights.summary}</Text>

      <View style={styles.insightsMeta}>
        <Feather name="repeat" size={11} color={Colors.textTertiary} />
        <Text style={styles.insightsMetaText}>{insights.totalExchanges} exchanges</Text>
      </View>

      {insights.keyPhrases.length > 0 && (
        <View style={styles.phrasesSection}>
          <Text style={styles.phrasesSectionTitle}>Key Phrases</Text>
          <View style={styles.phrasesWrap}>
            {insights.keyPhrases.map((p, i) => (
              <View key={i} style={styles.phraseChip}>
                <Text style={styles.phraseChipText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

export function DetailScreen({
  session,
  savedPhrases,
  onBack,
  onDelete,
  onExport,
  onGenerateInsights,
  onSavePhrase,
  onDeleteSavedPhrase,
  insightsLoading,
  insightsError,
  topPad,
  speakFn,
  srcCode,
  tgtCode,
}: Props) {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(savedPhrases.map((p) => p.id.replace("_phrase", ""))));
  const [activeTab, setActiveTab] = useState<"messages" | "insights" | "phrases">("messages");

  const sorted = [...session.messages].sort((a, b) => a.timestamp - b.timestamp);

  const handleSave = useCallback((msg: SessionMessage) => {
    const phraseId = msg.id + "_phrase";
    if (savedIds.has(msg.id)) {
      onDeleteSavedPhrase(phraseId);
      setSavedIds((prev) => { const n = new Set(prev); n.delete(msg.id); return n; });
    } else {
      onSavePhrase(msg, session.srcLang, session.tgtLang);
      setSavedIds((prev) => new Set(prev).add(msg.id));
    }
  }, [savedIds, onSavePhrase, onDeleteSavedPhrase, session]);

  function confirmDelete() {
    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${session.title}"? This cannot be undone.`)) {
        onDelete(session.id);
        onBack();
      }
    } else {
      onDelete(session.id);
      onBack();
    }
  }

  const ownSaved = savedPhrases.filter((p) => {
    const msgId = p.id.replace("_phrase", "");
    return sorted.some((m) => m.id === msgId);
  });

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{session.title}</Text>
          <Text style={styles.subtitle}>
            {session.srcLang} ↔ {session.tgtLang} · {sorted.length} messages
          </Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={() => onExport(session)} hitSlop={8}>
          <Feather name="download" size={16} color={Colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={confirmDelete} hitSlop={8}>
          <Feather name="trash-2" size={16} color="#FF6B6B" />
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(["messages", "insights", "phrases"] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "messages" ? `Messages (${sorted.length})` :
               tab === "insights" ? "Insights" :
               `Phrases (${ownSaved.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Messages tab */}
        {activeTab === "messages" && (
          <>
            {sorted.length === 0 && (
              <View style={styles.emptyState}>
                <Feather name="message-circle" size={36} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No messages yet</Text>
              </View>
            )}
            {sorted.map((msg) => {
              const isYou = msg.speaker === "you";
              const isSaved = savedIds.has(msg.id);
              const replayLang = isYou ? tgtCode : srcCode;

              return (
                <Animated.View
                  key={msg.id}
                  entering={FadeInDown}
                  style={[styles.msgCard, isYou ? styles.msgCardYou : styles.msgCardThem]}
                >
                  <View style={styles.msgHeader}>
                    <View style={[styles.speakerBadge, { backgroundColor: isYou ? PURPLE_DIM : ACCENT_DIM }]}>
                      <Feather
                        name={isYou ? "user" : "users"}
                        size={9}
                        color={isYou ? PURPLE : ACCENT}
                      />
                      <Text style={[styles.speakerText, { color: isYou ? PURPLE : ACCENT }]}>
                        {isYou ? "You" : "Other Person"}
                      </Text>
                    </View>
                    <Text style={styles.msgTime}>{formatTime(msg.timestamp)}</Text>
                  </View>

                  <Text style={styles.msgOriginal}>{msg.original}</Text>
                  <View style={styles.msgDivider} />
                  <Text style={[styles.msgTranslated, { color: isYou ? PURPLE : ACCENT }]}>
                    {msg.translated}
                  </Text>

                  {typeof msg.confidence === "number" && msg.confidence < 0.7 && (
                    <View style={styles.lowConfBadge}>
                      <Text style={styles.lowConfText}>Low confidence</Text>
                    </View>
                  )}

                  <View style={styles.msgActions}>
                    <Pressable
                      style={styles.msgActionBtn}
                      onPress={() => speakFn(msg.translated, replayLang)}
                    >
                      <Feather name="volume-2" size={12} color={Colors.textTertiary} />
                      <Text style={styles.msgActionText}>Replay</Text>
                    </Pressable>
                    <Pressable
                      style={styles.msgActionBtn}
                      onPress={() => {
                        const text = `${msg.original}\n→ ${msg.translated}`;
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          navigator.clipboard.writeText(text).catch(() => {});
                        }
                      }}
                    >
                      <Feather name="copy" size={12} color={Colors.textTertiary} />
                      <Text style={styles.msgActionText}>Copy</Text>
                    </Pressable>
                    <Pressable
                      style={styles.msgActionBtn}
                      onPress={() => handleSave(msg)}
                    >
                      <Feather
                        name={isSaved ? "star" : "star"}
                        size={12}
                        color={isSaved ? "#F59E0B" : Colors.textTertiary}
                      />
                      <Text style={[styles.msgActionText, isSaved && { color: "#F59E0B" }]}>
                        {isSaved ? "Saved" : "Save"}
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              );
            })}
          </>
        )}

        {/* Insights tab */}
        {activeTab === "insights" && (
          <InsightsBox
            insights={session.insights}
            loading={insightsLoading}
            error={insightsError}
            hasMessages={sorted.length > 0}
            onGenerate={() => onGenerateInsights(session)}
          />
        )}

        {/* Saved Phrases tab */}
        {activeTab === "phrases" && (
          <>
            {ownSaved.length === 0 && (
              <View style={styles.emptyState}>
                <Feather name="star" size={36} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No saved phrases</Text>
                <Text style={styles.emptyBody}>
                  Tap the star on any message to save it as a phrase
                </Text>
              </View>
            )}
            {ownSaved.map((p) => (
              <Animated.View key={p.id} entering={FadeInDown} style={styles.phraseCard}>
                <View style={styles.phraseCardHeader}>
                  <Feather name="star" size={12} color="#F59E0B" />
                  <Text style={styles.phraseCardLang}>{p.srcLang} → {p.tgtLang}</Text>
                  <Pressable
                    onPress={() => {
                      onDeleteSavedPhrase(p.id);
                      setSavedIds((prev) => {
                        const n = new Set(prev);
                        n.delete(p.id.replace("_phrase", ""));
                        return n;
                      });
                    }}
                    hitSlop={8}
                    style={{ marginLeft: "auto" }}
                  >
                    <Feather name="x" size={13} color={Colors.textTertiary} />
                  </Pressable>
                </View>
                <Text style={styles.phraseOriginal}>{p.original}</Text>
                <Text style={styles.phraseTranslated}>{p.translated}</Text>
              </Animated.View>
            ))}
          </>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  tabActive: {
    backgroundColor: PURPLE_DIM,
    borderColor: PURPLE_BORDER,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: PURPLE,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
  msgCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  msgCardYou: {
    backgroundColor: PURPLE_DIM,
    borderColor: PURPLE_BORDER,
  },
  msgCardThem: {
    backgroundColor: ACCENT_DIM,
    borderColor: ACCENT_BORDER,
  },
  msgHeader: {
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
  speakerText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  msgTime: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  msgOriginal: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 8,
  },
  msgDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginBottom: 8,
  },
  msgTranslated: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 4,
  },
  lowConfBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F59E0B22",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  lowConfText: {
    fontSize: 9,
    color: "#F59E0B",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  msgActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  msgActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  msgActionText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: "500",
  },
  // Insights
  insightsGenBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    padding: 20,
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  insightsGenTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
  },
  insightsGenBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
  insightsErr: {
    fontSize: 12,
    color: "#FF6B6B",
    textAlign: "center",
  },
  insightsGenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  insightsGenBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  insightsEmpty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  insightsEmptyText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  insightsBox: {
    backgroundColor: PURPLE_DIM,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  insightsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insightsBoxTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: PURPLE,
    flex: 1,
  },
  topicBadge: {
    backgroundColor: "#7C3AED33",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topicText: {
    fontSize: 10,
    fontWeight: "700",
    color: PURPLE,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  insightsSummary: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontWeight: "500",
  },
  insightsMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  insightsMetaText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: "500",
  },
  phrasesSection: {
    gap: 8,
  },
  phrasesSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  phrasesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  phraseChip: {
    backgroundColor: "#7C3AED22",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#7C3AED33",
  },
  phraseChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: PURPLE,
  },
  // Saved Phrases tab
  phraseCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F59E0B33",
    padding: 13,
    marginBottom: 8,
    gap: 6,
  },
  phraseCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  phraseCardLang: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: "600",
  },
  phraseOriginal: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  phraseTranslated: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
});
