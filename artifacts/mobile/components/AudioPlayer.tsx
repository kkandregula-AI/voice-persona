import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Colors } from "@/constants/colors";

interface AudioPlayerProps {
  uri: string;
  label?: string;
  compact?: boolean;
}

export function AudioPlayer({ uri, label, compact = false }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scale = useSharedValue(1);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sound]);

  const loadAndPlay = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          if (status.positionMillis >= status.durationMillis! - 200) {
            await sound.setPositionAsync(0);
          }
          await sound.playAsync();
          setIsPlaying(true);
          startTracking(sound);
        }
      }
      return;
    }
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
          }
        }
      );
      setSound(newSound);
      setIsPlaying(true);
      startTracking(newSound);
    } catch (e) {
      Alert.alert("Playback Error", "Could not play this audio.");
    }
  };

  const startTracking = (s: Audio.Sound) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      const status = await s.getStatusAsync();
      if (status.isLoaded) {
        setPosition(status.positionMillis || 0);
        setDuration(status.durationMillis || 0);
      }
    }, 200);
  };

  const handleDownload = async () => {
    if (Platform.OS === "web") {
      const a = document.createElement("a");
      a.href = uri;
      a.download = `voice_persona_${Date.now()}.m4a`;
      a.click();
      return;
    }
    try {
      const dest = FileSystem.documentDirectory + `voice_persona_${Date.now()}.m4a`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      Alert.alert("Saved", "Audio saved to your files.");
    } catch {
      Alert.alert("Error", "Could not save audio.");
    }
  };

  const buttonAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progress = duration > 0 ? position / duration : 0;
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Pressable
          onPress={loadAndPlay}
          style={[styles.compactPlay, { backgroundColor: Colors.accent + "22" }]}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={16}
            color={Colors.accent}
          />
        </Pressable>
        <View style={styles.compactBar}>
          <View style={[styles.compactProgress, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.compactTime}>{formatTime(duration)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.playerRow}>
        <Animated.View style={buttonAnim}>
          <Pressable
            onPress={loadAndPlay}
            style={[
              styles.playButton,
              { backgroundColor: isPlaying ? Colors.accent : Colors.card },
            ]}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={22}
              color={isPlaying ? "#000" : Colors.text}
            />
          </Pressable>
        </Animated.View>
        <View style={styles.progressArea}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
        <Pressable onPress={handleDownload} style={styles.downloadButton}>
          <Ionicons name="download-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  progressArea: {
    flex: 1,
    gap: 4,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  downloadButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactPlay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  compactBar: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.cardBorder,
    borderRadius: 2,
    overflow: "hidden",
  },
  compactProgress: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  compactTime: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    minWidth: 30,
  },
});
