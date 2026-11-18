import { Flashlight, FlashlightOff, SwitchCamera } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

type CameraControlsProps = {
  zoomLabel: string;
  onCycleZoom: () => void;
  torchEnabled: boolean;
  onToggleTorch: () => void;
  isFrontCamera: boolean;
  onToggleFacing: () => void;
};

export function CameraControls({
  zoomLabel,
  onCycleZoom,
  torchEnabled,
  onToggleTorch,
  isFrontCamera,
  onToggleFacing,
}: CameraControlsProps) {
  return (
    <View className="my-4 flex-row items-center gap-5 rounded-full border border-white/15 bg-black/75 px-5 py-2.5">
      <Pressable
        onPress={onCycleZoom}
        className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:opacity-75"
      >
        <Text className="text-xs font-bold text-slate-100">{zoomLabel}</Text>
      </Pressable>

      <Pressable
        onPress={onToggleTorch}
        disabled={isFrontCamera}
        className="h-12 w-12 items-center justify-center rounded-full bg-white/10 active:opacity-75 disabled:opacity-40"
      >
        {torchEnabled && !isFrontCamera ? (
          <Flashlight size={22} color="#facc15" />
        ) : (
          <FlashlightOff size={22} color="#f8fafc" />
        )}
      </Pressable>

      <Pressable
        onPress={onToggleFacing}
        className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:opacity-75"
      >
        <SwitchCamera size={21} color="#f8fafc" />
      </Pressable>
    </View>
  );
}