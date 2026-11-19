import { Crosshair, Focus, RotateCcw } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type ManualFocusControlProps = {
  isManualMode: boolean;
  isFocusLocked: boolean;
  onToggleManualMode: () => void;
  onResetFocus: () => void;
};

export function ManualFocusControl({
  isManualMode,
  isFocusLocked,
  onToggleManualMode,
  onResetFocus,
}: ManualFocusControlProps) {
  const isLockedOrManual = isManualMode || isFocusLocked;

  return (
    <View className="flex-row  justify-between items-center p-2">
      {/* AF / MF Mode Toggle */}
      <Button
        size="sm"
        variant={isLockedOrManual ? 'default' : 'secondary'}
        onPress={isLockedOrManual ? onResetFocus : onToggleManualMode}
        className={`flex flex-row items-center justify-center gap-1.5 rounded-full px-3 py-1.5 ${
          isLockedOrManual ? 'bg-amber-400 active:bg-amber-500' : ''
        }`}
      >
        <Focus size={14} color={isLockedOrManual ? '#000' : '#a1a1aa'} />
        <Text
          numberOfLines={1}
          className={`text-xs font-bold ${
            isLockedOrManual ? 'text-black' : 'text-foreground'
          }`}
        >
          {isLockedOrManual ? 'Manual Focus   •   Tap to unlock' : 'Auto Focus'}
        </Text>
      </Button>

      {/* Reset to Continuous AF */}
      <Button
        size="sm"
        variant="ghost"
        disabled={!isLockedOrManual}
        onPress={onResetFocus}
        className="flex-row items-center justify-center gap-1 rounded-full px-2.5 py-1.5"
      >
        <RotateCcw size={13} color={isLockedOrManual ? '#a1a1aa' : '#52525b'} />
        <Text
          numberOfLines={1}
          className={`text-xs ${
            isLockedOrManual ? 'text-muted-foreground' : 'text-muted-foreground/40'
          }`}
        >
          Reset
        </Text>
      </Button>
    </View>
  );
}