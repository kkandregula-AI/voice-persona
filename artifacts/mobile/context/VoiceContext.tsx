import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type VoiceMode = "normal" | "news" | "story";

export interface VoiceSample {
  id: string;
  uri: string;
  duration: number;
  createdAt: number;
}

export interface GeneratedEntry {
  id: string;
  text: string;
  mode: VoiceMode;
  uri?: string;
  createdAt: number;
  duration?: number;
  cloned?: boolean;
}

interface VoiceContextType {
  voiceSample: VoiceSample | null;
  setVoiceSample: (sample: VoiceSample | null) => void;
  currentMode: VoiceMode;
  setCurrentMode: (mode: VoiceMode) => void;
  history: GeneratedEntry[];
  addToHistory: (entry: GeneratedEntry) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  currentText: string;
  setCurrentText: (t: string) => void;
  currentAudioUri: string | null;
  setCurrentAudioUri: (uri: string | null) => void;
  elevenLabsKey: string;
  setElevenLabsKey: (key: string) => void;
  clonedVoiceId: string | null;
  setClonedVoiceId: (id: string | null) => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

const STORAGE_KEYS = {
  VOICE_SAMPLE: "voice_persona_sample",
  HISTORY: "voice_persona_history",
  ELEVENLABS_KEY: "voice_persona_elevenlabs_key",
};

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [voiceSample, setVoiceSampleState] = useState<VoiceSample | null>(null);
  const [currentMode, setCurrentMode] = useState<VoiceMode>("normal");
  const [history, setHistory] = useState<GeneratedEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [currentAudioUri, setCurrentAudioUri] = useState<string | null>(null);
  const [elevenLabsKey, setElevenLabsKeyState] = useState("");
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [sampleJson, historyJson, elKey] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.VOICE_SAMPLE),
          AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.ELEVENLABS_KEY),
        ]);
        if (sampleJson) setVoiceSampleState(JSON.parse(sampleJson));
        if (historyJson) setHistory(JSON.parse(historyJson));
        if (elKey) setElevenLabsKeyState(elKey);
      } catch {}
    })();
  }, []);

  const setElevenLabsKey = useCallback(async (key: string) => {
    setElevenLabsKeyState(key);
    setClonedVoiceId(null);
    try {
      if (key) {
        await AsyncStorage.setItem(STORAGE_KEYS.ELEVENLABS_KEY, key);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.ELEVENLABS_KEY);
      }
    } catch {}
  }, []);

  const setVoiceSample = useCallback(async (sample: VoiceSample | null) => {
    setVoiceSampleState(sample);
    setClonedVoiceId(null);
    try {
      if (sample) {
        await AsyncStorage.setItem(STORAGE_KEYS.VOICE_SAMPLE, JSON.stringify(sample));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.VOICE_SAMPLE);
      }
    } catch {}
  }, []);

  const addToHistory = useCallback(async (entry: GeneratedEntry) => {
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 50);
      AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback(async (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        voiceSample,
        setVoiceSample,
        currentMode,
        setCurrentMode,
        history,
        addToHistory,
        removeFromHistory,
        clearHistory,
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
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within VoiceProvider");
  return ctx;
}
