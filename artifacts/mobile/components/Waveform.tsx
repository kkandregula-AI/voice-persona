import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface WaveformProps {
  isActive: boolean;
  color: string;
  barCount?: number;
  height?: number;
}

interface WaveBarProps {
  delay: number;
  color: string;
  maxHeight: number;
  isActive: boolean;
  index: number;
}

function WaveBar({ delay, color, maxHeight, isActive, index }: WaveBarProps) {
  const barHeight = useSharedValue(4);

  useEffect(() => {
    if (isActive) {
      const randomDuration = 300 + (index % 5) * 80;
      const randomMax = maxHeight * (0.4 + (index % 7) * 0.09);
      barHeight.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(randomMax, { duration: randomDuration, easing: Easing.inOut(Easing.ease) }),
            withTiming(4, { duration: randomDuration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    } else {
      cancelAnimation(barHeight);
      barHeight.value = withTiming(4, { duration: 300 });
    }
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animStyle,
        { backgroundColor: color, opacity: isActive ? 1 : 0.3 },
      ]}
    />
  );
}

export function Waveform({ isActive, color, barCount = 32, height = 56 }: WaveformProps) {
  return (
    <View style={[styles.container, { height }]}>
      {Array.from({ length: barCount }).map((_, i) => (
        <WaveBar
          key={i}
          index={i}
          delay={i * 30}
          color={color}
          maxHeight={height}
          isActive={isActive}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
});
