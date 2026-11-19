import * as Haptics from 'expo-haptics';
import { RotateCcw, Sun } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  View,
} from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

type ExposureSliderProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onSettled?: (value: number) => void;
  onReset?: () => void;
  disabled?: boolean;
};

export function ExposureSlider({
  value,
  min,
  max,
  onChange,
  onSettled,
  onReset,
  disabled = false,
}: ExposureSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const trackLayoutRef = useRef<{ pageX: number; width: number }>({ pageX: 0, width: 0 });
  const lastHapticValueRef = useRef<number>(value);

  const measureTrack = useCallback(() => {
    trackRef.current?.measure((_x, _y, width, _height, pageX) => {
      if (width > 0) {
        trackLayoutRef.current = { pageX, width };
        setTrackWidth(width);
      }
    });
  }, []);

  const updateValueFromPosition = useCallback(
    (clientX: number) => {
      if (disabled) return;
      const { pageX, width } = trackLayoutRef.current;
      const currentWidth = width > 0 ? width : trackWidth;
      if (currentWidth <= 0) return;

      const relativeX = clientX - pageX;
      const fraction = Math.max(0, Math.min(1, relativeX / currentWidth));
      const rawValue = min + fraction * (max - min);
      // Step to 0.1 EV
      const stepped = Math.round(rawValue * 10) / 10;

      if (stepped !== lastHapticValueRef.current) {
        if (stepped === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.selectionAsync();
        }
        lastHapticValueRef.current = stepped;
        onChange(stepped);
      }
    },
    [disabled, max, min, onChange, trackWidth]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        updateValueFromPosition(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        updateValueFromPosition(gestureState.moveX);
      },
      onPanResponderRelease: () => {
        onSettled?.(lastHapticValueRef.current);
      },
    })
  ).current;

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    lastHapticValueRef.current = 0;
    if (onReset) {
      onReset();
    } else {
      onChange(0);
      onSettled?.(0);
    }
  };

  const range = max > min ? max - min : 4;
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / range));
  const zeroFraction = Math.max(0, Math.min(1, (0 - min) / range));

  const thumbLeft = trackWidth > 0 ? normalizedValue * trackWidth : 0;
  const zeroLeft = trackWidth > 0 ? zeroFraction * trackWidth : 0;

  // Active bar fills between 0.0 and current thumb position
  const activeBarLeft = Math.min(thumbLeft, zeroLeft);
  const activeBarWidth = Math.abs(thumbLeft - zeroLeft);

  const isNonZero = Math.abs(value) >= 0.05;

  return (
    <View className="w-full px-4 py-1.5">
      {/* Header Info */}
      <View className="mb-1.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Sun size={15} color={isNonZero ? '#facc15' : '#94a3b8'} />
          <Label className="text-xs font-semibold text-foreground">Exposure</Label>
          <Badge
            variant={isNonZero ? 'default' : 'secondary'}
            className={
              isNonZero
                ? 'border-amber-400/50 bg-amber-400/15'
                : 'border-border bg-secondary'
            }
          >
            <Text
              className={`text-xs font-mono font-bold ${
                isNonZero ? 'text-amber-400' : 'text-muted-foreground'
              }`}
            >
              {value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)} EV
            </Text>
          </Badge>
        </View>

        {isNonZero && (
          <Button
            variant="outline"
            size="sm"
            onPress={handleReset}
            className="h-6 gap-1 rounded-full border-border bg-secondary px-2 py-0 active:opacity-75"
          >
            <RotateCcw size={10} color="#94a3b8" />
            <Text className="text-[11px] font-medium text-muted-foreground">Reset</Text>
          </Button>
        )}
      </View>

      {/* Slider Interactive Track Area */}
      <View
        ref={trackRef}
        onLayout={measureTrack}
        {...panResponder.panHandlers}
        className="h-9 justify-center"
      >
        {/* Track Groove */}
        <View className="relative h-1.5 justify-center rounded-full bg-white/10 dark:bg-white/15">
          {/* Zero Mark Line */}
          <View
            className="absolute top-[-3px] h-3 w-0.5 rounded-full bg-white/45"
            style={{ left: zeroLeft, transform: [{ translateX: -1 }] }}
          />

          {/* Active Highlight Segment (from 0 EV to current value) */}
          {activeBarWidth > 0 && (
            <View
              className="absolute h-1.5 rounded-full bg-amber-400"
              style={{
                left: activeBarLeft,
                width: activeBarWidth,
              }}
            />
          )}

          {/* Thumb */}
          {trackWidth > 0 && (
            <View
              className="absolute h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-amber-400 shadow-md elevation-4"
              style={{
                transform: [{ translateX: thumbLeft - 10 }],
              }}
            >
              <View className="h-1.5 w-1.5 rounded-full bg-amber-950" />
            </View>
          )}
        </View>
      </View>

      {/* Min / Center / Max Labels */}
      <View className="mt-0.5 flex-row justify-between px-0.5">
        <Text className="text-[10px] text-muted-foreground">
          {min > 0 ? `+${min}` : min} EV
        </Text>
        <Text className="text-[10px] text-muted-foreground font-medium">0.0</Text>
        <Text className="text-[10px] text-muted-foreground">
          {max > 0 ? `+${max}` : max} EV
        </Text>
      </View>
    </View>
  );
}
