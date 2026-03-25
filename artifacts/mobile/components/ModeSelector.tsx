import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Colors } from "@/constants/colors";
import { VoiceMode } from "@/context/VoiceContext";

interface ModeConfig {
  id: VoiceMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const MODES: ModeConfig[] = [
  {
    id: "normal",
    label: "Natural",
    description: "Conversational",
    icon: "person-outline",
    color: Colors.normalMode,
  },
  {
    id: "news",
    label: "Anchor",
    description: "Formal tone",
    icon: "mic-outline",
    color: Colors.newsMode,
  },
  {
    id: "story",
    label: "Story",
    description: "Expressive",
    icon: "book-outline",
    color: Colors.storyMode,
  },
];

interface ModePillProps {
  mode: ModeConfig;
  isSelected: boolean;
  onPress: () => void;
}

function ModePill({ mode, isSelected, onPress }: ModePillProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.94, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Animated.View style={[styles.pillWrapper, animStyle]}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.pill,
          isSelected && {
            backgroundColor: mode.color + "22",
            borderColor: mode.color,
          },
          !isSelected && styles.pillInactive,
        ]}
      >
        <Ionicons
          name={mode.icon}
          size={16}
          color={isSelected ? mode.color : Colors.textTertiary}
        />
        <View style={styles.pillText}>
          <Text
            style={[
              styles.pillLabel,
              { color: isSelected ? mode.color : Colors.textSecondary },
            ]}
          >
            {mode.label}
          </Text>
          <Text style={styles.pillDesc}>{mode.description}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface ModeSelectorProps {
  currentMode: VoiceMode;
  onModeChange: (mode: VoiceMode) => void;
}

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <View style={styles.container}>
      {MODES.map((mode) => (
        <ModePill
          key={mode.id}
          mode={mode}
          isSelected={currentMode === mode.id}
          onPress={() => onModeChange(mode.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
  },
  pillWrapper: {
    flex: 1,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillInactive: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
  },
  pillText: {
    flex: 1,
  },
  pillLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  pillDesc: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
});
