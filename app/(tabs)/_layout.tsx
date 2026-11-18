import { Tabs } from 'expo-router';
import { Package, ScanBarcode } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { NAV_THEME } from '@/lib/theme';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const theme = NAV_THEME[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => <ScanBarcode color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}