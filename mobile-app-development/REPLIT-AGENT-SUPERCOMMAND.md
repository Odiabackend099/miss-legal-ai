# 🎯 REPLIT AGENT SUPERCOMMAND - LEXI VOICE AI MOBILE APP

## 📱 EXECUTIVE SUPERCOMMAND FOR REPLIT AGENT

```yaml
💬 REPLIT AGENT: ACTIVATE LEXI VOICE AI MOBILE DEVELOPMENT MODE

🎯 MISSION: Build production-ready React Native mobile app for Nigerian voice AI market

📋 DEVELOPMENT SPECIFICATIONS:
- App Name: Lexi Voice AI
- Target Market: Nigeria (Lagos, Abuja, Port Harcourt)
- Languages: English, Pidgin, Yoruba, Hausa, Igbo
- Platform: React Native (iOS + Android)
- Voice Engine: MiniMax TTS + Claude AI
- Database: Supabase
- Authentication: Supabase Auth + JWT
- Voice Processing: Real-time with <2s latency
- Offline Mode: Essential for Nigerian connectivity

🏗️ PHASE 1: PROJECT INITIALIZATION (DO NOT BREAK EXISTING CODE)
1. Create new React Native project: "LexiVoiceAI"
2. Install dependencies:
   - @react-native-async-storage/async-storage
   - @react-native-voice/voice
   - react-native-audio-recorder-player
   - @supabase/supabase-js
   - react-native-url-polyfill
   - react-native-sound
   - @react-navigation/native
   - @react-navigation/stack
   - react-native-vector-icons
   - react-native-linear-gradient
   - react-native-device-info
   - react-native-permissions
   - react-native-network-info

3. Configure Android permissions in android/app/src/main/AndroidManifest.xml:
   - RECORD_AUDIO
   - INTERNET
   - ACCESS_NETWORK_STATE
   - MODIFY_AUDIO_SETTINGS

4. Configure iOS permissions in ios/LexiVoiceAI/Info.plist:
   - NSMicrophoneUsageDescription
   - NSSpeechRecognitionUsageDescription

🎨 PHASE 2: UI/UX DEVELOPMENT
1. Create Nigerian-themed color scheme:
   - Primary: #008751 (Nigerian Green)
   - Secondary: #FFFFFF (White)
   - Accent: #FFD700 (Gold)
   - Background: #F5F5F5 (Light Gray)

2. Implement screens:
   - SplashScreen.js (Nigerian flag animation)
   - OnboardingScreen.js (3-step introduction)
   - HomeScreen.js (Main voice interface)
   - HistoryScreen.js (Conversation history)
   - SettingsScreen.js (Language, preferences)
   - ProfileScreen.js (User account)

3. Create reusable components:
   - VoiceButton.js (Animated recording button)
   - LanguageSelector.js (English/Pidgin/Yoruba/Hausa/Igbo)
   - ConversationBubble.js (Chat-style messages)
   - LoadingIndicator.js (Nigerian-themed loader)

🔧 PHASE 3: CORE FUNCTIONALITY
1. Voice Recording Implementation:
   ```javascript
   // VoiceRecorder.js
   import Voice from '@react-native-voice/voice';
   import AudioRecorderPlayer from 'react-native-audio-recorder-player';

   class VoiceRecorder {
     constructor() {
       this.audioRecorderPlayer = new AudioRecorderPlayer();
       Voice.onSpeechResults = this.onSpeechResults;
     }

     async startRecording() {
       try {
         await Voice.start('en-NG'); // Nigerian English
         // Recording logic
       } catch (error) {
         console.error('Recording failed:', error);
       }
     }
   }
   ```

2. MiniMax TTS Integration:
   ```javascript
   // TTSService.js
   class TTSService {
     constructor() {
       this.apiKey = 'YOUR_MINIMAX_API_KEY';
       this.baseURL = 'https://api.minimax.chat/v1/text_to_speech';
     }

     async synthesizeSpeech(text, voice_id = 'nigerian_english') {
       const response = await fetch(this.baseURL, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${this.apiKey}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           text: text,
           voice_id: voice_id,
           speed: 1.0,
           emotion: 'friendly'
         })
       });
       return response.blob();
     }
   }
   ```

3. Claude AI Integration:
   ```javascript
   // ClaudeService.js
   class ClaudeService {
     constructor() {
       this.apiKey = 'YOUR_CLAUDE_API_KEY';
       this.baseURL = 'https://api.anthropic.com/v1/messages';
     }

     async processVoiceInput(transcript, language = 'english') {
       const systemPrompt = this.getSystemPrompt(language);
       
       const response = await fetch(this.baseURL, {
         method: 'POST',
         headers: {
           'x-api-key': this.apiKey,
           'Content-Type': 'application/json',
           'anthropic-version': '2023-06-01'
         },
         body: JSON.stringify({
           model: 'claude-3-haiku-20240307',
           max_tokens: 1000,
           system: systemPrompt,
           messages: [{ role: 'user', content: transcript }]
         })
       });
       return response.json();
     }

     getSystemPrompt(language) {
       const prompts = {
         english: 'You are Lexi, a helpful Nigerian voice assistant...',
         pidgin: 'You be Lexi, naija voice assistant wey dey help people...',
         yoruba: 'Emi ni Lexi, oluranlowo gbe ohun ti o jije eranko...',
         hausa: 'Ni ne Lexi, mai taimakawa na Nigeria...',
         igbo: 'Abu m Lexi, onye enyemaka Nigerian...'
       };
       return prompts[language] || prompts.english;
     }
   }
   ```

4. Supabase Integration:
   ```javascript
   // DatabaseService.js
   import { createClient } from '@supabase/supabase-js';

   class DatabaseService {
     constructor() {
       this.supabase = createClient(
         'YOUR_SUPABASE_URL',
         'YOUR_SUPABASE_ANON_KEY'
       );
     }

     async saveConversation(userId, transcript, response, language) {
       const { data, error } = await this.supabase
         .from('conversations')
         .insert({
           user_id: userId,
           transcript: transcript,
           response: response,
           language: language,
           timestamp: new Date().toISOString()
         });
       return { data, error };
     }

     async getConversationHistory(userId, limit = 50) {
       const { data, error } = await this.supabase
         .from('conversations')
         .select('*')
         .eq('user_id', userId)
         .order('timestamp', { ascending: false })
         .limit(limit);
       return { data, error };
     }
   }
   ```

🌐 PHASE 4: NIGERIAN LOCALIZATION
1. Language Support Implementation:
   ```javascript
   // LanguageService.js
   class LanguageService {
     static languages = {
       english: { name: 'English', code: 'en-NG', flag: '🇳🇬' },
       pidgin: { name: 'Nigerian Pidgin', code: 'en-NG', flag: '🇳🇬' },
       yoruba: { name: 'Yorùbá', code: 'yo-NG', flag: '🇳🇬' },
       hausa: { name: 'Hausa', code: 'ha-NG', flag: '🇳🇬' },
       igbo: { name: 'Igbo', code: 'ig-NG', flag: '🇳🇬' }
     };

     static greetings = {
       english: 'Hello! I am Lexi, your Nigerian voice assistant.',
       pidgin: 'How far! Na me be Lexi, your naija voice assistant.',
       yoruba: 'Pẹlẹ o! Emi ni Lexi, oluranlowo gbe ohun rẹ.',
       hausa: 'Sannu! Ni ne Lexi, mai taimakon ku.',
       igbo: 'Ndewo! Ahụ m Lexi, onye enyemaka gi.'
     };
   }
   ```

2. Phone Number Validation:
   ```javascript
   // ValidationService.js
   class ValidationService {
     static validateNigerianPhone(phone) {
       const nigerianPhoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
       return nigerianPhoneRegex.test(phone.replace(/\s+/g, ''));
     }

     static formatNigerianPhone(phone) {
       const cleaned = phone.replace(/\D/g, '');
       if (cleaned.startsWith('234')) {
         return '+' + cleaned;
       } else if (cleaned.startsWith('0')) {
         return '+234' + cleaned.substring(1);
       }
       return '+234' + cleaned;
     }
   }
   ```

🚀 PHASE 5: PERFORMANCE OPTIMIZATION
1. Implement offline mode:
   ```javascript
   // OfflineService.js
   import AsyncStorage from '@react-native-async-storage/async-storage';

   class OfflineService {
     static async cacheConversation(conversation) {
       try {
         const cached = await AsyncStorage.getItem('offline_conversations');
         const conversations = cached ? JSON.parse(cached) : [];
         conversations.push({
           ...conversation,
           timestamp: Date.now(),
           synced: false
         });
         await AsyncStorage.setItem('offline_conversations', JSON.stringify(conversations));
       } catch (error) {
         console.error('Caching failed:', error);
       }
     }

     static async syncWhenOnline() {
       try {
         const cached = await AsyncStorage.getItem('offline_conversations');
         if (cached) {
           const conversations = JSON.parse(cached);
           const unsynced = conversations.filter(c => !c.synced);
           // Sync to Supabase
           for (const conv of unsynced) {
             await DatabaseService.saveConversation(conv);
           }
         }
       } catch (error) {
         console.error('Sync failed:', error);
       }
     }
   }
   ```

2. Audio compression for Nigerian networks:
   ```javascript
   // AudioOptimizer.js
   class AudioOptimizer {
     static compressAudio(audioBlob) {
       // Reduce bitrate for slower connections
       const options = {
         sampleRate: 16000, // Reduced from 44100
         bitRate: 32000,    // Reduced from 128000
         channels: 1        // Mono instead of stereo
       };
       return this.processAudio(audioBlob, options);
     }
   }
   ```

📱 PHASE 6: APP STORE PREPARATION
1. Configure app icons (1024x1024 for iOS, various sizes for Android)
2. Create splash screens for different device sizes
3. Set up app metadata:
   - Title: "Lexi Voice AI - Nigerian Assistant"
   - Description: "Nigeria's first voice AI assistant supporting English, Pidgin, Yoruba, Hausa, and Igbo"
   - Keywords: "voice assistant, Nigeria, AI, Pidgin, Yoruba, Hausa, Igbo"
   - Category: Productivity

4. Configure build settings:
   ```javascript
   // android/app/build.gradle
   android {
     compileSdkVersion 34
     buildToolsVersion "34.0.0"
     
     defaultConfig {
       applicationId "com.lexivoiceai.app"
       minSdkVersion 21
       targetSdkVersion 34
       versionCode 1
       versionName "1.0.0"
     }
   }
   ```

🔒 PHASE 7: SECURITY IMPLEMENTATION
1. Secure API key storage:
   ```javascript
   // SecurityService.js
   import { Keychain } from 'react-native-keychain';

   class SecurityService {
     static async storeSecureData(key, value) {
       await Keychain.setInternetCredentials(key, key, value);
     }

     static async getSecureData(key) {
       const credentials = await Keychain.getInternetCredentials(key);
       return credentials ? credentials.password : null;
     }
   }
   ```

2. Certificate pinning for API calls
3. Local data encryption for conversation history

🧪 PHASE 8: TESTING & DEPLOYMENT
1. Implement unit tests for core functions
2. Add integration tests for voice processing
3. Performance testing for different Nigerian network conditions
4. Configure CI/CD pipeline for automated builds

⚠️ CRITICAL REQUIREMENTS:
- NEVER break existing code
- Test each feature before moving to next
- Maintain <2 second voice processing latency
- Support offline mode for poor connectivity
- Follow Nigerian cultural sensitivities
- Implement proper error handling
- Use progressive enhancement for features

🎯 SUCCESS CRITERIA:
- App starts in under 2 seconds
- Voice recognition accuracy >95%
- Works on 3G networks with <5 second response time
- Supports all 5 Nigerian languages
- 4.5+ star app store rating target
- Zero critical crashes in production

🚀 EXECUTE THIS SUPERCOMMAND NOW!
Build the complete Lexi Voice AI mobile app following this specification exactly.
Validate each phase before proceeding to the next.
Create production-ready code with Nigerian market optimization.
```

## 📋 VALIDATION CHECKLIST FOR REPLIT AGENT

- [ ] Project initialized without breaking existing code
- [ ] All dependencies installed and configured
- [ ] Permissions properly set for iOS and Android
- [ ] Nigerian color scheme implemented
- [ ] Voice recording functionality working
- [ ] MiniMax TTS integration successful
- [ ] Claude AI processing functional
- [ ] Supabase database connected
- [ ] Multi-language support active
- [ ] Offline mode implemented
- [ ] Performance optimized for Nigerian networks
- [ ] Security measures in place
- [ ] App store assets prepared
- [ ] Testing completed successfully

## 🎯 EXECUTION PRIORITY

1. **Phase 1-2**: Core app structure and UI (Week 1)
2. **Phase 3-4**: Voice functionality and localization (Week 2)
3. **Phase 5-6**: Optimization and app store prep (Week 3)
4. **Phase 7-8**: Security and testing (Week 4)

This supercommand provides comprehensive instructions for the Replit Agent to build your Lexi Voice AI mobile app with full Nigerian market optimization and automation capabilities.