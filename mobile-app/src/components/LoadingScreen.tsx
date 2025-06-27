import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

import { useTheme } from '@/providers/ThemeProvider';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
  showAnimation?: boolean;
  overlay?: boolean;
}

const { width, height } = Dimensions.get('window');

export default function LoadingScreen({
  message = 'Loading...',
  showLogo = true,
  showAnimation = true,
  overlay = false,
}: LoadingScreenProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const containerStyle = overlay
    ? [styles.overlay, { backgroundColor: theme.colors.background + 'E6' }]
    : [styles.container, { backgroundColor: theme.colors.background }];

  return (
    <View style={containerStyle}>
      <LinearGradient
        colors={[
          theme.colors.primary + '20',
          theme.colors.background,
          theme.colors.secondary + '10',
        ]}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {showLogo && (
            <View style={styles.logoContainer}>
              <Animated.View
                style={[
                  styles.logoWrapper,
                  {
                    transform: [{ rotate: rotation }],
                  },
                ]}
              >
                <View style={[styles.logoBorder, { borderColor: theme.colors.primary }]}>
                  <Image
                    source={require('@/assets/images/ai-logo.jpg')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
              </Animated.View>
              
              <Text style={[styles.brandName, { color: theme.colors.primary }]}>
                MISS Legal AI
              </Text>
            </View>
          )}

          {showAnimation && (
            <View style={styles.animationContainer}>
              <LottieView
                source={require('@/assets/animations/loading-pulse.json')}
                style={styles.animation}
                autoPlay
                loop
              />
            </View>
          )}

          <View style={styles.messageContainer}>
            <View style={[styles.loadingDots, { backgroundColor: theme.colors.primary }]}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor: theme.colors.onPrimary,
                    transform: [{ rotate: rotation }],
                  },
                ]}
              />
            </View>
            
            <Text style={[styles.message, { color: theme.colors.onSurface }]}>
              {message}
            </Text>
            
            <Text style={[styles.subMessage, { color: theme.colors.outline }]}>
              Made for Nigeria 🇳🇬
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    marginBottom: 16,
  },
  logoBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  animationContainer: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  messageContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
