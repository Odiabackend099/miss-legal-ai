import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import TabBar from '@/components/navigation/TabBar';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Talk',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'mic' : 'mic-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'document-text' : 'document-text-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'Emergency',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'warning' : 'warning-outline'} 
              size={size} 
              color={color} 
            />
          ),
          tabBarBadge: undefined, // Could show badge for emergency status
        }}
      />
      
      <Tabs.Screen
        name="lawyers"
        options={{
          title: 'Lawyers',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={size} 
              color={color} 
            />
          ),
          tabBarBadge: user?.unreadNotifications > 0 ? user.unreadNotifications : undefined,
        }}
      />
    </Tabs>
  );
}
