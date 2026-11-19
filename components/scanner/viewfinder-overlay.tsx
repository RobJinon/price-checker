import { ScanBarcode } from 'lucide-react-native';
import { useEffect } from 'react';
import { LayoutRectangle, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';

const SCAN_BOX_WIDTH = 316;
const SCAN_BOX_HEIGHT = 188;
const CORNER_RADIUS = 16;
const MASK_BORDER_WIDTH = 1000;
const LASER_PADDING = 18;

type ViewfinderOverlayProps = {
  onScanBoxLayout: (layout: LayoutRectangle) => void;
};

export function ViewfinderOverlay({ onScanBoxLayout }: ViewfinderOverlayProps) {
  const scanProgress = useSharedValue(0);

  useEffect(() => {
    scanProgress.value = withRepeat(
      withTiming(1, {
        duration: 2100,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [scanProgress]);

  const laserAnimatedStyle = useAnimatedStyle(() => {
    const travelDistance = SCAN_BOX_HEIGHT - LASER_PADDING * 2;
    return {
      transform: [{ translateY: LASER_PADDING + scanProgress.value * travelDistance }],
    };
  });

  return (
    <View
      className="absolute inset-0 items-center justify-center"
      pointerEvents="none"
    >
      {/* Dimmed Vignette Cutout Mask */}
      <View
        className="absolute border-black/60"
        style={{
          width: SCAN_BOX_WIDTH + MASK_BORDER_WIDTH * 2,
          height: SCAN_BOX_HEIGHT + MASK_BORDER_WIDTH * 2,
          borderWidth: MASK_BORDER_WIDTH,
          borderRadius: MASK_BORDER_WIDTH + CORNER_RADIUS,
        }}
      />

      {/* Active Scan Window */}
      <View
        className="overflow-hidden border border-white/15 bg-transparent"
        style={{
          width: SCAN_BOX_WIDTH,
          height: SCAN_BOX_HEIGHT,
          borderRadius: CORNER_RADIUS,
        }}
        onLayout={(event) => onScanBoxLayout(event.nativeEvent.layout)}
      >
        {/* Corner Brackets */}
        <View
          className="absolute top-0 left-0 h-7 w-7 border-t-[3.5px] border-l-[3.5px] border-emerald-400"
          style={{ borderTopLeftRadius: CORNER_RADIUS }}
        />
        <View
          className="absolute top-0 right-0 h-7 w-7 border-t-[3.5px] border-r-[3.5px] border-emerald-400"
          style={{ borderTopRightRadius: CORNER_RADIUS }}
        />
        <View
          className="absolute bottom-0 left-0 h-7 w-7 border-b-[3.5px] border-l-[3.5px] border-emerald-400"
          style={{ borderBottomLeftRadius: CORNER_RADIUS }}
        />
        <View
          className="absolute right-0 bottom-0 h-7 w-7 border-r-[3.5px] border-b-[3.5px] border-emerald-400"
          style={{ borderBottomRightRadius: CORNER_RADIUS }}
        />

        {/* Animated Laser Sweep + Soft Glow */}
        <Animated.View
          style={laserAnimatedStyle}
          className="absolute left-4 right-4 items-center justify-center"
        >
          <View className="h-3.5 w-full rounded-full bg-emerald-400/20" />
          <View className="absolute h-[2px] w-full rounded-full bg-emerald-400" />
        </Animated.View>
      </View>

      {/* Floating Instruction Pill */}
      <Badge
        variant="secondary"
        className="absolute bottom-5 flex-row items-center gap-1.5 rounded-full border-white/15 bg-zinc-950/80 px-3.5 py-1.5"
      >
        <ScanBarcode size={14} color="#34d399" />
        <Text className="text-xs font-medium tracking-wide text-zinc-100">
          Align barcode inside frame
        </Text>
      </Badge>
    </View>
  );
}