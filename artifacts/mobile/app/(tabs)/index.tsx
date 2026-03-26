import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AudioPlayer } from "@/components/AudioPlayer";
import { ModeSelector } from "@/components/ModeSelector";
import { RecordButton } from "@/components/RecordButton";
import { Waveform } from "@/components/Waveform";
import { Colors } from "@/constants/colors";
import { GeneratedEntry, useVoice, VoiceMode } from "@/context/VoiceContext";

const VOICE_CAPTURE_PROMPT =
  "Hi! I'd like to capture your unique voice. Please read this sentence naturally in your own voice — just speak as you normally would:";

const VOICE_SAMPLE_SENTENCE =
  "The quick brown fox jumps over the lazy dog. I love the sound of my own voice, and today is a wonderful day to share it with the world.";

const SAMPLE_TEXTS: Record<VoiceMode, string> = {
  normal:
    "Welcome to Voice Persona AI. I can transform any text into speech that sounds uniquely like you.",
  news: "Breaking news: Scientists have discovered a new method of generating artificial intelligence voices that closely mimic human vocal patterns.",
  story:
    "Once upon a time, in a world where voices carried the weight of ancient magic, a single word could change everything forever.",
};

function getModeParams(mode: VoiceMode, sampleDuration: number) {
  const base = sampleDuration > 0 ? Math.min(sampleDuration / 15, 1) : 0.5;
  switch (mode) {
    case "news":
      return { rate: 0.85, pitch: 0.9 + base * 0.1, volume: 1.0 };
    case "story":
      return { rate: 0.75, pitch: 1.0 + base * 0.15, volume: 1.0 };
    default:
      return { rate: 0.9 + base * 0.1, pitch: 1.0 + base * 0.05, volume: 1.0 };
  }
}

function unlockAudioContext() {
  if (Platform.OS !== "web") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    setTimeout(() => ctx.close(), 500);
  } catch {}
}

function speakOnWeb(
  text: string,
  params: { rate: number; pitch: number; volume: number },
  onDone: () => void,
  onError: () => void
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
  utterance.onerror = onError;
  window.speechSynthesis.speak(utterance);
  return true;
}

async function enhanceTextWithAI(
  text: string,
  mode: VoiceMode
): Promise<string> {
  const baseUrl =
    Platform.OS === "web" && typeof window !== "undefined"
      ? `${window.location.origin}/api`
      : "http://localhost:8080/api";

  const response = await fetch(`${baseUrl}/ai/enhance-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode }),
  });

  if (!response.ok) throw new Error("AI enhancement failed");
  const data = (await response.json()) as { enhancedText?: string };
  if (!data.enhancedText) throw new Error("Empty AI response");
  return data.enhancedText;
}

export default function StudioScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === "web" && width >= 800;

  const {
    voiceSample,
    setVoiceSample,
    currentMode,
    setCurrentMode,
    addToHistory,
    isGenerating,
    setIsGenerating,
    currentText,
    setCurrentText,
    currentAudioUri,
    setCurrentAudioUri,
  } = useVoice();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      Speech.stop();
    };
  }, []);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Microphone Access",
          "Please grant microphone access to record your voice.",
          [{ text: "OK" }]
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setShowVoiceGuide(false);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => {
          if (d >= 20) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      Alert.alert(
        "Recording Error",
        "Could not start recording. Please try again."
      );
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      if (uri) {
        const dur = status.isLoaded
          ? (status.durationMillis || 0) / 1000
          : recordingDuration;
        setVoiceSample({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
          uri,
          duration: dur,
          createdAt: Date.now(),
        });
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch {}
    recordingRef.current = null;
  };

  const handleRecordPress = () => {
    if (isRecording) {
      stopRecording();
    } else if (!voiceSample) {
      setShowVoiceGuide(true);
    } else {
      startRecording();
    }
  };

  const generateSpeech = async () => {
    if (!currentText.trim()) {
      Alert.alert("No Text", "Please enter some text to generate speech.");
      return;
    }
    if (!voiceSample) {
      Alert.alert("No Voice Sample", "Please record a voice sample first.");
      return;
    }
    unlockAudioContext();
    setIsGenerating(true);
    setCurrentAudioUri(null);

    const params = getModeParams(currentMode, voiceSample.duration);

    const onDone = () => {
      setIsSpeaking(false);
      setIsGenerating(false);
    };
    const onError = () => {
      setIsSpeaking(false);
      setIsGenerating(false);
    };

    try {
      setIsSpeaking(true);
      const handledByWeb = speakOnWeb(currentText, params, onDone, onError);
      if (!handledByWeb) {
        await Speech.speak(currentText, {
          rate: params.rate,
          pitch: params.pitch,
          volume: params.volume,
          onDone,
          onError,
        });
      }
      const entry: GeneratedEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        text: currentText.trim(),
        mode: currentMode,
        createdAt: Date.now(),
      };
      addToHistory(entry);
    } catch {
      setIsGenerating(false);
      setIsSpeaking(false);
      Alert.alert(
        "Generation Error",
        "Speech generation failed. Please try again."
      );
    }
  };

  const stopSpeech = () => {
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
    } else {
      Speech.stop();
    }
    setIsSpeaking(false);
    setIsGenerating(false);
  };

  const enhanceWithAI = async () => {
    if (!currentText.trim()) {
      Alert.alert("No Text", "Enter some text first, then enhance it with AI.");
      return;
    }
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceTextWithAI(currentText, currentMode);
      setCurrentText(enhanced);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert(
        "AI Unavailable",
        "Could not enhance text right now. Try again shortly."
      );
    } finally {
      setIsEnhancing(false);
    }
  };

  const modeColor =
    currentMode === "news"
      ? Colors.newsMode
      : currentMode === "story"
      ? Colors.storyMode
      : Colors.normalMode;

  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const recordCard = (
    <View style={styles.recordCard}>
      <View style={styles.waveContainer}>
        <Waveform
          isActive={isRecording}
          color={Colors.accentSecondary}
          barCount={28}
          height={48}
        />
      </View>

      <RecordButton
        isRecording={isRecording}
        onPress={handleRecordPress}
        color={Colors.accentSecondary}
      />

      {isRecording ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.recordInfo}
        >
          <View
            style={[
              styles.liveBadge,
              { backgroundColor: Colors.accentSecondary + "22" },
            ]}
          >
            <View
              style={[
                styles.liveDot,
                { backgroundColor: Colors.accentSecondary },
              ]}
            />
            <Text style={[styles.liveText, { color: Colors.accentSecondary }]}>
              REC {recordingDuration}s / 20s
            </Text>
          </View>
          <Text style={styles.recordHint}>Speak naturally — read the sentence above</Text>
        </Animated.View>
      ) : voiceSample ? (
        <Animated.View entering={FadeInDown} style={styles.recordInfo}>
          <View
            style={[
              styles.liveBadge,
              { backgroundColor: Colors.success + "22" },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={Colors.success}
            />
            <Text style={[styles.liveText, { color: Colors.success }]}>
              Voice captured · {Math.round(voiceSample.duration)}s
            </Text>
          </View>
          <Pressable onPress={() => { setVoiceSample(null); setShowVoiceGuide(false); }}>
            <Text style={styles.clearText}>Re-record</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <View style={styles.recordInfo}>
          <Text style={styles.recordHint}>
            Tap to capture your voice tone
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: topPad }]}>
        {/* Web header bar */}
        {isWide && (
          <View style={styles.webHeader}>
            <View style={styles.webHeaderInner}>
              <Text style={styles.webLogo}>🎙 Voice Persona AI</Text>
              <Text style={styles.webTagline}>
                Transform text into your voice persona
              </Text>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            isWide && styles.scrollWide,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Mobile header */}
          {!isWide && (
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Voice Persona</Text>
                <Text style={styles.subtitle}>AI Studio</Text>
              </View>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: voiceSample
                      ? Colors.success
                      : Colors.cardBorder,
                  },
                ]}
              />
            </View>
          )}

          {/* Voice Guide Modal Card */}
          {showVoiceGuide && !isRecording && (
            <Animated.View entering={FadeInDown} style={styles.voiceGuideCard}>
              <View style={styles.voiceGuideHeader}>
                <Ionicons name="mic" size={20} color={Colors.accentSecondary} />
                <Text style={styles.voiceGuideTitle}>Capture Your Voice</Text>
              </View>
              <Text style={styles.voiceGuidePrompt}>{VOICE_CAPTURE_PROMPT}</Text>
              <View style={styles.voiceGuideSentenceBox}>
                <Text style={styles.voiceGuideSentence}>
                  "{VOICE_SAMPLE_SENTENCE}"
                </Text>
              </View>
              <Text style={styles.voiceGuideTip}>
                💡 Speak clearly in a quiet room for best results. Aim for 10–20 seconds.
              </Text>
              <View style={styles.voiceGuideActions}>
                <Pressable
                  onPress={() => setShowVoiceGuide(false)}
                  style={styles.voiceGuideCancelBtn}
                >
                  <Text style={styles.voiceGuideCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={startRecording}
                  style={[
                    styles.voiceGuideStartBtn,
                    { backgroundColor: Colors.accentSecondary },
                  ]}
                >
                  <Ionicons name="mic" size={16} color="#000" />
                  <Text style={styles.voiceGuideStartText}>
                    I'm Ready — Start Recording
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Two-column layout on wide screens */}
          <View style={isWide ? styles.twoCol : styles.oneCol}>
            {/* Left column: Record + Mode */}
            <View style={isWide ? styles.leftCol : styles.fullWidth}>
              {isWide && (
                <Text style={styles.sectionLabel}>Step 1 · Your Voice</Text>
              )}
              <View style={styles.recordSection}>{recordCard}</View>
              <View style={styles.section}>
                {!isWide && (
                  <Text style={styles.sectionLabel}>Voice Mode</Text>
                )}
                {isWide && (
                  <Text style={styles.sectionLabel}>Step 2 · Persona Mode</Text>
                )}
                <ModeSelector
                  currentMode={currentMode}
                  onModeChange={setCurrentMode}
                />
              </View>
            </View>

            {/* Right column: Text + Generate */}
            <View style={isWide ? styles.rightCol : styles.fullWidth}>
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  {isWide ? (
                    <Text style={styles.sectionLabel}>
                      Step 3 · Your Text
                    </Text>
                  ) : (
                    <Text style={styles.sectionLabel}>Your Text</Text>
                  )}
                  <View style={styles.textActions}>
                    <Pressable
                      onPress={() => setCurrentText(SAMPLE_TEXTS[currentMode])}
                    >
                      <Text style={[styles.sampleBtn, { color: modeColor }]}>
                        Use sample
                      </Text>
                    </Pressable>
                    <Text style={styles.dotDivider}>·</Text>
                    <Pressable onPress={enhanceWithAI} disabled={isEnhancing}>
                      <Text
                        style={[
                          styles.sampleBtn,
                          {
                            color: isEnhancing
                              ? Colors.textTertiary
                              : Colors.accent,
                          },
                        ]}
                      >
                        {isEnhancing ? "Enhancing…" : "✦ AI Enhance"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <View
                  style={[
                    styles.textInputWrapper,
                    { borderColor: Colors.cardBorder },
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, isWide && styles.textInputWide]}
                    value={currentText}
                    onChangeText={setCurrentText}
                    placeholder="Enter text to convert to speech…"
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                    numberOfLines={isWide ? 8 : 5}
                    textAlignVertical="top"
                  />
                  {currentText.length > 0 && (
                    <Pressable
                      onPress={() => setCurrentText("")}
                      style={styles.clearInput}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={Colors.textTertiary}
                      />
                    </Pressable>
                  )}
                </View>
                <Text style={styles.charCount}>
                  {currentText.length} characters
                </Text>
              </View>

              {currentAudioUri && (
                <Animated.View entering={FadeInDown} style={styles.section}>
                  <AudioPlayer uri={currentAudioUri} label="Generated Audio" />
                </Animated.View>
              )}

              <View style={styles.section}>
                {isSpeaking ? (
                  <Pressable
                    onPress={stopSpeech}
                    style={[
                      styles.generateBtn,
                      {
                        backgroundColor: Colors.error + "22",
                        borderColor: Colors.error,
                      },
                    ]}
                  >
                    <Ionicons
                      name="stop-circle"
                      size={20}
                      color={Colors.error}
                    />
                    <Text
                      style={[styles.generateBtnText, { color: Colors.error }]}
                    >
                      Stop
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={generateSpeech}
                    disabled={
                      isGenerating || !voiceSample || !currentText.trim()
                    }
                    style={[
                      styles.generateBtn,
                      {
                        backgroundColor: modeColor,
                        opacity:
                          isGenerating || !voiceSample || !currentText.trim()
                            ? 0.4
                            : 1,
                      },
                    ]}
                  >
                    {isGenerating ? (
                      <>
                        <Waveform
                          isActive
                          color="#000"
                          barCount={8}
                          height={18}
                        />
                        <Text
                          style={[
                            styles.generateBtnText,
                            { color: "#000" },
                          ]}
                        >
                          Generating…
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={20} color="#000" />
                        <Text
                          style={[
                            styles.generateBtnText,
                            { color: "#000" },
                          ]}
                        >
                          Generate Speech
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>

              {/* AI badge */}
              <View style={styles.aiBadge}>
                <Ionicons
                  name="sparkles"
                  size={11}
                  color={Colors.textTertiary}
                />
                <Text style={styles.aiBadgeText}>
                  Powered by Qwen3 via OpenRouter · Text enhancement available
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* Web header */
  webHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  webHeaderInner: {
    maxWidth: 960,
    alignSelf: "center",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  webLogo: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  webTagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },

  /* Scroll */
  scroll: {
    paddingHorizontal: 20,
  },
  scrollWide: {
    paddingHorizontal: 32,
    paddingTop: 24,
    maxWidth: 960,
    alignSelf: "center",
    width: "100%",
  },

  /* Mobile header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 8,
  },

  /* Layout columns */
  twoCol: {
    flexDirection: "row",
    gap: 32,
    alignItems: "flex-start",
  },
  oneCol: {
    flexDirection: "column",
  },
  leftCol: {
    flex: 1,
    minWidth: 280,
    maxWidth: 380,
  },
  rightCol: {
    flex: 1.2,
  },
  fullWidth: {
    width: "100%",
  },

  /* Voice guide */
  voiceGuideCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accentSecondary + "44",
    padding: 20,
    marginBottom: 20,
    gap: 12,
  },
  voiceGuideHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceGuideTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  voiceGuidePrompt: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  voiceGuideSentenceBox: {
    backgroundColor: Colors.accentSecondary + "11",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentSecondary,
  },
  voiceGuideSentence: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    lineHeight: 22,
    fontStyle: "italic",
  },
  voiceGuideTip: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    lineHeight: 18,
  },
  voiceGuideActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  voiceGuideCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  voiceGuideCancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  voiceGuideStartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  voiceGuideStartText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#000",
  },

  /* Record */
  recordSection: {
    marginBottom: 20,
  },
  recordCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  waveContainer: { width: "100%" },
  recordInfo: {
    alignItems: "center",
    gap: 8,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  clearText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
  },
  recordHint: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  /* Section */
  section: {
    marginBottom: 20,
    gap: 10,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  textActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sampleBtn: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  dotDivider: {
    fontSize: 12,
    color: Colors.textTertiary,
  },

  /* Text input */
  textInputWrapper: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 120,
    position: "relative",
  },
  textInput: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    flex: 1,
  },
  textInputWide: {
    minHeight: 160,
  },
  clearInput: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },

  /* Generate */
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  generateBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },

  /* AI badge */
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
    marginTop: -8,
  },
  aiBadgeText: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
});
