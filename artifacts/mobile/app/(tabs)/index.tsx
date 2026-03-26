import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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

function getElevenLabsVoiceSettings(mode: VoiceMode) {
  switch (mode) {
    case "news":
      return { stability: 0.85, similarity_boost: 0.75, style: 0.1, use_speaker_boost: true };
    case "story":
      return { stability: 0.45, similarity_boost: 0.80, style: 0.75, use_speaker_boost: true };
    default:
      return { stability: 0.65, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true };
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

async function generateWithElevenLabs(
  voiceSampleUri: string,
  text: string,
  mode: VoiceMode,
  apiKey: string,
  cachedVoiceId: string | null
): Promise<{ audioUrl: string; voiceId: string }> {
  let voiceId = cachedVoiceId;

  if (!voiceId) {
    const audioResponse = await fetch(voiceSampleUri);
    const audioBlob = await audioResponse.blob();

    const formData = new FormData();
    formData.append("name", `VoicePersona_${Date.now()}`);
    formData.append("files", audioBlob, "voice_sample");
    formData.append("description", "Cloned for Voice Persona AI");

    const cloneRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: formData,
    });

    if (!cloneRes.ok) {
      let msg = "Voice cloning failed. Check your ElevenLabs key and try again.";
      try {
        const err = await cloneRes.json() as { detail?: { message?: string } };
        if (err?.detail?.message) msg = err.detail.message;
      } catch {}
      throw new Error(msg);
    }

    const cloneData = await cloneRes.json() as { voice_id: string };
    voiceId = cloneData.voice_id;
  }

  const voiceSettings = getElevenLabsVoiceSettings(mode);
  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: voiceSettings,
      }),
    }
  );

  if (!ttsRes.ok) {
    let msg = "Speech generation failed. Please try again.";
    try {
      const err = await ttsRes.json() as { detail?: { message?: string } };
      if (err?.detail?.message) msg = err.detail.message;
    } catch {}
    throw new Error(msg);
  }

  const audioBuffer = await ttsRes.arrayBuffer();
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const audioUrl = URL.createObjectURL(blob);

  return { audioUrl, voiceId };
}

async function deleteElevenLabsVoice(voiceId: string, apiKey: string) {
  try {
    await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: "DELETE",
      headers: { "xi-api-key": apiKey },
    });
  } catch {}
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
    elevenLabsKey,
    setElevenLabsKey,
    clonedVoiceId,
    setClonedVoiceId,
  } = useVoice();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(elevenLabsKey);
  const [showKey, setShowKey] = useState(false);
  const [cloneStatus, setCloneStatus] = useState<"idle" | "cloning" | "done" | "error">("idle");

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setKeyInput(elevenLabsKey);
  }, [elevenLabsKey]);

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
      setCloneStatus("idle");
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

  const handleReRecord = async () => {
    if (clonedVoiceId && elevenLabsKey) {
      deleteElevenLabsVoice(clonedVoiceId, elevenLabsKey);
    }
    setVoiceSample(null);
    setCloneStatus("idle");
    setShowVoiceGuide(false);
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

    if (elevenLabsKey && Platform.OS === "web") {
      try {
        setCloneStatus(clonedVoiceId ? "done" : "cloning");
        const { audioUrl, voiceId } = await generateWithElevenLabs(
          voiceSample.uri,
          currentText,
          currentMode,
          elevenLabsKey,
          clonedVoiceId
        );
        setClonedVoiceId(voiceId);
        setCloneStatus("done");
        setCurrentAudioUri(audioUrl);

        const entry: GeneratedEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
          text: currentText.trim(),
          mode: currentMode,
          uri: audioUrl,
          createdAt: Date.now(),
          cloned: true,
        };
        addToHistory(entry);
        setIsGenerating(false);
      } catch (err: unknown) {
        setCloneStatus("error");
        setIsGenerating(false);
        const msg =
          err instanceof Error ? err.message : "ElevenLabs generation failed.";
        Alert.alert("Voice Cloning Error", msg);
      }
      return;
    }

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
        cloned: false,
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

  const saveKey = () => {
    setElevenLabsKey(keyInput.trim());
    setShowSettings(false);
  };

  const modeColor =
    currentMode === "news"
      ? Colors.newsMode
      : currentMode === "story"
      ? Colors.storyMode
      : Colors.normalMode;

  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const hasElevenLabs = !!elevenLabsKey && Platform.OS === "web";
  const isWebPlatform = Platform.OS === "web";

  const elevenLabsSettingsCard = (
    <View style={styles.elSettingsCard}>
      <Pressable
        onPress={() => setShowSettings((s) => !s)}
        style={styles.elSettingsHeader}
      >
        <View style={styles.elSettingsLeft}>
          <View
            style={[
              styles.elStatusDot,
              { backgroundColor: hasElevenLabs ? "#22c55e" : "#f59e0b" },
            ]}
          />
          <View>
            <Text style={styles.elSettingsTitle}>
              {hasElevenLabs ? "Real Voice Cloning Active" : "Using System Voice"}
            </Text>
            <Text style={styles.elSettingsSubtitle}>
              {hasElevenLabs
                ? "ElevenLabs AI · Your actual voice is cloned"
                : "Add ElevenLabs key to clone your real voice"}
            </Text>
          </View>
        </View>
        <Ionicons
          name={showSettings ? "chevron-up" : "settings-outline"}
          size={18}
          color={Colors.textTertiary}
        />
      </Pressable>

      {showSettings && (
        <Animated.View entering={FadeInDown} style={styles.elSettingsBody}>
          {!hasElevenLabs && (
            <View style={styles.elInfoBox}>
              <Ionicons name="information-circle" size={16} color={Colors.accent} />
              <Text style={styles.elInfoText}>
                Without a key, the app uses your device's built-in voice engine — it{" "}
                <Text style={{ fontStyle: "italic" }}>does not</Text> clone your
                actual voice. Add a free ElevenLabs key for real voice cloning.
              </Text>
            </View>
          )}

          <Text style={styles.elLabel}>ElevenLabs API Key</Text>
          <View style={styles.elInputRow}>
            <TextInput
              style={styles.elInput}
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="sk-..."
              placeholderTextColor={Colors.textTertiary}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowKey((s) => !s)}
              style={styles.elEyeBtn}
            >
              <Ionicons
                name={showKey ? "eye-off" : "eye"}
                size={18}
                color={Colors.textTertiary}
              />
            </Pressable>
          </View>

          <View style={styles.elActions}>
            <Pressable
              onPress={() =>
                Linking.openURL("https://elevenlabs.io/app/settings/api-keys")
              }
            >
              <Text style={styles.elGetKeyLink}>
                Get a free key at elevenlabs.io →
              </Text>
            </Pressable>
            <View style={styles.elBtnRow}>
              {elevenLabsKey ? (
                <Pressable
                  onPress={() => {
                    setKeyInput("");
                    setElevenLabsKey("");
                    setClonedVoiceId(null);
                    setShowSettings(false);
                  }}
                  style={styles.elRemoveBtn}
                >
                  <Text style={styles.elRemoveBtnText}>Remove Key</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={saveKey}
                style={[styles.elSaveBtn, { backgroundColor: modeColor }]}
              >
                <Text style={styles.elSaveBtnText}>Save Key</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.elDisclaimer}>
            Your key is stored locally on this device only and never sent to
            our servers. Free tier gives 10,000 characters/month.
          </Text>
        </Animated.View>
      )}
    </View>
  );

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
              {clonedVoiceId ? " · Cloned ✓" : ""}
            </Text>
          </View>
          <Pressable onPress={handleReRecord}>
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

          {/* ElevenLabs settings bar */}
          {isWebPlatform && (
            <View style={styles.elSettingsWrapper}>
              {elevenLabsSettingsCard}
            </View>
          )}

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
              {hasElevenLabs && (
                <View style={[styles.elInfoBox, { marginTop: 8 }]}>
                  <Ionicons name="sparkles" size={14} color="#22c55e" />
                  <Text style={[styles.elInfoText, { color: "#22c55e" }]}>
                    ElevenLabs is active — your voice will be genuinely cloned!
                  </Text>
                </View>
              )}
              <Text style={styles.voiceGuideTip}>
                💡 Speak clearly in a quiet room. Aim for 10–20 seconds.
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

          <View style={isWide ? styles.twoCol : styles.oneCol}>
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

              {currentAudioUri && hasElevenLabs && (
                <Animated.View entering={FadeInDown} style={styles.section}>
                  <AudioPlayer uri={currentAudioUri} label="Cloned Voice Output" />
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
                          {hasElevenLabs && cloneStatus === "cloning"
                            ? "Cloning voice…"
                            : hasElevenLabs
                            ? "Generating clone…"
                            : "Generating…"}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons
                          name={hasElevenLabs ? "mic" : "sparkles"}
                          size={20}
                          color="#000"
                        />
                        <Text
                          style={[
                            styles.generateBtnText,
                            { color: "#000" },
                          ]}
                        >
                          {hasElevenLabs
                            ? "Generate with Your Voice"
                            : "Preview Speech"}
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}

                {!hasElevenLabs && isWebPlatform && (
                  <Text style={styles.fallbackNote}>
                    Using device's built-in voice engine — not your real voice.
                    Add an ElevenLabs key above for true voice cloning.
                  </Text>
                )}
              </View>

              <View style={styles.aiBadge}>
                <Ionicons
                  name="sparkles"
                  size={11}
                  color={Colors.textTertiary}
                />
                <Text style={styles.aiBadgeText}>
                  {hasElevenLabs
                    ? "Real voice cloning via ElevenLabs · AI text enhancement via Qwen3"
                    : "AI text enhancement via Qwen3 · Add ElevenLabs key for voice cloning"}
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

  webHeader: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 24,
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
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  webTagline: {
    color: Colors.textSecondary,
    fontSize: 13,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollWide: {
    paddingHorizontal: 32,
    maxWidth: 1020,
    alignSelf: "center",
    width: "100%",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  elSettingsWrapper: {
    marginVertical: 10,
  },
  elSettingsCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: "hidden",
  },
  elSettingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  elSettingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  elStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  elSettingsTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  elSettingsSubtitle: {
    color: Colors.textTertiary,
    fontSize: 11,
    marginTop: 1,
  },
  elSettingsBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 12,
  },
  elInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.accent + "15",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  elInfoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  elLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  elInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
  },
  elInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    paddingVertical: 10,
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  elEyeBtn: {
    padding: 6,
  },
  elActions: {
    marginTop: 10,
    gap: 8,
  },
  elGetKeyLink: {
    color: Colors.accent,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  elBtnRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  elSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  elSaveBtnText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "700",
  },
  elRemoveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error + "60",
  },
  elRemoveBtnText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: "600",
  },
  elDisclaimer: {
    color: Colors.textTertiary,
    fontSize: 11,
    marginTop: 10,
    lineHeight: 15,
  },

  voiceGuideCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accentSecondary + "40",
    padding: 16,
    marginBottom: 16,
  },
  voiceGuideHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  voiceGuideTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  voiceGuidePrompt: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  voiceGuideSentenceBox: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  voiceGuideSentence: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
  },
  voiceGuideTip: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 17,
  },
  voiceGuideActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  voiceGuideCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  voiceGuideCancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  voiceGuideStartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  voiceGuideStartText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },

  twoCol: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  oneCol: {
    flexDirection: "column",
  },
  leftCol: {
    flex: 1,
  },
  rightCol: {
    flex: 1,
  },
  fullWidth: {
    width: "100%",
  },

  recordSection: {
    marginBottom: 16,
  },
  recordCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  waveContainer: {
    width: "100%",
    marginBottom: 16,
  },
  recordInfo: {
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  recordHint: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: "center",
  },
  clearText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },

  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  textActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sampleBtn: {
    fontSize: 12,
    fontWeight: "600",
  },
  dotDivider: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  textInputWrapper: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    position: "relative",
  },
  textInput: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 110,
  },
  textInputWide: {
    minHeight: 160,
  },
  clearInput: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  charCount: {
    color: Colors.textTertiary,
    fontSize: 11,
    textAlign: "right",
    marginTop: 6,
  },

  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 0,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  fallbackNote: {
    color: Colors.textTertiary,
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
  },

  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 4,
    marginBottom: 8,
  },
  aiBadgeText: {
    color: Colors.textTertiary,
    fontSize: 11,
    textAlign: "center",
  },
});
