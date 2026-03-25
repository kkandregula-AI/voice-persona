import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Colors } from "@/constants/colors";

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
}

export function RecordButton({
  isRecording,
  onPress,
  size = 88,
  color = Colors.accentSecondary,
}: RecordButtonProps) {
  const pulse = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulse.value = withTiming(0, { duration: 300 });
    }
  }, [isRecording]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0, 0.5]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.6]) }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 0.5, 1], [0, 0.3, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 2.1]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 12 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(
        isRecording
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Heavy
      );
    }
    onPress();
  };

  return (
    <View style={[styles.wrapper, { width: size * 2.5, height: size * 2.5 }]}>
      <Animated.View
        style={[
          styles.ring,
          ring2Style,
          { width: size, height: size, borderRadius: size / 2, borderColor: color },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          ringStyle,
          { width: size, height: size, borderRadius: size / 2, borderColor: color },
        ]}
      />
      <Animated.View style={buttonStyle}>
        <Pressable
          onPress={handlePress}
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isRecording ? color : Colors.card,
              borderColor: isRecording ? color : Colors.cardBorder,
              shadowColor: isRecording ? color : "transparent",
            },
          ]}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={size * 0.38}
            color={isRecording ? "#fff" : Colors.textSecondary}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
    opacity: 0,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
});
