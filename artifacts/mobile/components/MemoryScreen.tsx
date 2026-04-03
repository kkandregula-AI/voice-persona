import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Colors } from "@/constants/colors";
import type { ConversationSession } from "@/utils/travelStorage";

const ACCENT = "#10B981";
const ACCENT_DIM = "#10B98122";
const ACCENT_BORDER = "#10B98155";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(ts).toLocaleDateString([], { day: "numeric", month: "short" });
}

function modeIcon(mode: string): "mic" | "headphones" | "radio" | "globe" {
  if (mode === "speak") return "mic";
  if (mode === "listen") return "headphones";
  if (mode === "live") return "radio";
  return "globe";
}

type Props = {
  sessions: ConversationSession[];
  searchQuery: string;
  onSearch: (q: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
  onExport: (session: ConversationSession) => void;
  onPin: (id: string, pinned: boolean) => void;
  onBack: () => void;
  topPad: number;
};

export function MemoryScreen({
  sessions,
  searchQuery,
  onSearch,
  onOpen,
  onDelete,
  onRename,
  onExport,
  onPin,
  onBack,
  topPad,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = searchQuery.trim()
    ? sessions.filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.srcLang.toLowerCase().includes(q) ||
          s.tgtLang.toLowerCase().includes(q) ||
          s.messages.some(
            (m) =>
              m.original.toLowerCase().includes(q) ||
              m.translated.toLowerCase().includes(q)
          )
        );
      })
    : sessions;

  function confirmDelete(session: ConversationSession) {
    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${session.title}"? This cannot be undone.`)) {
        onDelete(session.id);
      }
    } else {
      onDelete(session.id);
    }
  }

  const renderItem = ({ item: s }: { item: ConversationSession }) => {
    const isExpanded = expandedId === s.id;
    const snippet = s.messages[0]?.original ?? "";
    const preview = snippet.length > 70 ? snippet.slice(0, 67) + "…" : snippet;

    return (
      <Animated.View entering={FadeInDown} style={styles.card}>
        <Pressable onPress={() => onOpen(s.id)} style={styles.cardMain}>
          {/* Pin indicator */}
          {s.pinned && (
            <View style={styles.pinBadge}>
              <Feather name="bookmark" size={9} color={ACCENT} />
            </View>
          )}
          <View style={styles.cardTop}>
            <View style={styles.cardTitleRow}>
              <Feather name={modeIcon(s.mode)} size={12} color={Colors.textTertiary} />
              <Text style={styles.cardTitle} numberOfLines={1}>{s.title}</Text>
            </View>
            <Pressable
              onPress={() => setExpandedId(isExpanded ? null : s.id)}
              hitSlop={8}
              style={styles.moreBtn}
            >
              <Feather name="more-horizontal" size={16} color={Colors.textTertiary} />
            </Pressable>
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.langPill}>
              <Text style={styles.langPillText}>
                {s.srcLang} ↔ {s.tgtLang}
              </Text>
            </View>
            <View style={styles.metaDot} />
            <Feather name="message-square" size={10} color={Colors.textTertiary} />
            <Text style={styles.metaText}>{s.messages.length} messages</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{relativeTime(s.updatedAt)}</Text>
          </View>

          {!!preview && (
            <Text style={styles.snippet} numberOfLines={2}>{preview}</Text>
          )}
          {!s.messages.length && (
            <Text style={styles.emptySession}>Empty session</Text>
          )}
        </Pressable>

        {/* Expanded actions */}
        {isExpanded && (
          <Animated.View entering={FadeInDown} style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={() => onOpen(s.id)}>
              <Feather name="eye" size={13} color={ACCENT} />
              <Text style={[styles.actionText, { color: ACCENT }]}>Open</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => onRename(s.id)}>
              <Feather name="edit-2" size={13} color={Colors.textSecondary} />
              <Text style={styles.actionText}>Rename</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => onPin(s.id, !!s.pinned)}>
              <Feather name="bookmark" size={13} color={s.pinned ? ACCENT : Colors.textSecondary} />
              <Text style={[styles.actionText, s.pinned && { color: ACCENT }]}>
                {s.pinned ? "Unpin" : "Pin"}
              </Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => onExport(s)}>
              <Feather name="download" size={13} color={Colors.textSecondary} />
              <Text style={styles.actionText}>Export</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => confirmDelete(s)}>
              <Feather name="trash-2" size={13} color="#FF6B6B" />
              <Text style={[styles.actionText, { color: "#FF6B6B" }]}>Delete</Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Saved Conversations</Text>
          <Text style={styles.subtitle}>
            {filtered.length} of {sessions.length} conversation{sessions.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Feather name="search" size={14} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearch}
          placeholder="Search conversations…"
          placeholderTextColor={Colors.textTertiary}
          returnKeyType="search"
        />
        {!!searchQuery && (
          <Pressable onPress={() => onSearch("")} hitSlop={8}>
            <Feather name="x" size={14} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Empty state */}
      {sessions.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No saved conversations yet</Text>
          <Text style={styles.emptyBody}>
            Start a Travel Talk session to save your first conversation
          </Text>
        </View>
      )}

      {/* No results */}
      {sessions.length > 0 && filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="search" size={36} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptyBody}>Try a different search term</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 120 }} />}
      />
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
    gap: 12,
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
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 18,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardMain: {
    padding: 14,
  },
  pinBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: ACCENT_DIM,
    borderRadius: 4,
    padding: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  moreBtn: {
    padding: 4,
    marginLeft: 8,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  langPill: {
    backgroundColor: ACCENT_DIM,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
  },
  langPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: ACCENT,
    letterSpacing: 0.2,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textTertiary,
  },
  metaText: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: "500",
  },
  snippet: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    fontStyle: "italic",
  },
  emptySession: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: Colors.cardBorder,
  },
  actionText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
});
