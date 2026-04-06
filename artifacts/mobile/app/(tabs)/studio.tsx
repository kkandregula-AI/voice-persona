import { Ionicons, Feather } from "@expo/vector-icons";
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

type Emotion = "calm" | "energetic" | "serious" | "happy";

const EMOTIONS: { key: Emotion; label: string; icon: string; desc: string }[] = [
  { key: "calm",      label: "Calm",      icon: "😌", desc: "Slow & peaceful" },
  { key: "energetic", label: "Energetic", icon: "⚡", desc: "Fast & electric" },
  { key: "serious",   label: "Serious",   icon: "🎯", desc: "Focused & firm" },
  { key: "happy",     label: "Happy",     icon: "😊", desc: "Warm & upbeat" },
];

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

function getModeParams(mode: VoiceMode, sampleDuration: number, emotion: Emotion = "serious") {
  const base = sampleDuration > 0 ? Math.min(sampleDuration / 15, 1) : 0.5;
  const modeRate = mode === "news" ? 0.85 : mode === "story" ? 0.75 : 0.9 + base * 0.1;
  const modePitch = mode === "news" ? 0.9 + base * 0.1 : mode === "story" ? 1.0 + base * 0.15 : 1.0 + base * 0.05;

  const emotionAdj: Record<Emotion, { rateM: number; pitchO: number }> = {
    calm:      { rateM: 0.86, pitchO: -0.06 },
    energetic: { rateM: 1.20, pitchO: +0.10 },
    serious:   { rateM: 0.92, pitchO: -0.03 },
    happy:     { rateM: 1.12, pitchO: +0.08 },
  };
  const adj = emotionAdj[emotion];
  return {
    rate:   Math.max(0.1, Math.min(2.0, modeRate  * adj.rateM)),
    pitch:  Math.max(0.5, Math.min(2.0, modePitch + adj.pitchO)),
    volume: 1.0,
  };
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

const FEMALE_VOICE_NAMES = [
  "samantha", "victoria", "karen", "alice", "fiona", "moira", "tessa",
  "ava", "allison", "susan", "zoe", "kate", "veena", "kanya", "luciana",
  "milena", "yelena", "anna", "sara", "joana", "lekha", "sin-ji", "mei-jia",
  "amelie", "paulina", "carmit", "yuna", "kyoko", "siri female", "google uk english female",
];
const MALE_VOICE_NAMES = [
  "daniel", "alex", "tom", "fred", "xander", "rishi", "jorge", "thomas",
  "reed", "gordon", "junior", "diego", "eddy", "neel", "aaron", "arthur",
  "albert", "google uk english male", "google us english",
];

function voiceMatchesGender(voice: SpeechSynthesisVoice, gender: "female" | "male"): boolean {
  const nameLower = voice.name.toLowerCase();
  if (gender === "female") {
    if (nameLower.includes("female")) return true;
    if (nameLower.includes("male") && !nameLower.includes("female")) return false;
    return FEMALE_VOICE_NAMES.some((n) => nameLower.includes(n));
  } else {
    if (nameLower.includes("male") && !nameLower.includes("female")) return true;
    if (nameLower.includes("female")) return false;
    return MALE_VOICE_NAMES.some((n) => nameLower.includes(n));
  }
}

function speakOnWeb(
  text: string,
  params: { rate: number; pitch: number; volume: number },
  onDone: () => void,
  onError: () => void,
  gender: "female" | "male" = "female"
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
  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
  const preferred =
    englishVoices.find((v) => v.localService && voiceMatchesGender(v, gender)) ||
    englishVoices.find((v) => voiceMatchesGender(v, gender)) ||
    englishVoices.find((v) => v.localService) ||
    englishVoices[0] ||
    voices[0];
  if (preferred) utterance.voice = preferred;
  utterance.onend = onDone;
  utterance.onerror = onError;
  window.speechSynthesis.speak(utterance);
  return true;
}

function getApiBase(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:8080/api";
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
    if (!audioResponse.ok) throw new Error("Could not read voice sample. Please re-record.");
    const audioBlob = await audioResponse.blob();
    formData.append("audio", audioBlob, "voice_sample");
  }

  const res = await fetch(`${apiBase}/elevenlabs/generate`, {
    method: "POST",
    headers: { "x-elevenlabs-key": apiKey },
    body: formData,
  });

  if (!res.ok) {
    let msg = "Voice generation failed. Check your ElevenLabs key and try again.";
    try {
      const err = await res.json() as { error?: string };
      if (err?.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  const voiceId = res.headers.get("x-voice-id") || cachedVoiceId || "";
  const usedCloning = res.headers.get("x-used-cloning") === "true";
  const audioBuffer = await res.arrayBuffer();
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  const audioUrl = URL.createObjectURL(blob);

  return { audioUrl, voiceId, usedCloning };
}

async function checkElevenLabsKey(apiKey: string): Promise<{
  valid: boolean;
  plan?: string;
  canCloneVoice?: boolean;
  characterLimit?: number;
  charactersUsed?: number;
  error?: string;
}> {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/elevenlabs/check-key`, {
    headers: { "x-elevenlabs-key": apiKey },
  });
  return res.json() as Promise<{
    valid: boolean; plan?: string; canCloneVoice?: boolean;
    characterLimit?: number; charactersUsed?: number; error?: string;
  }>;
}

async function deleteElevenLabsVoice(voiceId: string, apiKey: string) {
  try {
    const apiBase = getApiBase();
    await fetch(`${apiBase}/elevenlabs/voices/${voiceId}`, {
      method: "DELETE",
      headers: { "x-elevenlabs-key": apiKey },
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
    body: JSON.stringify({ text, mode, emotion: "serious" }),
  });

  if (!response.ok) throw new Error("AI enhancement failed");
  const data = (await response.json()) as { enhancedText?: string };
  if (!data.enhancedText) throw new Error("Empty AI response");
  return data.enhancedText;
}

export default function VoiceStudioScreen() {
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
  const [gender, setGender] = useState<"female" | "male">("female");
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [lastUsedCloning, setLastUsedCloning] = useState<boolean | null>(null);
  const [keyCheckResult, setKeyCheckResult] = useState<{
    valid: boolean; plan?: string; canCloneVoice?: boolean;
    characterLimit?: number; charactersUsed?: number; error?: string;
  } | null>(null);
  const [emotion, setEmotion] = useState<Emotion>("serious");

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
    if (hasElevenLabs && !voiceSample) {
      Alert.alert("No Voice Sample", "Please record a voice sample first so your voice can be cloned.");
      return;
    }

    unlockAudioContext();
    setIsGenerating(true);
    setCurrentAudioUri(null);

    let usedElevenLabs = false;

    if (elevenLabsKey && Platform.OS === "web") {
      try {
        setCloneStatus(clonedVoiceId ? "done" : "cloning");
        const { audioUrl, voiceId, usedCloning } = await generateWithElevenLabs(
          voiceSample?.uri ?? null,
          currentText,
          currentMode,
          emotion,
          elevenLabsKey,
          clonedVoiceId,
          gender
        );
        if (usedCloning && voiceId) setClonedVoiceId(voiceId);
        setLastUsedCloning(usedCloning);
        setCloneStatus("done");
        setCurrentAudioUri(audioUrl);

        const entry: GeneratedEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
          text: currentText.trim(),
          mode: currentMode,
          uri: audioUrl,
          createdAt: Date.now(),
          cloned: usedCloning,
          source: "studio",
        };
        addToHistory(entry);
        setIsGenerating(false);
        usedElevenLabs = true;
      } catch (err: unknown) {
        setCloneStatus("error");
        const raw = err instanceof Error ? err.message : "";
        const isPermission =
          raw.toLowerCase().includes("permission") ||
          raw.toLowerCase().includes("missing the permission") ||
          raw.toLowerCase().includes("create_instant_voice_clone");
        const msg = isPermission
          ? "Your ElevenLabs key doesn't have voice cloning permission.\n\nVoice cloning requires a paid ElevenLabs plan (Starter $5/mo+).\n\nFalling back to system voice now."
          : (raw || "ElevenLabs failed.") + "\n\nFalling back to system voice.";
        Alert.alert("Voice Cloning Unavailable", msg);
      }
    }

    if (usedElevenLabs) return;

    const params = getModeParams(currentMode, voiceSample?.duration ?? 10, emotion);
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
      const handledByWeb = speakOnWeb(currentText, params, onDone, onError, gender);
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
        source: "studio",
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

          <Text style={styles.elLabel}>ElevenLabs API Key</Text>
          <View style={styles.elInputRow}>
            <TextInput
              style={styles.elInput}
              value={keyInput}
              onChangeText={(v) => { setKeyInput(v); setKeyCheckResult(null); }}
              placeholder="sk_..."
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

          <View style={styles.elBtnRow}>
            <Pressable
              onPress={async () => {
                const k = keyInput.trim();
                if (!k) return;
                setIsCheckingKey(true);
                setKeyCheckResult(null);
                try {
                  const result = await checkElevenLabsKey(k);
                  setKeyCheckResult(result);
                } catch {
                  setKeyCheckResult({ valid: false, error: "Could not reach server" });
                } finally {
                  setIsCheckingKey(false);
                }
              }}
              style={[styles.elSaveBtn, { backgroundColor: Colors.cardBorder, flex: 1 }]}
              disabled={isCheckingKey || !keyInput.trim()}
            >
              <Text style={styles.elSaveBtnText}>
                {isCheckingKey ? "Testing…" : "Test Key"}
              </Text>
            </Pressable>
            <Pressable
              onPress={saveKey}
              style={[styles.elSaveBtn, { backgroundColor: modeColor, flex: 1 }]}
            >
              <Text style={styles.elSaveBtnText}>Save Key</Text>
            </Pressable>
          </View>

          {keyCheckResult && (
            <View style={[
              styles.elInfoBox,
              { borderColor: keyCheckResult.valid ? (keyCheckResult.canCloneVoice ? Colors.success : Colors.warning) : Colors.error, marginTop: 8 }
            ]}>
              {keyCheckResult.valid ? (
                <>
                  <Ionicons
                    name={keyCheckResult.canCloneVoice ? "checkmark-circle" : "warning"}
                    size={16}
                    color={keyCheckResult.canCloneVoice ? Colors.success : Colors.warning}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.elInfoText, { color: keyCheckResult.canCloneVoice ? Colors.success : Colors.warning, fontWeight: "700" }]}>
                      {keyCheckResult.canCloneVoice
                        ? `Voice cloning enabled — ${keyCheckResult.plan ?? "paid"} plan`
                        : `Key valid, but cloning is NOT enabled`}
                    </Text>
                    {!keyCheckResult.canCloneVoice && (
                      <Text style={[styles.elInfoText, { marginTop: 6 }]}>
                        {"To fix this:\n1. Go to elevenlabs.io → Settings → API Keys\n2. Click \"Create API Key\"\n3. Enable the \"Use instant voice cloning\" permission\n4. Copy the new key and paste it above\n\nNote: Requires Starter plan ($5/mo+).\n\nUntil then, the app will use a high-quality ElevenLabs preset voice based on your gender selection below — much better than browser TTS."}
                      </Text>
                    )}
                    {keyCheckResult.characterLimit ? (
                      <Text style={[styles.elInfoText, { marginTop: 4, color: Colors.textSecondary }]}>
                        {`${(keyCheckResult.characterLimit - (keyCheckResult.charactersUsed ?? 0)).toLocaleString()} characters remaining this month`}
                      </Text>
                    ) : null}
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="close-circle" size={16} color={Colors.error} />
                  <Text style={[styles.elInfoText, { color: Colors.error }]}>
                    {keyCheckResult.error ?? "Invalid API key — double check and try again"}
                  </Text>
                </>
              )}
            </View>
          )}

          <Text style={[styles.elLabel, { marginTop: 14 }]}>Voice Gender</Text>
          <Text style={[styles.elInfoText, { marginBottom: 8, color: Colors.textSecondary }]}>
            Applied to both system TTS and ElevenLabs preset voices
          </Text>
          <View style={styles.elBtnRow}>
            <Pressable
              onPress={() => setGender("female")}
              style={[styles.elSaveBtn, { flex: 1, backgroundColor: gender === "female" ? modeColor : Colors.cardBorder }]}
            >
              <Text style={styles.elSaveBtnText}>Female</Text>
            </Pressable>
            <Pressable
              onPress={() => setGender("male")}
              style={[styles.elSaveBtn, { flex: 1, backgroundColor: gender === "male" ? modeColor : Colors.cardBorder }]}
            >
              <Text style={styles.elSaveBtnText}>Male</Text>
            </Pressable>
          </View>

          <View style={[styles.elActions, { marginTop: 12 }]}>
            <Pressable
              onPress={() =>
                Linking.openURL("https://elevenlabs.io/app/settings/api-keys")
              }
            >
              <Text style={styles.elGetKeyLink}>
                Create a new key at elevenlabs.io →
              </Text>
            </Pressable>
            {elevenLabsKey ? (
              <Pressable
                onPress={() => {
                  setKeyInput("");
                  setElevenLabsKey("");
                  setClonedVoiceId(null);
                  setKeyCheckResult(null);
                  setShowSettings(false);
                }}
                style={styles.elRemoveBtn}
              >
                <Text style={styles.elRemoveBtnText}>Remove Key</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.elDisclaimer}>
            Your key is stored locally on this device and never sent to our servers.
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
                <Text style={styles.title}>Voice Studio</Text>
                <Text style={styles.subtitle}>Write, refine, and generate speech in your own voice</Text>
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

          {/* How to use note */}
          <View style={styles.howItWorksCard}>
            <View style={styles.howItWorksRow}>
              <Feather name="info" size={13} color={Colors.accentSecondary} style={{ marginTop: 1 }} />
              <Text style={styles.howItWorksText}>
                <Text style={styles.howItWorksBold}>How to use: </Text>
                Record a short voice sample to clone your voice, then type or paste any text and choose a persona style (Default, Confident, or Calm). Tap <Text style={styles.howItWorksBold}>Generate Speech</Text> to hear your words spoken back in your own cloned voice.
              </Text>
            </View>
          </View>

          {/* ElevenLabs settings bar */}
          {isWebPlatform && (
            <View style={styles.elSettingsWrapper}>
              {elevenLabsSettingsCard}
            </View>
          )}

          {showVoiceGuide && !isRecording && hasElevenLabs && (
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
              {hasElevenLabs ? (
                <>
                  {isWide && (
                    <Text style={styles.sectionLabel}>Step 1 · Your Voice</Text>
                  )}
                  <View style={styles.recordSection}>{recordCard}</View>
                </>
              ) : (
                <View style={styles.recordSection}>
                  {isWide && (
                    <Text style={styles.sectionLabel}>Step 1 · Voice</Text>
                  )}
                  <View style={styles.recordNotNeededCard}>
                    <Ionicons
                      name="mic-off-outline"
                      size={32}
                      color={Colors.textTertiary}
                    />
                    <Text style={styles.recordNotNeededTitle}>
                      Recording Not Needed
                    </Text>
                    <Text style={styles.recordNotNeededText}>
                      Voice recording is only required for real voice cloning
                      via ElevenLabs. In system voice mode, just enter your text
                      below and tap Generate.
                    </Text>
                    <Pressable
                      onPress={() => setShowSettings(true)}
                      style={styles.recordNotNeededLink}
                    >
                      <Ionicons name="key-outline" size={13} color={Colors.accent} />
                      <Text style={styles.recordNotNeededLinkText}>
                        Add ElevenLabs key to enable voice cloning
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
              <View style={styles.section}>
                {!isWide && (
                  <Text style={styles.sectionLabel}>Voice Mode</Text>
                )}
                {isWide && (
                  <Text style={styles.sectionLabel}>
                    {hasElevenLabs ? "Step 2 · Persona Mode" : "Step 2 · Persona Mode"}
                  </Text>
                )}
                <ModeSelector
                  currentMode={currentMode}
                  onModeChange={setCurrentMode}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Emotion Engine</Text>
                <View style={styles.emotionGrid}>
                  {EMOTIONS.map((e) => (
                    <Pressable
                      key={e.key}
                      onPress={() => setEmotion(e.key)}
                      style={[
                        styles.emotionChip,
                        emotion === e.key && {
                          backgroundColor: modeColor + "22",
                          borderColor: modeColor,
                        },
                      ]}
                    >
                      <Text style={styles.emotionIcon}>{e.icon}</Text>
                      <View>
                        <Text style={[
                          styles.emotionLabel,
                          emotion === e.key && { color: modeColor },
                        ]}>
                          {e.label}
                        </Text>
                        <Text style={styles.emotionDesc}>{e.desc}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
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
                        {isEnhancing ? "Refining…" : "✦ Refine My Script"}
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
                  <AudioPlayer
                    uri={currentAudioUri}
                    label={lastUsedCloning === false
                      ? `ElevenLabs Preset Voice (${gender === "male" ? "Adam" : "Rachel"})`
                      : "Cloned Voice Output"}
                  />
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
                      isGenerating ||
                      (hasElevenLabs && !voiceSample) ||
                      !currentText.trim()
                    }
                    style={[
                      styles.generateBtn,
                      {
                        backgroundColor: modeColor,
                        opacity:
                          isGenerating ||
                          (hasElevenLabs && !voiceSample) ||
                          !currentText.trim()
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

                {hasElevenLabs && lastUsedCloning !== null && (
                  <View style={[
                    styles.cloningBadge,
                    { backgroundColor: lastUsedCloning ? Colors.success + "22" : Colors.warning + "22",
                      borderColor: lastUsedCloning ? Colors.success : Colors.warning }
                  ]}>
                    <Ionicons
                      name={lastUsedCloning ? "checkmark-circle" : "warning-outline"}
                      size={15}
                      color={lastUsedCloning ? Colors.success : Colors.warning}
                    />
                    <Text style={[styles.cloningBadgeText, { color: lastUsedCloning ? Colors.success : Colors.warning }]}>
                      {lastUsedCloning
                        ? "Your voice was cloned successfully"
                        : `Preset ${gender === "male" ? "male" : "female"} voice used — cloning not enabled on your key`}
                    </Text>
                  </View>
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

  howItWorksCard: {
    backgroundColor: Colors.accentSecondary + "0C",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.accentSecondary + "33",
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

  cloningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "center",
  },
  cloningBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },

  emotionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emotionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    flex: 1,
    minWidth: "45%",
  },
  emotionIcon: {
    fontSize: 18,
  },
  emotionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
  },
  emotionDesc: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 1,
  },

  reelToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  reelToggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  reelToggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    fontFamily: "Inter_700Bold",
  },
  reelToggleDesc: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  reelCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  reelTopicRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background,
    overflow: "hidden",
  },
  reelTopicInput: {
    color: Colors.text,
    fontSize: 14,
    padding: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 52,
  },
  reelMeta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  reelMetaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  reelMetaText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  reelGenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  reelGenerateBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    fontFamily: "Inter_700Bold",
  },
  reelScriptSection: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 12,
  },
  reelScriptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reelScriptLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Inter_500Medium",
  },
  templateBadge: {
    backgroundColor: "rgba(167,139,250,0.15)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  templateBadgeText: {
    fontSize: 10,
    color: Colors.accentTertiary,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  reelCopyBtn: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  reelScriptInput: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background,
    padding: 14,
    minHeight: 160,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  reelConvertBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  reelConvertBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
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
  recordNotNeededCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  recordNotNeededTitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  recordNotNeededText: {
    color: Colors.textTertiary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  recordNotNeededLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent + "40",
  },
  recordNotNeededLinkText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: "600",
  },
});
