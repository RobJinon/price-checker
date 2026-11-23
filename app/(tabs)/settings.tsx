import { Settings } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="border-b border-border px-4 py-3">
        <Text className="text-xl font-bold text-foreground">Settings</Text>
        <Text className="text-xs text-muted-foreground">
          App preferences & configuration
        </Text>
      </View>

      {/* Temporary Placeholder */}
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Settings size={26} color="#71717a" />
        </View>
        <Text className="text-center text-base font-semibold text-foreground">
          Settings Coming Soon
        </Text>
        <Text className="text-center text-xs leading-5 text-muted-foreground">
          Preferences for default currency, scanner behavior, and Supabase sync
          will live here.
        </Text>
      </View>
    </SafeAreaView>
  );
}