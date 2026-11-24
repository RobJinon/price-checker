import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from 'expo-router/react-navigation';
import { CartProvider } from '@/context/cart-context';
import { ProductsProvider } from '@/context/products-context';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <ProductsProvider>
          <CartProvider>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <PortalHost />
          </CartProvider>
        </ProductsProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
