import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { GeneratedEntry, useVoice, VoiceMode } from "@/context/VoiceContext";

const MODE_CONFIG: Record<
  VoiceMode,
  {
    label: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  normal: { label: "Natural", color: Colors.normalMode, icon: "person-outline" },
  news: { label: "Anchor", color: Colors.newsMode, icon: "mic-outline" },
  story: { label: "Story", color: Colors.storyMode, icon: "book-outline" },
};

const MODE_SPEECH_PARAMS: Record<VoiceMode, { rate: number; pitch: number }> = {
  normal: { rate: 0.95, pitch: 1.05 },
  news: { rate: 0.85, pitch: 0.9 },
  story: { rate: 0.75, pitch: 1.1 },
};

function speakOnWeb(
  text: string,
  params: { rate: number; pitch: number },
  onDone: () => void
): boolean {
  if (
    Platform.OS !== "web" ||
    typeof window === "undefined" ||
    !window.speechSynthesis
  ) {
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = params.rate;
  utterance.pitch = params.pitch;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.localService && v.lang.startsWith("en")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];
  if (preferred) utterance.voice = preferred;
  utterance.onend = onDone;
  utterance.onerror = onDone;
  window.speechSynthesis.speak(utterance);
  return true;
}

function HistoryItem({
  entry,
  onDelete,
}: {
  entry: GeneratedEntry;
  onDelete: () => void;
}) {
  const modeConf = MODE_CONFIG[entry.mode];
  const speechParams = MODE_SPEECH_PARAMS[entry.mode];
  const [isPlaying, setIsPlaying] = useState(false);

  const date = new Date(entry.createdAt);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleReplay = () => {
    if (isPlaying) {
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
      } else {
        Speech.stop();
      }
      setIsPlaying(false);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsPlaying(true);
    const onDone = () => setIsPlaying(false);

    const handledByWeb = speakOnWeb(entry.text, speechParams, onDone);
    if (!handledByWeb) {
      Speech.speak(entry.text, {
        rate: speechParams.rate,
        pitch: speechParams.pitch,
        volume: 1,
        onDone,
        onError: onDone,
      });
    }
  };

  const handleDelete = () => {
    if (isPlaying) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      } else {
        Speech.stop();
      }
      setIsPlaying(false);
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert("Delete Entry", "Remove this entry from history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutLeft}
      style={styles.item}
    >
      <View style={[styles.modeStripe, { backgroundColor: modeConf.color }]} />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View
            style={[
              styles.modeBadge,
              { backgroundColor: modeConf.color + "22" },
            ]}
          >
            <Ionicons name={modeConf.icon} size={11} color={modeConf.color} />
            <Text style={[styles.modeBadgeText, { color: modeConf.color }]}>
              {modeConf.label}
            </Text>
          </View>
          <Text style={styles.itemDate}>
            {dateStr} · {timeStr}
          </Text>
        </View>
        <Text style={styles.itemText} numberOfLines={3}>
          {entry.text}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <Pressable
          onPress={handleReplay}
          style={[
            styles.replayBtn,
            isPlaying && { backgroundColor: modeConf.color + "22" },
          ]}
        >
          <Ionicons
            name={isPlaying ? "stop" : "play"}
            size={15}
            color={isPlaying ? modeConf.color : Colors.textSecondary}
          />
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={15} color={Colors.textTertiary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { history, removeFromHistory, clearHistory } = useVoice();
  const [filter, setFilter] = useState<VoiceMode | null>(null);

  const filtered = filter
    ? history.filter((e) => e.mode === filter)
    : history;
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleClearAll = () => {
    Alert.alert("Clear History", "Delete all history entries?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          clearHistory();
        },
      },
    ]);
  };

  const modes: (VoiceMode | null)[] = [null, "normal", "news", "story"];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>{history.length} saved speeches</Text>
        </View>
        {history.length > 0 && (
          <Pressable onPress={handleClearAll} style={styles.clearAllBtn}>
            <Ionicons
              name="trash-outline"
              size={16}
              color={Colors.textTertiary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        {modes.map((m) => {
          const isSelected = filter === m;
          const conf = m ? MODE_CONFIG[m] : null;
          return (
            <Pressable
              key={m ?? "all"}
              onPress={() => setFilter(m)}
              style={[
                styles.filterPill,
                isSelected && {
                  backgroundColor: (conf?.color ?? Colors.accent) + "22",
                  borderColor: conf?.color ?? Colors.accent,
                },
                !isSelected && styles.filterPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  {
                    color: isSelected
                      ? (conf?.color ?? Colors.accent)
                      : Colors.textSecondary,
                  },
                ]}
              >
                {m ? conf!.label : "All"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate speech in the Studio tab to see your history here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.replayHint}>
            <Ionicons name="play-circle-outline" size={13} color={Colors.textTertiary} />
            <Text style={styles.replayHintText}>
              Tap ▶ on any entry to replay the speech
            </Text>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HistoryItem
                entry={item}
                onDelete={() => removeFromHistory(item.id)}
              />
            )}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: bottomPad + 100 },
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  clearAllBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillInactive: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  replayHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
  },
  replayHintText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingTop: 4,
  },
  item: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
    alignItems: "center",
  },
  modeStripe: {
    width: 3,
    alignSelf: "stretch",
  },
  itemContent: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modeBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  itemDate: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  itemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  itemActions: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    paddingRight: 8,
  },
  replayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardBorder + "44",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
