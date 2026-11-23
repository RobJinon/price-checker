import { Lock } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';

type FocusIndicatorProps = {
  point: { x: number; y: number; key: number } | null;
  isLocked?: boolean;
  exposure?: number;
  minExposure?: number;
  maxExposure?: number;
};

export function FocusIndicator({
  point,
  isLocked = false
}: FocusIndicatorProps) {
  const scale = useSharedValue(1.35);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!point) return;

    scale.value = 1.35;
    opacity.value = 1;

    scale.value = withTiming(1, { duration: 180 });

    if (isLocked) {
      // Locked focus remains persistently visible until unlocked
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      // Unlocked focus remains visible for 2.5s then smoothly fades out
      opacity.value = withSequence(
        withTiming(1, { duration: 180 }),
        withDelay(2500, withTiming(0, { duration: 350 }))
      );
    }
  }, [point?.key, isLocked]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!point) return null;

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute h-16 w-16"
      style={[
        {
          left: point.x - 32,
          top: point.y - 32,
        },
        animatedStyle,
      ]}
    >
      {/* AF Lock Badge above reticle using React Native Reusables Badge */}
      {isLocked && (
        <Badge
          variant="default"
          className="absolute -top-6 self-center flex-row items-center gap-1 rounded border-transparent bg-amber-400 px-1.5 py-0.5 shadow-sm"
        >
          <Lock size={10} color="#000" />
          <Text className="text-[10px] font-bold text-black tracking-wider">AF LOCK</Text>
        </Badge>
      )}

      {/* Focus Box */}
      <View
        className={`relative h-16 w-16 rounded-xl border-2 border-amber-400 ${
          isLocked ? 'bg-amber-400/15' : 'bg-amber-400/5'
        }`}
      >
        {/* Reticle tick marks for camera aesthetics */}
        <View className="absolute -top-1 left-[30px] h-1 w-0.5 bg-amber-400" />
        <View className="absolute -bottom-1 left-[30px] h-1 w-0.5 bg-amber-400" />
        <View className="absolute -left-1 top-[30px] h-0.5 w-1 bg-amber-400" />
        <View className="absolute -right-1 top-[30px] h-0.5 w-1 bg-amber-400" />
      </View>

    </Animated.View>
  );
}
