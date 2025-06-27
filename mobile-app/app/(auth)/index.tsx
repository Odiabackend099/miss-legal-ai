import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import LottieView from 'lottie-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import LanguageSelector from '@/components/LanguageSelector';
import { getWelcomeMessage } from '@/utils/greetings';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  {
    id: 1,
    titleKey: 'voice_first',
    subtitleKey: 'voice_first_desc',
    icon: 'mic',
  },
  {
    id: 2,
    titleKey: 'emergency_response',
    subtitleKey: 'emergency_response_desc',
    icon: 'warning',
  },
  {
    id: 3,
    titleKey: 'legal_documents',
    subtitleKey: 'legal_documents_desc',
    icon: 'document-text',
  },
  {
    id: 4,
    titleKey: 'lawyer_connection',
    subtitleKey: 'lawyer_connection_desc',
    icon: 'people',
  },
];

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const { checkAuthState, preferredLanguage, setPreferredLanguage } = useAuth();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(preferredLanguage || 'english');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthState().then((isAuthenticated) => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      }
    });

    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-rotate features
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % FEATURES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getLocalizedText = (key: string) => {
    const texts = {
      voice_first: {
        english: 'Voice-First Legal AI',
        yoruba: 'AI Ofin Ohun-Akọkọ',
        hausa: 'AI na Shari\'a ta Murya',
        igbo: 'AI Iwu Olu-Mbụ',
        pidgin: 'Voice First Legal AI',
      },
      voice_first_desc: {
        english: 'Talk naturally to get legal help in your language',
        yoruba: 'Sọrọ ni adayeba lati gba iranlọwọ ofin ni ede rẹ',
        hausa: 'Yi magana a hankali don samun taimakon shari\'a a harshenku',
        igbo: 'Kwuo okwu n\'ụzọ eke iji nweta enyemaka iwu n\'asụsụ gị',
        pidgin: 'Talk normal way make you get legal help for your language',
      },
      emergency_response: {
        english: 'Emergency Response',
        yoruba: 'Idahun Ipajawiri',
        hausa: 'Amsar Gaggawa',
        igbo: 'Nzaghachi Ihe Mberede',
        pidgin: 'Emergency Response',
      },
      emergency_response_desc: {
        english: 'Instant help when you need it most',
        yoruba: 'Iranlọwọ kiakia nigbati o nilo ju',
        hausa: 'Taimako nan take lokacin da kuka fi bukata',
        igbo: 'Enyemaka ozugbo mgbe ịchọrọ ya karịa',
        pidgin: 'Quick help when you need am pass',
      },
      legal_documents: {
        english: 'Legal Documents',
        yoruba: 'Awọn Iwe Ofin',
        hausa: 'Takardar Shari\'a',
        igbo: 'Akwụkwọ Iwu',
        pidgin: 'Legal Documents',
      },
      legal_documents_desc: {
        english: 'Create documents with your voice',
        yoruba: 'Ṣẹda awọn iwe pẹlu ohun rẹ',
        hausa: 'Ƙirƙiri takardu da muryarku',
        igbo: 'Mepụta akwụkwọ site n\'olu gị',
        pidgin: 'Create documents with your voice',
      },
      lawyer_connection: {
        english: 'Connect with Lawyers',
        yoruba: 'Sopọ pẹlu Awọn Agbẹjọro',
        hausa: 'Haɗa da Lauyoyi',
        igbo: 'Jikọọ na Ndị Ọka Iwu',
        pidgin: 'Connect with Lawyers',
      },
      lawyer_connection_desc: {
        english: 'Get expert legal advice when needed',
        yoruba: 'Gba imọran ofin ọgbọn nigbati o ba nilo',
        hausa: 'Samun shawarwar shari\'a na gwaninta lokacin bukata',
        igbo: 'Nweta ndụmọdụ iwu ọkachamara mgbe ọ dị mkpa',
        pidgin: 'Get expert legal advice when you need am',
      },
      welcome_to: {
        english: 'Welcome to',
        yoruba: 'Kaabo si',
        hausa: 'Barka da zuwa',
        igbo: 'Nnọọ na',
        pidgin: 'Welcome to',
      },
      tagline: {
        english: 'Your AI-powered legal assistant for Nigeria',
        yoruba: 'Oluranlọwọ ofin rẹ ti AI fun Naijiria',
        hausa: 'Mataimakin shari\'ar ku na AI don Najeriya',
        igbo: 'Onye inyeaka iwu gị nke AI maka Naịjirịa',
        pidgin: 'Your AI legal assistant for Nigeria',
      },
      get_started: {
        english: 'Get Started',
        yoruba: 'Bẹrẹ',
        hausa: 'Fara',
        igbo: 'Bidoro',
        pidgin: 'Start',
      },
      already_have_account: {
        english: 'Already have an account?',
        yoruba: 'Ṣe o ni akọọlẹ tẹlẹ?',
        hausa: 'Kun riga kun sami asusun?',
        igbo: 'Ị nweelarị akaụntụ?',
        pidgin: 'You get account already?',
      },
      sign_in: {
        english: 'Sign In',
        yoruba: 'Wọle',
        hausa: 'Shiga',
        igbo: 'Banye',
        pidgin: 'Sign In',
      },
    };

    return texts[key]?.[selectedLanguage] || texts[key]?.english || key;
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setPreferredLanguage(language);
  };

  const handleGetStarted = () => {
    router.push('/(auth)/register');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Language Selector */}
        <View style={styles.languageContainer}>
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
          />
        </View>

        {/* Logo and Branding */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/ai-logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          
          <Text style={[styles.welcomeText, { color: theme.colors.onSurface }]}>
            {getLocalizedText('welcome_to')}
          </Text>
          
          <Text style={[styles.appName, { color: theme.colors.primary }]}>
            MISS Legal AI
          </Text>
          
          <Text style={[styles.tagline, { color: theme.colors.outline }]}>
            {getLocalizedText('tagline')}
          </Text>
        </Animated.View>

        {/* Features Showcase */}
        <Animatable.View
          animation="fadeInUp"
          delay={500}
          style={styles.featuresContainer}
        >
          <View style={[styles.featureCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary }]}>
              <LottieView
                source={require('@/assets/animations/voice-wave.json')}
                style={styles.lottieIcon}
                autoPlay
                loop
              />
            </View>
            
            <Text style={[styles.featureTitle, { color: theme.colors.onSurfaceVariant }]}>
              {getLocalizedText(FEATURES[currentFeature].titleKey)}
            </Text>
            
            <Text style={[styles.featureDescription, { color: theme.colors.outline }]}>
              {getLocalizedText(FEATURES[currentFeature].subtitleKey)}
            </Text>
          </View>

          {/* Feature Indicators */}
          <View style={styles.indicators}>
            {FEATURES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index === currentFeature 
                      ? theme.colors.primary 
                      : theme.colors.outline,
                  },
                ]}
              />
            ))}
          </View>
        </Animatable.View>

        {/* Action Buttons */}
        <Animatable.View
          animation="fadeInUp"
          delay={800}
          style={styles.actionsContainer}
        >
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.onPrimary }]}>
              {getLocalizedText('get_started')}
            </Text>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={[styles.signInPrompt, { color: theme.colors.outline }]}>
              {getLocalizedText('already_have_account')}
            </Text>
            <TouchableOpacity onPress={handleSignIn}>
              <Text style={[styles.signInText, { color: theme.colors.primary }]}>
                {getLocalizedText('sign_in')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Nigerian Flag or Cultural Element */}
        <View style={styles.culturalElement}>
          <Image
            source={require('@/assets/images/nigeria-flag.png')}
            style={styles.flagIcon}
            resizeMode="contain"
          />
          <Text style={[styles.madeForNigeria, { color: theme.colors.outline }]}>
            {selectedLanguage === 'yoruba' ? 'Ti ṣẹda fun Naijiria' :
             selectedLanguage === 'hausa' ? 'An hada don Najeriya' :
             selectedLanguage === 'igbo' ? 'Emere maka Naịjirịa' :
             selectedLanguage === 'pidgin' ? 'Made for Nigeria' :
             'Made for Nigeria'}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  languageContainer: {
    alignItems: 'flex-end',
    paddingTop: 16,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 60,
  },
  welcomeText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  featureCard: {
    width: width - 60,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lottieIcon: {
    width: 50,
    height: 50,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionsContainer: {
    paddingBottom: 40,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signInPrompt: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  signInText: {
    fontSize: 16,
    fontWeight: 'medium',
    fontFamily: 'Inter-Medium',
  },
  culturalElement: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginBottom: 8,
  },
  madeForNigeria: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});
