import React, { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { View, StyleSheet } from 'react-native';

import { AuthProvider } from '@/providers/AuthProvider';
import { VoiceProvider } from '@/providers/VoiceProvider';
import { OfflineProvider } from '@/providers/OfflineProvider';
import { EmergencyProvider } from '@/providers/EmergencyProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { AppStateProvider } from '@/providers/AppStateProvider';
import { darkTheme } from '@/constants/theme';
import { initializeApp } from '@/services/AppInitializer';
import { registerForPushNotificationsAsync } from '@/services/NotificationService';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize the app services
        await initializeApp();
        
        // Register for push notifications
        await registerForPushNotificationsAsync();
        
        // Keep the splash screen visible while we fetch resources
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn('App initialization error:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppStateProvider>
              <OfflineProvider>
                <AuthProvider>
                  <VoiceProvider>
                    <EmergencyProvider>
                      <AppContent />
                    </EmergencyProvider>
                  </VoiceProvider>
                </AuthProvider>
              </OfflineProvider>
            </AppStateProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { theme } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="light" backgroundColor={theme.colors.surface} />
        
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen 
            name="(auth)" 
            options={{ 
              headerShown: false,
              gestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
              gestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="emergency" 
            options={{ 
              presentation: 'modal',
              headerShown: false,
              gestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="voice-chat" 
            options={{ 
              presentation: 'fullScreenModal',
              headerShown: false,
              gestureEnabled: false 
            }} 
          />
          <Stack.Screen 
            name="document-viewer" 
            options={{ 
              presentation: 'modal',
              headerTitle: 'Document',
              headerStyle: {
                backgroundColor: theme.colors.surface,
              },
              headerTintColor: theme.colors.onSurface,
            }} 
          />
        </Stack>
        
        <Toast />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
