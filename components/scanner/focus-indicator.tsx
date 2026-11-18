import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type FocusIndicatorProps = {
  point: { x: number; y: number; key: number } | null;
};

export function FocusIndicator({ point }: FocusIndicatorProps) {
  const scale = useSharedValue(1.35);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!point) return;

    scale.value = 1.35;
    opacity.value = 1;

    scale.value = withTiming(1, { duration: 180 });
    opacity.value = withSequence(
      withTiming(1, { duration: 750 }),
      withTiming(0, { duration: 300 })
    );
  }, [point?.key]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!point) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: point.x - 32,
          top: point.y - 32,
          width: 64,
          height: 64,
        },
        animatedStyle,
      ]}
      className="rounded-xl border-2 border-amber-400"
    />
  );
}