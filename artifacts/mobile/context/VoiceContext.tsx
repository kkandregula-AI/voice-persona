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
}

const VoiceContext = createContext<VoiceContextType | null>(null);

const STORAGE_KEYS = {
  VOICE_SAMPLE: "voice_persona_sample",
  HISTORY: "voice_persona_history",
};

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [voiceSample, setVoiceSampleState] = useState<VoiceSample | null>(null);
  const [currentMode, setCurrentMode] = useState<VoiceMode>("normal");
  const [history, setHistory] = useState<GeneratedEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [currentAudioUri, setCurrentAudioUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [sampleJson, historyJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.VOICE_SAMPLE),
          AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
        ]);
        if (sampleJson) setVoiceSampleState(JSON.parse(sampleJson));
        if (historyJson) setHistory(JSON.parse(historyJson));
      } catch {}
    })();
  }, []);

  const setVoiceSample = useCallback(async (sample: VoiceSample | null) => {
    setVoiceSampleState(sample);
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
