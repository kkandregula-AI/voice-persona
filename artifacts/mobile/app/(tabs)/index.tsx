import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/colors";
import { useVoice } from "@/context/VoiceContext";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { voiceSample, elevenLabsKey, history } = useVoice();

  const topPad = Platform.OS === "web" ? 24 : insets.top + 8;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(50)} style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Feather name="mic" size={20} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.appName}>Voice Persona AI</Text>
              <Text style={styles.tagline}>Speak Once. Create Forever.</Text>
            </View>
          </View>
        </Animated.View>

        {/* Status strip */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.statusStrip}>
          <View style={styles.statusDot(!!elevenLabsKey)} />
          <Text style={styles.statusText}>
            {elevenLabsKey
              ? "ElevenLabs voice cloning active"
              : voiceSample
              ? "Voice sample ready · System voice mode"
              : "No voice sample · System voice mode"}
          </Text>
          <Text style={styles.historyCount}>{history.length} saved</Text>
        </Animated.View>

        {/* Hero cards */}
        <View style={styles.cardsRow}>
          {/* Voice Studio */}
          <Animated.View entering={FadeInDown.delay(150)} style={styles.cardWrapper}>
            <Pressable
              onPress={() => router.push("/(tabs)/studio")}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <LinearGradient
                colors={["#0D1B3E", "#0A2744", "#071F3A"]}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.cardIconWrap, { backgroundColor: "rgba(0,212,255,0.12)" }]}>
                  <Feather name="mic" size={28} color={Colors.accent} />
                </View>
                <Text style={styles.cardTitle}>Voice Studio</Text>
                <Text style={styles.cardDesc}>
                  Write your own script and turn it into speech
                </Text>
                <View style={[styles.cardBtn, { backgroundColor: Colors.accent }]}>
                  <Text style={styles.cardBtnText}>Go to Studio</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Creator Mode */}
          <Animated.View entering={FadeInDown.delay(220)} style={styles.cardWrapper}>
            <Pressable
              onPress={() => router.push("/(tabs)/create")}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <LinearGradient
                colors={["#2D1B4E", "#3D1060", "#2A0D52"]}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.cardIconWrap, { backgroundColor: "rgba(167,139,250,0.15)" }]}>
                  <Feather name="zap" size={28} color={Colors.accentTertiary} />
                </View>
                <Text style={styles.cardTitle}>Creator Mode</Text>
                <Text style={styles.cardDesc}>
                  Generate AI content from a topic with your voice
                </Text>
                <View style={[styles.cardBtn, { backgroundColor: Colors.accentTertiary }]}>
                  <Text style={styles.cardBtnText}>Go to Create</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionLabel}>Quick Actions</Text>
          <View style={styles.quickRow}>
            <Pressable
              style={styles.quickCard}
              onPress={() => router.push("/(tabs)/studio")}
            >
              <Feather name="edit-3" size={18} color={Colors.accent} />
              <Text style={styles.quickLabel}>Write Script</Text>
            </Pressable>
            <Pressable
              style={styles.quickCard}
              onPress={() => router.push("/(tabs)/create")}
            >
              <Feather name="film" size={18} color={Colors.accentTertiary} />
              <Text style={styles.quickLabel}>Generate Reel</Text>
            </Pressable>
            <Pressable
              style={styles.quickCard}
              onPress={() => router.push("/(tabs)/history")}
            >
              <Feather name="clock" size={18} color={Colors.accentSecondary} />
              <Text style={styles.quickLabel}>My History</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Feature list */}
        <Animated.View entering={FadeInDown.delay(380)} style={styles.section}>
          <Text style={styles.sectionLabel}>What you can do</Text>
          <View style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: f.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const FEATURES = [
  {
    title: "Voice Cloning",
    desc: "Record 15s of your voice → AI clones it via ElevenLabs",
    color: Colors.accent,
  },
  {
    title: "3 Speaking Modes",
    desc: "Natural, News Anchor, and Storytelling styles",
    color: Colors.accentTertiary,
  },
  {
    title: "Emotion Engine",
    desc: "Calm, Energetic, Serious, or Happy delivery",
    color: Colors.accentSecondary,
  },
  {
    title: "AI Script Generator",
    desc: "Generate viral reel scripts from just a topic",
    color: Colors.success,
  },
  {
    title: "Local History",
    desc: "All your generated audio saved with one-tap replay",
    color: Colors.warning,
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 18,
  },

  header: {
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,212,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  statusDot: (active: boolean) => ({
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: active ? Colors.success : Colors.warning,
  }),
  statusText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyCount: {
    fontSize: 11,
    color: Colors.textTertiary,
  },

  cardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    padding: 18,
    gap: 10,
    minHeight: 220,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 17,
    flex: 1,
  },
  cardBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  cardBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },

  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
    marginBottom: 10,
  },

  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
  },
  quickLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  featureList: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
