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

const SAMPLE_TEXTS: Record<VoiceMode, string> = {
  normal: "Welcome to Voice Persona AI. I can transform any text into speech that mirrors your unique vocal style.",
  news: "Breaking news: Scientists have discovered a new method of generating artificial intelligence voices that closely mimic human vocal patterns.",
  story: "Once upon a time, in a world where voices carried the weight of ancient magic, a single word could change everything forever.",
};

function getModeParams(mode: VoiceMode, sampleDuration: number) {
  const base = sampleDuration > 0 ? Math.min(sampleDuration / 15, 1) : 0.5;
  switch (mode) {
    case "news":
      return { rate: 0.85, pitch: 0.9 + base * 0.1 };
    case "story":
      return { rate: 0.75, pitch: 1.0 + base * 0.15 };
    default:
      return { rate: 0.9 + base * 0.1, pitch: 1.0 + base * 0.05 };
  }
}

export default function StudioScreen() {
  const insets = useSafeAreaInsets();
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
    } catch (err) {
      Alert.alert("Recording Error", "Could not start recording. Please try again.");
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
        const dur = status.isLoaded ? (status.durationMillis || 0) / 1000 : recordingDuration;
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

    setIsGenerating(true);
    setCurrentAudioUri(null);

    const params = getModeParams(currentMode, voiceSample.duration);

    try {
      setIsSpeaking(true);
      await Speech.speak(currentText, {
        rate: params.rate,
        pitch: params.pitch,
        onDone: () => {
          setIsSpeaking(false);
          setIsGenerating(false);
        },
        onError: () => {
          setIsSpeaking(false);
          setIsGenerating(false);
        },
      });

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
      Alert.alert("Generation Error", "Speech generation failed. Please try again.");
    }
  };

  const stopSpeech = () => {
    Speech.stop();
    setIsSpeaking(false);
    setIsGenerating(false);
  };

  const useSampleText = () => {
    setCurrentText(SAMPLE_TEXTS[currentMode]);
  };

  const modeColor =
    currentMode === "news"
      ? Colors.newsMode
      : currentMode === "story"
      ? Colors.storyMode
      : Colors.normalMode;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: topPad }]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Voice Persona</Text>
              <Text style={styles.subtitle}>AI Studio</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: voiceSample ? Colors.success : Colors.cardBorder }]} />
          </View>

          {/* Record Section */}
          <View style={styles.recordSection}>
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
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.recordInfo}>
                  <View style={[styles.liveBadge, { backgroundColor: Colors.accentSecondary + "22" }]}>
                    <View style={[styles.liveDot, { backgroundColor: Colors.accentSecondary }]} />
                    <Text style={[styles.liveText, { color: Colors.accentSecondary }]}>
                      REC {recordingDuration}s / 20s
                    </Text>
                  </View>
                </Animated.View>
              ) : voiceSample ? (
                <Animated.View entering={FadeInDown} style={styles.recordInfo}>
                  <View style={[styles.liveBadge, { backgroundColor: Colors.success + "22" }]}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    <Text style={[styles.liveText, { color: Colors.success }]}>
                      Voice sample ready · {Math.round(voiceSample.duration)}s
                    </Text>
                  </View>
                  <Pressable onPress={() => setVoiceSample(null)}>
                    <Text style={styles.clearText}>Re-record</Text>
                  </Pressable>
                </Animated.View>
              ) : (
                <View style={styles.recordInfo}>
                  <Text style={styles.recordHint}>Tap to record 10–20 seconds</Text>
                </View>
              )}
            </View>
          </View>

          {/* Mode Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Voice Mode</Text>
            <ModeSelector currentMode={currentMode} onModeChange={setCurrentMode} />
          </View>

          {/* Text Input */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Your Text</Text>
              <Pressable onPress={useSampleText}>
                <Text style={[styles.sampleBtn, { color: modeColor }]}>Use sample</Text>
              </Pressable>
            </View>
            <View style={[styles.textInputWrapper, { borderColor: Colors.cardBorder }]}>
              <TextInput
                style={styles.textInput}
                value={currentText}
                onChangeText={setCurrentText}
                placeholder="Enter text to convert to speech..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              {currentText.length > 0 && (
                <Pressable
                  onPress={() => setCurrentText("")}
                  style={styles.clearInput}
                >
                  <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                </Pressable>
              )}
            </View>
            <Text style={styles.charCount}>{currentText.length} characters</Text>
          </View>

          {/* Current Audio */}
          {currentAudioUri && (
            <Animated.View entering={FadeInDown} style={styles.section}>
              <AudioPlayer uri={currentAudioUri} label="Generated Audio" />
            </Animated.View>
          )}

          {/* Generate Button */}
          <View style={styles.section}>
            {isSpeaking ? (
              <Pressable onPress={stopSpeech} style={[styles.generateBtn, { backgroundColor: Colors.error + "22", borderColor: Colors.error }]}>
                <Ionicons name="stop-circle" size={20} color={Colors.error} />
                <Text style={[styles.generateBtnText, { color: Colors.error }]}>Stop</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={generateSpeech}
                disabled={isGenerating || !voiceSample || !currentText.trim()}
                style={[
                  styles.generateBtn,
                  {
                    backgroundColor: modeColor,
                    opacity: isGenerating || !voiceSample || !currentText.trim() ? 0.4 : 1,
                  },
                ]}
              >
                {isGenerating ? (
                  <>
                    <Waveform isActive color="#000" barCount={8} height={18} />
                    <Text style={[styles.generateBtnText, { color: "#000" }]}>Generating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#000" />
                    <Text style={[styles.generateBtnText, { color: "#000" }]}>Generate Speech</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>

          <View style={{ height: Platform.OS === "web" ? 100 : 100 }} />
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
  scroll: {
    paddingHorizontal: 20,
  },
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
  recordSection: {
    marginBottom: 24,
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
  waveContainer: {
    width: "100%",
  },
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
  },
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
  },
  sampleBtn: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
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
});
