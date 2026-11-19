import { Lock, Sun } from 'lucide-react-native';
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
  isLocked = false,
  exposure = 0,
  minExposure = -2,
  maxExposure = 2,
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

  // Calculate sun position along the vertical rail (height 44px range)
  const range = maxExposure > minExposure ? maxExposure - minExposure : 4;
  const normalizedExp = Math.max(0, Math.min(1, (exposure - minExposure) / range));
  const sunTop = (1 - normalizedExp) * 44; // higher EV = higher position

  const isNonZeroExposure = Math.abs(exposure) >= 0.1;

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

      {/* Vertical Exposure Rail & Sun Indicator */}
      <View className="absolute left-[72px] top-1 h-14 w-12 justify-center">
        {/* Vertical Rail Line */}
        <View className="absolute bottom-1 left-1.5 top-1 w-[1.5px] rounded-full bg-white/30" />

        {/* Sliding Sun Icon */}
        <View
          className="absolute left-0 flex-row items-center gap-1"
          style={{ top: sunTop }}
        >
          <Sun size={13} color="#facc15" />
          {isNonZeroExposure && (
            <Badge
              variant="outline"
              className="rounded border border-amber-400/50 bg-black/75 px-1 py-0"
            >
              <Text className="text-[9px] font-bold font-mono text-amber-400">
                {exposure > 0 ? `+${exposure.toFixed(1)}` : exposure.toFixed(1)}
              </Text>
            </Badge>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
