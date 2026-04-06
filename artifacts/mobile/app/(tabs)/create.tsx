import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AudioPlayer } from "@/components/AudioPlayer";
import { Waveform } from "@/components/Waveform";
import { Colors } from "@/constants/colors";
import { GeneratedEntry, useVoice, VoiceMode } from "@/context/VoiceContext";

type ContentType = "reel" | "news" | "speech" | "podcast";
type Tone = "motivational" | "professional" | "emotional";
type Emotion = "calm" | "energetic" | "serious" | "happy";

const CONTENT_TYPES: { key: ContentType; label: string; icon: string; desc: string; mode: VoiceMode }[] = [
  { key: "reel",    label: "Reel",    icon: "film",      desc: "6-line viral script",     mode: "story"  },
  { key: "news",    label: "News",    icon: "radio",     desc: "News anchor style",        mode: "news"   },
  { key: "speech",  label: "Speech",  icon: "mic",       desc: "Formal presentation",      mode: "normal" },
  { key: "podcast", label: "Podcast", icon: "headphones",desc: "Podcast intro or segment", mode: "normal" },
];

const TONES: { key: Tone; label: string; icon: string; emotion: Emotion }[] = [
  { key: "motivational", label: "Motivational", icon: "zap",    emotion: "energetic" },
  { key: "professional", label: "Professional", icon: "briefcase", emotion: "serious" },
  { key: "emotional",    label: "Emotional",    icon: "heart",  emotion: "happy"    },
];

const FEMALE_VOICE_NAMES = [
  "samantha","victoria","karen","alice","fiona","moira","tessa","ava","allison",
  "susan","zoe","kate","veena","kanya","luciana","milena","yelena","anna","sara",
  "joana","lekha","sin-ji","mei-jia","amelie","paulina","carmit","yuna","kyoko",
  "siri female","google uk english female",
];
const MALE_VOICE_NAMES = [
  "daniel","alex","tom","fred","xander","rishi","jorge","thomas","reed","gordon",
  "junior","diego","eddy","neel","aaron","arthur","albert","google uk english male","google us english",
];

function voiceMatchesGender(voice: SpeechSynthesisVoice, gender: "female" | "male"): boolean {
  const n = voice.name.toLowerCase();
  if (gender === "female") {
    if (n.includes("female")) return true;
    if (n.includes("male") && !n.includes("female")) return false;
    return FEMALE_VOICE_NAMES.some((x) => n.includes(x));
  }
  if (n.includes("male") && !n.includes("female")) return true;
  if (n.includes("female")) return false;
  return MALE_VOICE_NAMES.some((x) => n.includes(x));
}

function speakOnWeb(
  text: string,
  params: { rate: number; pitch: number; volume: number },
  onDone: () => void,
  onError: () => void,
  gender: "female" | "male" = "female"
): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined" || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = params.rate;
  utterance.pitch = params.pitch;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
  const preferred =
    englishVoices.find((v) => v.localService && voiceMatchesGender(v, gender)) ||
    englishVoices.find((v) => voiceMatchesGender(v, gender)) ||
    englishVoices.find((v) => v.localService) ||
    englishVoices[0] || voices[0];
  if (preferred) utterance.voice = preferred;
  utterance.onend = onDone;
  utterance.onerror = onError;
  window.speechSynthesis.speak(utterance);
  return true;
}

function unlockAudioContext() {
  if (Platform.OS !== "web") return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    setTimeout(() => ctx.close(), 500);
  } catch {}
}

function getApiBase(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") return `${window.location.origin}/api`;
  return "http://localhost:8080/api";
}

function getModeParams(mode: VoiceMode, emotion: Emotion) {
  const modeRate = mode === "news" ? 0.85 : mode === "story" ? 0.75 : 0.92;
  const modePitch = mode === "news" ? 0.92 : mode === "story" ? 1.05 : 1.0;
  const adj: Record<Emotion, { rateM: number; pitchO: number }> = {
    calm:      { rateM: 0.86, pitchO: -0.06 },
    energetic: { rateM: 1.20, pitchO: +0.10 },
    serious:   { rateM: 0.92, pitchO: -0.03 },
    happy:     { rateM: 1.12, pitchO: +0.08 },
  };
  const a = adj[emotion];
  return {
    rate:   Math.max(0.1, Math.min(2.0, modeRate * a.rateM)),
    pitch:  Math.max(0.5, Math.min(2.0, modePitch + a.pitchO)),
    volume: 1.0,
  };
}

async function generateCreatorScript(
  topic: string, contentType: ContentType, tone: Tone
): Promise<{ script: string; usedTemplate: boolean }> {
  const typeToMode: Record<ContentType, string> = {
    reel: "story", news: "news", speech: "normal", podcast: "normal",
  };
  const toneToEmotion: Record<Tone, string> = {
    motivational: "energetic", professional: "serious", emotional: "happy",
  };
  const res = await fetch(`${getApiBase()}/ai/generate-reel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: topic.trim(),
      mode: typeToMode[contentType],
      emotion: toneToEmotion[tone],
      contentType,
      tone,
    }),
  });
  const data = await res.json() as { script?: string; error?: string; usedTemplate?: boolean };
  if (!res.ok) throw new Error(data.error ?? "Failed to generate script");
  return { script: data.script ?? "", usedTemplate: !!data.usedTemplate };
}

async function generateWithElevenLabs(
  voiceSampleUri: string | null,
  text: string,
  mode: VoiceMode,
  emotion: Emotion,
  apiKey: string,
  cachedVoiceId: string | null,
  gender: "male" | "female"
): Promise<{ audioUrl: string; voiceId: string; usedCloning: boolean }> {
  const apiBase = getApiBase();
  const formData = new FormData();
  formData.append("text", text);
  formData.append("mode", mode);
  formData.append("emotion", emotion);
  formData.append("gender", gender);
  if (cachedVoiceId) {
    formData.append("voiceId", cachedVoiceId);
  } else if (voiceSampleUri) {
    const audioResponse = await fetch(voiceSampleUri);
    if (!audioResponse.ok) throw new Error("Could not read voice sample.");
    formData.append("audio", await audioResponse.blob(), "voice_sample");
  }
  const res = await fetch(`${apiBase}/elevenlabs/generate`, {
    method: "POST",
    headers: { "x-elevenlabs-key": apiKey },
    body: formData,
  });
  if (!res.ok) {
    let msg = "Voice generation failed.";
    try { const e = await res.json() as { error?: string }; if (e?.error) msg = e.error; } catch {}
    throw new Error(msg);
  }
  const voiceId = res.headers.get("x-voice-id") || cachedVoiceId || "";
  const usedCloning = res.headers.get("x-used-cloning") === "true";
  const blob = new Blob([await res.arrayBuffer()], { type: "audio/mpeg" });
  return { audioUrl: URL.createObjectURL(blob), voiceId, usedCloning };
}

const ACCENT_PURPLE = Colors.accentTertiary;

export default function CreatorModeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { voiceSample, elevenLabsKey, clonedVoiceId, setClonedVoiceId, addToHistory } = useVoice();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<ContentType>("reel");
  const [tone, setTone] = useState<Tone>("motivational");
  const [script, setScript] = useState("");
  const [usedTemplate, setUsedTemplate] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [gender] = useState<"female" | "male">("female");

  const selectedType = CONTENT_TYPES.find((c) => c.key === contentType)!;
  const selectedTone = TONES.find((t) => t.key === tone)!;
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const handleGenerateScript = async () => {
    if (!topic.trim()) {
      Alert.alert("Enter a Topic", "Type what your content should be about.");
      return;
    }
    setIsGeneratingScript(true);
    setScript("");
    setAudioUri(null);
    setUsedTemplate(false);
    try {
      const result = await generateCreatorScript(topic, contentType, tone);
      setScript(result.script);
      setUsedTemplate(result.usedTemplate);
      setStep(2);
    } catch {
      Alert.alert("Generation Failed", "Could not generate script. Try again shortly.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!script.trim()) return;
    unlockAudioContext();
    setIsGeneratingVoice(true);
    setAudioUri(null);

    const mode = selectedType.mode;
    const emotion = selectedTone.emotion;
    let usedElevenLabs = false;

    if (elevenLabsKey && Platform.OS === "web") {
      try {
        const { audioUrl, voiceId, usedCloning } = await generateWithElevenLabs(
          voiceSample?.uri ?? null,
          script,
          mode,
          emotion,
          elevenLabsKey,
          clonedVoiceId,
          gender
        );
        if (usedCloning && voiceId) setClonedVoiceId(voiceId);
        setAudioUri(audioUrl);
        addToHistory({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
          text: script.trim(),
          mode,
          uri: audioUrl,
          createdAt: Date.now(),
          cloned: usedCloning,
          source: "creator",
          title: topic.trim(),
        });
        usedElevenLabs = true;
        setStep(3);
      } catch (err) {
        const raw = err instanceof Error ? err.message : "";
        Alert.alert("Voice Generation Failed", (raw || "Error") + "\n\nFalling back to system voice.");
      }
    }

    if (!usedElevenLabs) {
      const params = getModeParams(mode, emotion);
      const onDone = () => { setIsSpeaking(false); setIsGeneratingVoice(false); };
      const onError = () => { setIsSpeaking(false); setIsGeneratingVoice(false); };
      setIsSpeaking(true);
      const handled = speakOnWeb(script, params, onDone, onError, gender);
      if (!handled) {
        await Speech.speak(script, { rate: params.rate, pitch: params.pitch, volume: 1, onDone, onError });
      }
      addToHistory({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        text: script.trim(),
        mode,
        createdAt: Date.now(),
        cloned: false,
        source: "creator",
        title: topic.trim(),
      });
      setStep(3);
    }

    if (usedElevenLabs) setIsGeneratingVoice(false);
  };

  const handleUseInStudio = () => {
    router.push("/(tabs)/studio");
  };

  const handleReset = () => {
    setStep(1);
    setTopic("");
    setScript("");
    setAudioUri(null);
    setUsedTemplate(false);
  };

  const scriptLines = script.split("\n").filter((l) => l.trim());

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Creator Mode</Text>
              <Text style={styles.subtitle}>Generate ready-to-speak content from just a topic</Text>
            </View>
            <View style={[styles.modeBadge, { backgroundColor: ACCENT_PURPLE + "22", borderColor: ACCENT_PURPLE + "44" }]}>
              <Feather name="zap" size={14} color={ACCENT_PURPLE} />
            </View>
          </View>

          {/* How to use note */}
          <View style={styles.howItWorksCard}>
            <View style={styles.howItWorksRow}>
              <Feather name="info" size={13} color={ACCENT_PURPLE} style={{ marginTop: 1 }} />
              <Text style={styles.howItWorksText}>
                <Text style={styles.howItWorksBold}>How to use: </Text>
                Enter any topic and let AI write a ready-to-speak script for you. Review and edit the script if needed, then tap <Text style={styles.howItWorksBold}>Generate Speech</Text> to hear it spoken aloud in your cloned voice persona.
              </Text>
            </View>
          </View>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <View style={styles.stepItem}>
                  <View style={[
                    styles.stepDot,
                    step >= s && { backgroundColor: ACCENT_PURPLE },
                    step === s && { borderColor: ACCENT_PURPLE, borderWidth: 2 },
                  ]}>
                    {step > s ? (
                      <Feather name="check" size={10} color="#fff" />
                    ) : (
                      <Text style={[styles.stepNum, step >= s && { color: "#fff" }]}>{s}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, step === s && { color: ACCENT_PURPLE }]}>
                    {s === 1 ? "Topic" : s === 2 ? "Script" : "Voice"}
                  </Text>
                </View>
                {s < 3 && (
                  <View style={[styles.stepLine, step > s && { backgroundColor: ACCENT_PURPLE }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* ---- STEP 1: TOPIC ---- */}
          {step === 1 && (
            <Animated.View entering={FadeInDown} style={styles.section}>
              <Text style={styles.sectionLabel}>Enter Topic</Text>
              <TextInput
                style={styles.topicInput}
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. 'Why discipline beats motivation'"
                placeholderTextColor={Colors.textTertiary}
                multiline
                textAlignVertical="top"
                returnKeyType="done"
              />

              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Content Type</Text>
              <View style={styles.chipGrid}>
                {CONTENT_TYPES.map((ct) => (
                  <Pressable
                    key={ct.key}
                    onPress={() => setContentType(ct.key)}
                    style={[
                      styles.typeChip,
                      contentType === ct.key && {
                        backgroundColor: ACCENT_PURPLE + "22",
                        borderColor: ACCENT_PURPLE,
                      },
                    ]}
                  >
                    <Feather
                      name={ct.icon as keyof typeof Feather.glyphMap}
                      size={16}
                      color={contentType === ct.key ? ACCENT_PURPLE : Colors.textSecondary}
                    />
                    <View>
                      <Text style={[styles.chipLabel, contentType === ct.key && { color: ACCENT_PURPLE }]}>
                        {ct.label}
                      </Text>
                      <Text style={styles.chipDesc}>{ct.desc}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Tone</Text>
              <View style={styles.toneRow}>
                {TONES.map((t) => (
                  <Pressable
                    key={t.key}
                    onPress={() => setTone(t.key)}
                    style={[
                      styles.toneChip,
                      tone === t.key && {
                        backgroundColor: ACCENT_PURPLE + "22",
                        borderColor: ACCENT_PURPLE,
                      },
                    ]}
                  >
                    <Feather
                      name={t.icon as keyof typeof Feather.glyphMap}
                      size={14}
                      color={tone === t.key ? ACCENT_PURPLE : Colors.textSecondary}
                    />
                    <Text style={[styles.toneLabel, tone === t.key && { color: ACCENT_PURPLE }]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleGenerateScript}
                disabled={isGeneratingScript || !topic.trim()}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: !topic.trim() ? Colors.cardBorder : ACCENT_PURPLE },
                  { opacity: !topic.trim() ? 0.6 : 1 },
                ]}
              >
                {isGeneratingScript ? (
                  <>
                    <Waveform isActive color="#fff" barCount={6} height={16} />
                    <Text style={styles.primaryBtnText}>Generating Script…</Text>
                  </>
                ) : (
                  <>
                    <Feather name="zap" size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>Generate Script</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          )}

          {/* ---- STEP 2: SCRIPT ---- */}
          {step === 2 && script ? (
            <Animated.View entering={FadeInDown} style={styles.section}>
              <View style={styles.scriptHeader}>
                <Text style={styles.sectionLabel}>Generated Script</Text>
                <View style={styles.scriptMeta}>
                  {usedTemplate && (
                    <View style={styles.templateBadge}>
                      <Text style={styles.templateBadgeText}>template</Text>
                    </View>
                  )}
                  <View style={[styles.typePill, { borderColor: ACCENT_PURPLE + "44" }]}>
                    <Text style={[styles.typePillText, { color: ACCENT_PURPLE }]}>
                      {selectedType.label} · {selectedTone.label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Topic pill */}
              <View style={styles.topicPill}>
                <Feather name="tag" size={12} color={Colors.textTertiary} />
                <Text style={styles.topicPillText} numberOfLines={1}>{topic}</Text>
              </View>

              {/* Script lines */}
              <View style={styles.scriptCard}>
                {scriptLines.map((line, i) => (
                  <View key={i} style={[styles.scriptLine, i < scriptLines.length - 1 && styles.scriptLineBorder]}>
                    <View style={[styles.lineNum, {
                      backgroundColor: i === 0 ? ACCENT_PURPLE + "33" : i === scriptLines.length - 1 ? Colors.accentSecondary + "33" : Colors.cardBorder,
                    }]}>
                      <Text style={[styles.lineNumText, {
                        color: i === 0 ? ACCENT_PURPLE : i === scriptLines.length - 1 ? Colors.accentSecondary : Colors.textTertiary,
                      }]}>
                        {i === 0 ? "↗" : i === scriptLines.length - 1 ? "★" : `${i + 1}`}
                      </Text>
                    </View>
                    <Text style={styles.scriptLineText}>{line}</Text>
                  </View>
                ))}
              </View>

              {/* Editable raw */}
              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Edit Script</Text>
              <TextInput
                style={styles.scriptEdit}
                value={script}
                onChangeText={setScript}
                multiline
                textAlignVertical="top"
                placeholderTextColor={Colors.textTertiary}
              />

              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryBtn} onPress={() => setStep(1)}>
                  <Feather name="arrow-left" size={15} color={Colors.textSecondary} />
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </Pressable>

                <Pressable
                  onPress={handleGenerateVoice}
                  disabled={isGeneratingVoice}
                  style={[styles.primaryBtn, { flex: 1, backgroundColor: ACCENT_PURPLE }]}
                >
                  {isGeneratingVoice || isSpeaking ? (
                    <>
                      <Waveform isActive color="#fff" barCount={6} height={16} />
                      <Text style={styles.primaryBtnText}>Generating Voice…</Text>
                    </>
                  ) : (
                    <>
                      <Feather name="mic" size={15} color="#fff" />
                      <Text style={styles.primaryBtnText}>Generate Voice</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          ) : null}

          {/* ---- STEP 3: DONE ---- */}
          {step === 3 && (
            <Animated.View entering={FadeInDown} style={styles.section}>
              <View style={styles.doneHeader}>
                <View style={styles.doneIcon}>
                  <Feather name="check-circle" size={32} color={Colors.success} />
                </View>
                <Text style={styles.doneTitle}>Content Ready!</Text>
                <Text style={styles.doneSub}>
                  {selectedType.label} · {selectedTone.label} · {topic}
                </Text>
              </View>

              {audioUri && (
                <Animated.View entering={FadeInDown.delay(100)} style={{ marginBottom: 16 }}>
                  <AudioPlayer uri={audioUri} label={`${selectedType.label} Voice Output`} />
                </Animated.View>
              )}

              {!audioUri && (
                <View style={styles.systemVoiceNote}>
                  <Feather name="volume-2" size={14} color={Colors.textTertiary} />
                  <Text style={styles.systemVoiceNoteText}>
                    Playing via system voice. Add an ElevenLabs key in Studio settings for real voice cloning.
                  </Text>
                </View>
              )}

              <View style={styles.scriptPreview}>
                <Text style={styles.sectionLabel}>Script</Text>
                <Text style={styles.scriptPreviewText}>{script}</Text>
              </View>

              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryBtn} onPress={handleUseInStudio}>
                  <Feather name="edit-3" size={15} color={Colors.textSecondary} />
                  <Text style={styles.secondaryBtnText}>Use in Studio</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryBtn, { flex: 1, backgroundColor: ACCENT_PURPLE }]}
                  onPress={handleReset}
                >
                  <Feather name="plus" size={15} color="#fff" />
                  <Text style={styles.primaryBtnText}>New Content</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 18, paddingBottom: 20 },

  howItWorksCard: {
    backgroundColor: ACCENT_PURPLE + "0C",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: ACCENT_PURPLE + "33",
    marginBottom: 4,
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
    marginBottom: 16,
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
  modeBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textTertiary,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: "600",
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 6,
    marginBottom: 16,
  },

  section: { gap: 0 },

  sectionLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
    marginBottom: 8,
  },

  topicInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 72,
    lineHeight: 22,
    marginBottom: 0,
  },

  chipGrid: {
    gap: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  chipDesc: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },

  toneRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 0,
  },
  toneChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: 10,
  },
  toneLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 20,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  scriptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  scriptMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  templateBadge: {
    backgroundColor: ACCENT_PURPLE + "22",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: ACCENT_PURPLE + "44",
  },
  templateBadgeText: {
    fontSize: 10,
    color: ACCENT_PURPLE,
    fontWeight: "600",
  },
  typePill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    backgroundColor: Colors.card,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: "600",
  },

  topicPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  topicPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },

  scriptCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
    marginBottom: 14,
  },
  scriptLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  scriptLineBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  lineNum: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  lineNumText: {
    fontSize: 10,
    fontWeight: "700",
  },
  scriptLineText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },

  scriptEdit: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 90,
    lineHeight: 20,
  },

  doneHeader: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.success + "22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
  },
  doneSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  systemVoiceNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    marginBottom: 14,
  },
  systemVoiceNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textTertiary,
    lineHeight: 17,
  },

  scriptPreview: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    marginBottom: 4,
  },
  scriptPreviewText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
