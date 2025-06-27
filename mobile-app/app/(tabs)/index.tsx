import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

import { useTheme } from '@/providers/ThemeProvider';
import { useVoice } from '@/providers/VoiceProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useOffline } from '@/providers/OfflineProvider';
import VoiceOrb from '@/components/voice/VoiceOrb';
import ConversationBubble from '@/components/voice/ConversationBubble';
import VoiceWaveform from '@/components/voice/VoiceWaveform';
import QuickActions from '@/components/voice/QuickActions';
import NetworkStatus from '@/components/NetworkStatus';
import { formatGreeting, getTimeBasedGreeting } from '@/utils/greetings';
import { VoiceMessage, VoiceState } from '@/types/voice';

const { width, height } = Dimensions.get('window');

export default function TalkScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const {
    voiceState,
    isRecording,
    isProcessing,
    conversation,
    startRecording,
    stopRecording,
    sendTextMessage,
    clearConversation,
  } = useVoice();

  const [showQuickActions, setShowQuickActions] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [glowAnimation] = useState(new Animated.Value(0));
  const scrollViewRef = useRef<ScrollView>(null);

  // Greeting based on time and user language
  const greeting = formatGreeting(
    getTimeBasedGreeting(),
    user?.preferredLanguage || 'english',
    user?.fullName
  );

  useEffect(() => {
    // Animate glow effect for the orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (conversation.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation]);

  useEffect(() => {
    // Pulse animation when recording
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRecording]);

  const handleOrbPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (isRecording) {
        await stopRecording();
      } else {
        if (!isOnline) {
          // Show offline message
          const offlineMessage: VoiceMessage = {
            id: Date.now().toString(),
            text: user?.preferredLanguage === 'yoruba' 
              ? 'Mo wa lori ila offline. Gbiyanju lẹhin ti internet ti pada.'
              : user?.preferredLanguage === 'hausa'
              ? 'Ina cikin yanayin kashe intanet. Ka sake gwadawa bayan samun intanet.'
              : user?.preferredLanguage === 'igbo'
              ? 'Anọ m na offline. Nwalee mgbe ịntanetị laghachiri.'
              : 'I\'m currently offline. Please try again when internet connection is restored.',
            type: 'assistant',
            timestamp: new Date(),
            language: user?.preferredLanguage || 'english',
          };
          // Add to conversation (implement this in voice provider)
          return;
        }
        
        await startRecording();
      }
    } catch (error) {
      console.error('Voice interaction error:', error);
    }
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowQuickActions(true);
  };

  const handleQuickAction = async (action: string) => {
    setShowQuickActions(false);
    
    const quickMessages = {
      emergency: {
        english: 'This is an emergency! I need immediate help!',
        yoruba: 'Eyi ni ipajawiri! Mo nilo iranlowo lẹsẹkẹsẹ!',
        hausa: 'Wannan gaggawa ne! Ina bukatar taimako nan take!',
        igbo: 'Nke a bụ ihe mberede! Achọrọ m enyemaka ozugbo!',
      },
      document: {
        english: 'I need help creating a legal document',
        yoruba: 'Mo nilo iranlowo lati ṣẹda iwe ofin kan',
        hausa: 'Ina bukatar taimako wajen ƙirƙirar takardar shari\'a',
        igbo: 'Achọrọ m enyemaka n\'ịmepụta akwụkwọ iwu',
      },
      lawyer: {
        english: 'I need to speak with a lawyer',
        yoruba: 'Mo nilo lati ba agbẹjọro kan sọrọ',
        hausa: 'Ina bukatar yin magana da lauya',
        igbo: 'Achọrọ m ịgwa onye ọka iwu okwu',
      },
    };

    const message = quickMessages[action as keyof typeof quickMessages]?.[user?.preferredLanguage || 'english'] || 
                   quickMessages[action as keyof typeof quickMessages]?.english;

    if (message) {
      await sendTextMessage(message);
    }
  };

  const renderConversation = () => {
    if (conversation.length === 0) {
      return (
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, { color: theme.colors.onSurface }]}>
            {greeting}
          </Text>
          <Text style={[styles.subtitleText, { color: theme.colors.outline }]}>
            {user?.preferredLanguage === 'yoruba' 
              ? 'Tẹ orb lati bẹrẹ sisọ'
              : user?.preferredLanguage === 'hausa'
              ? 'Danna orb don fara magana'
              : user?.preferredLanguage === 'igbo'
              ? 'Pịa orb ka ịmalite ikwu okwu'
              : 'Tap the orb to start talking'}
          </Text>
        </View>
      );
    }

    return conversation.map((message, index) => (
      <ConversationBubble
        key={message.id}
        message={message}
        isLast={index === conversation.length - 1}
      />
    ));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <NetworkStatus />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          MISS Legal AI
        </Text>
        {isProcessing && (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.processingText, { color: theme.colors.primary }]}>
              {user?.preferredLanguage === 'yoruba' 
                ? 'N sisẹ...'
                : user?.preferredLanguage === 'hausa'
                ? 'Ana aiki...'
                : user?.preferredLanguage === 'igbo'
                ? 'Na-arụ ọrụ...'
                : 'Processing...'}
            </Text>
          </View>
        )}
      </View>

      {/* Conversation Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.conversationContainer}
        contentContainerStyle={styles.conversationContent}
        showsVerticalScrollIndicator={false}
      >
        {renderConversation()}
      </ScrollView>

      {/* Voice Waveform */}
      {(isRecording || isProcessing) && (
        <View style={styles.waveformContainer}>
          <VoiceWaveform 
            isActive={isRecording} 
            isProcessing={isProcessing}
          />
        </View>
      )}

      {/* Voice Orb Container */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={[
            `${theme.colors.primary}20`,
            `${theme.colors.primary}10`,
            'transparent'
          ]}
          style={styles.orbGradient}
        />
        
        <Animated.View
          style={[
            styles.orbWrapper,
            {
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleOrbPress}
            onLongPress={handleLongPress}
            style={[
              styles.orb,
              {
                backgroundColor: isRecording ? theme.colors.error : theme.colors.primary,
                shadowColor: isRecording ? theme.colors.error : theme.colors.primary,
              },
            ]}
            activeOpacity={0.8}
          >
            <VoiceOrb
              isRecording={isRecording}
              isProcessing={isProcessing}
              voiceState={voiceState}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Orb Status Text */}
        <Text style={[styles.orbStatusText, { color: theme.colors.outline }]}>
          {isRecording
            ? (user?.preferredLanguage === 'yoruba' ? 'Mo n gbọ...' :
               user?.preferredLanguage === 'hausa' ? 'Ina saurare...' :
               user?.preferredLanguage === 'igbo' ? 'Ana m ege ntị...' :
               'Listening...')
            : isProcessing
            ? (user?.preferredLanguage === 'yoruba' ? 'N sisẹ...' :
               user?.preferredLanguage === 'hausa' ? 'Ana aiki...' :
               user?.preferredLanguage === 'igbo' ? 'Na-arụ ọrụ...' :
               'Processing...')
            : (user?.preferredLanguage === 'yoruba' ? 'Tẹ lati sọrọ' :
               user?.preferredLanguage === 'hausa' ? 'Danna don magana' :
               user?.preferredLanguage === 'igbo' ? 'Pịa ka ị kwuo okwu' :
               'Tap to speak')}
        </Text>
      </View>

      {/* Quick Actions */}
      {showQuickActions && (
        <QuickActions
          onAction={handleQuickAction}
          onClose={() => setShowQuickActions(false)}
          language={user?.preferredLanguage || 'english'}
        />
      )}

      {/* Clear Conversation Button */}
      {conversation.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: theme.colors.surfaceVariant }]}
          onPress={clearConversation}
        >
          <Ionicons name="refresh" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  conversationContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  conversationContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  subtitleText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    fontFamily: 'Inter-Regular',
  },
  waveformContainer: {
    height: 80,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  orbContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 60,
  },
  orbGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
  },
  orbWrapper: {
    marginBottom: 16,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  orbStatusText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  clearButton: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
