import Feather from '@expo/vector-icons/Feather';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DemoProvider } from '@/components/demo-state';
import { MovementDraftProvider } from '@/components/movement-draft';
import { SessionProvider } from '@/components/session-state';
import { colors } from '@/components/ui/theme';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const [loaded, error] = useFonts(Feather.font);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <MovementDraftProvider>
          <DemoProvider>
          <StatusBar style="dark" />
          <View style={styles.outer}>
            <View style={styles.column}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.canvas },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="configuracion" />
                <Stack.Screen name="entrar" />
                <Stack.Screen name="crear-cuenta" />
                <Stack.Screen name="recuperar" />
                <Stack.Screen name="restablecer" />
                <Stack.Screen name="correo-confirmado" />
                <Stack.Screen name="cuenta" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </View>
          </View>
          </DemoProvider>
        </MovementDraftProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.frame,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.canvas,
  },
});
