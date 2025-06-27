import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/providers/ThemeProvider';

export default function AuthLayout() {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar style="light" backgroundColor={theme.colors.surface} />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            gestureEnabled: false 
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            gestureEnabled: true 
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            headerShown: false,
            gestureEnabled: true 
          }} 
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{ 
            headerShown: false,
            gestureEnabled: true 
          }} 
        />
        <Stack.Screen 
          name="verify-email" 
          options={{ 
            headerShown: false,
            gestureEnabled: false 
          }} 
        />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            headerShown: false,
            gestureEnabled: false 
          }} 
        />
      </Stack>
    </>
  );
}
