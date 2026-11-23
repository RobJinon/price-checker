import { Tabs } from 'expo-router';
import { Package, ScanBarcode, Settings, ShoppingCart, Store } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

import { useCart } from '@/context/cart-context';

import { NAV_THEME } from '@/lib/theme';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = NAV_THEME[colorScheme ?? 'light'];
  const activeColor = '#10b981';
  const inactiveColor = isDark ? '#a1a1aa' : '#71717a';

  const { totalItemsCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 2,
          marginVertical: 4,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 68,
          overflow: 'visible',
        },
      }}
    >
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: totalItemsCount > 0 ? totalItemsCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scanner',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIcon: ({ focused }) => (
            <View
              style={{ borderColor: theme.colors.card }}
              className={`-mt-5 h-16 w-16 items-center justify-center rounded-full border-4 ${
                focused
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40'
                  : isDark
                    ? 'bg-zinc-800 shadow-sm'
                    : 'bg-zinc-200 shadow-sm'
              }`}
            >
              <ScanBarcode
                color={focused ? '#ffffff' : inactiveColor}
                size={32}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: 'Stores',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Store size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}