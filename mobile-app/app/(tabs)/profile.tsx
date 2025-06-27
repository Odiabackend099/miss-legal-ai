import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useOffline } from '@/providers/OfflineProvider';
import ProfileSection from '@/components/profile/ProfileSection';
import SubscriptionCard from '@/components/profile/SubscriptionCard';
import LanguageSelector from '@/components/profile/LanguageSelector';
import UsageStats from '@/components/profile/UsageStats';
import SettingsModal from '@/components/profile/SettingsModal';
import { showToast } from '@/utils/toast';
import { formatDataUsage, formatCurrency } from '@/utils/formatters';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { 
    user, 
    logout, 
    updateProfile, 
    deleteAccount,
    subscription,
    usageStats,
    dataUsage 
  } = useAuth();
  const { isOnline } = useOffline();

  const [showSettings, setShowSettings] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineModeEnabled, setOfflineModeEnabled] = useState(true);
  const [dataOptimizationEnabled, setDataOptimizationEnabled] = useState(true);

  useEffect(() => {
    checkBiometricSupport();
    loadUserPreferences();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricEnabled(compatible && enrolled && user?.biometricEnabled);
  };

  const loadUserPreferences = () => {
    // Load user preferences from storage or user object
    if (user) {
      setNotificationsEnabled(user.notificationsEnabled ?? true);
      setOfflineModeEnabled(user.offlineModeEnabled ?? true);
      setDataOptimizationEnabled(user.dataOptimizationEnabled ?? true);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      user?.preferredLanguage === 'yoruba' 
        ? 'Jade Kuro'
        : user?.preferredLanguage === 'hausa'
        ? 'Fita'
        : user?.preferredLanguage === 'igbo'
        ? 'Pụọ'
        : 'Log Out',
      user?.preferredLanguage === 'yoruba' 
        ? 'Ṣe o da o loju pe o fẹ jade kuro?'
        : user?.preferredLanguage === 'hausa'
        ? 'Ka tabbata kana son fita?'
        : user?.preferredLanguage === 'igbo'
        ? 'Ị ji n\'aka na ịchọrọ ịpụ?'
        : 'Are you sure you want to log out?',
      [
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Fagilee' : 
                user?.preferredLanguage === 'hausa' ? 'Soke' : 
                user?.preferredLanguage === 'igbo' ? 'Kagbuo' : 'Cancel',
          style: 'cancel',
        },
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Jade' : 
                user?.preferredLanguage === 'hausa' ? 'Fita' : 
                user?.preferredLanguage === 'igbo' ? 'Pụọ' : 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)');
            } catch (error) {
              showToast(
                user?.preferredLanguage === 'yoruba' 
                  ? 'Aṣiṣe ninu jade kuro'
                  : user?.preferredLanguage === 'hausa'
                  ? 'Kuskure wajen fita'
                  : user?.preferredLanguage === 'igbo'
                  ? 'Njehie n\'ịpụ'
                  : 'Error logging out',
                'error'
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      user?.preferredLanguage === 'yoruba' 
        ? 'Paarẹ Akọọlẹ'
        : user?.preferredLanguage === 'hausa'
        ? 'Share Asusun'
        : user?.preferredLanguage === 'igbo'
        ? 'Hichapụ Akaụntụ'
        : 'Delete Account',
      user?.preferredLanguage === 'yoruba' 
        ? 'Eyi yoo paarẹ akọọlẹ rẹ ati gbogbo data rẹ pẹpẹ. Eyi ko le ṣe atunṣe. Ṣe o da o loju?'
        : user?.preferredLanguage === 'hausa'
        ? 'Wannan zai share asusunku da duk bayananku gaba ɗaya. Ba za a iya mayar da shi ba. Ka tabbata?'
        : user?.preferredLanguage === 'igbo'
        ? 'Nke a ga-ehichapụ akaụntụ gị na data gị niile kpamkpam. Enweghị ike iweghachi ya. Ị ji n\'aka?'
        : 'This will permanently delete your account and all your data. This cannot be undone. Are you sure?',
      [
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Fagilee' : 
                user?.preferredLanguage === 'hausa' ? 'Soke' : 
                user?.preferredLanguage === 'igbo' ? 'Kagbuo' : 'Cancel',
          style: 'cancel',
        },
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Paarẹ' : 
                user?.preferredLanguage === 'hausa' ? 'Share' : 
                user?.preferredLanguage === 'igbo' ? 'Hichapụ' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/(auth)');
              showToast(
                user?.preferredLanguage === 'yoruba' 
                  ? 'Akọọlẹ ti paarẹ'
                  : user?.preferredLanguage === 'hausa'
                  ? 'An share asusun'
                  : user?.preferredLanguage === 'igbo'
                  ? 'Ehichapụla akaụntụ'
                  : 'Account deleted',
                'success'
              );
            } catch (error) {
              showToast(
                user?.preferredLanguage === 'yoruba' 
                  ? 'Aṣiṣe ninu piparẹ akọọlẹ'
                  : user?.preferredLanguage === 'hausa'
                  ? 'Kuskure wajen share asusun'
                  : user?.preferredLanguage === 'igbo'
                  ? 'Njehie n\'ihichapụ akaụntụ'
                  : 'Error deleting account',
                'error'
              );
            }
          },
        },
      ]
    );
  };

  const handleChangeProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast(
          user?.preferredLanguage === 'yoruba' 
            ? 'Gbọdọ fun wa ni laaye lati wọle si awọn fọto'
            : user?.preferredLanguage === 'hausa'
            ? 'Dole ne ka ba mu izini shiga hotuna'
            : user?.preferredLanguage === 'igbo'
            ? 'Anyị kwesịrị inye anyị ikike ịbanye foto'
            : 'Permission to access photos is required',
          'error'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Upload and update profile photo
        await updateProfile({ profilePhoto: result.assets[0].uri });
        showToast(
          user?.preferredLanguage === 'yoruba' 
            ? 'Fọto profile ti yi pada'
            : user?.preferredLanguage === 'hausa'
            ? 'An canza hoton profile'
            : user?.preferredLanguage === 'igbo'
            ? 'Agbanwela foto profile'
            : 'Profile photo updated',
          'success'
        );
      }
    } catch (error) {
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Aṣiṣe ninu yiyipada fọto'
          : user?.preferredLanguage === 'hausa'
          ? 'Kuskure wajen canza hoto'
          : user?.preferredLanguage === 'igbo'
          ? 'Njehie n\'ịgbanwe foto'
          : 'Error updating photo',
        'error'
      );
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 
          user?.preferredLanguage === 'yoruba' 
            ? 'Jẹrisi ẹrọ rẹ'
            : user?.preferredLanguage === 'hausa'
            ? 'Tabbatar da na\'urarka'
            : user?.preferredLanguage === 'igbo'
            ? 'Gosi ngwaọrụ gị'
            : 'Authenticate your device',
        fallbackLabel: 
          user?.preferredLanguage === 'yoruba' ? 'Lo koodu' :
          user?.preferredLanguage === 'hausa' ? 'Yi amfani da code' :
          user?.preferredLanguage === 'igbo' ? 'Jiri koodu' :
          'Use passcode',
      });

      if (result.success) {
        setBiometricEnabled(true);
        await updateProfile({ biometricEnabled: true });
        showToast(
          user?.preferredLanguage === 'yoruba' 
            ? 'Jijẹrisi ẹrọ ti ṣiṣẹ'
            : user?.preferredLanguage === 'hausa'
            ? 'An kunna tabbatar da na\'ura'
            : user?.preferredLanguage === 'igbo'
            ? 'Agbanyela ngosipụta ngwaọrụ'
            : 'Biometric authentication enabled',
          'success'
        );
      }
    } else {
      setBiometricEnabled(false);
      await updateProfile({ biometricEnabled: false });
    }
  };

  const handleSettingToggle = async (setting: string, value: boolean) => {
    const updates: any = {};
    updates[setting] = value;

    switch (setting) {
      case 'notificationsEnabled':
        setNotificationsEnabled(value);
        break;
      case 'offlineModeEnabled':
        setOfflineModeEnabled(value);
        break;
      case 'dataOptimizationEnabled':
        setDataOptimizationEnabled(value);
        break;
    }

    try {
      await updateProfile(updates);
    } catch (error) {
      // Revert the change if update fails
      switch (setting) {
        case 'notificationsEnabled':
          setNotificationsEnabled(!value);
          break;
        case 'offlineModeEnabled':
          setOfflineModeEnabled(!value);
          break;
        case 'dataOptimizationEnabled':
          setDataOptimizationEnabled(!value);
          break;
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {user?.preferredLanguage === 'yoruba' 
            ? 'Profile'
            : user?.preferredLanguage === 'hausa'
            ? 'Profile'
            : user?.preferredLanguage === 'igbo'
            ? 'Profile'
            : 'Profile'}
        </Text>
        
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.colors.surfaceVariant }]}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons name="settings-outline" size={20} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleChangeProfilePhoto}>
            <View style={styles.photoContainer}>
              {user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.profilePhoto} />
              ) : (
                <View style={[styles.profilePhotoPlaceholder, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.profileInitials, { color: theme.colors.onPrimary }]}>
                    {user?.fullName?.split(' ').map(name => name[0]).join('').toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={[styles.photoEditIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="camera" size={16} color={theme.colors.onPrimary} />
              </View>
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
            {user?.fullName || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.outline }]}>
            {user?.email}
          </Text>
        </View>

        {/* Subscription Card */}
        {subscription && (
          <SubscriptionCard
            subscription={subscription}
            onUpgrade={() => router.push('/subscription')}
            language={user?.preferredLanguage || 'english'}
          />
        )}

        {/* Usage Stats */}
        <UsageStats
          stats={usageStats}
          dataUsage={dataUsage}
          language={user?.preferredLanguage || 'english'}
        />

        {/* Account Settings */}
        <ProfileSection
          title={
            user?.preferredLanguage === 'yoruba' ? 'Eto Akọọlẹ' :
            user?.preferredLanguage === 'hausa' ? 'Saitunan Asusun' :
            user?.preferredLanguage === 'igbo' ? 'Ntọala Akaụntụ' :
            'Account Settings'
          }
        >
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.colors.outline + '20' }]}
            onPress={() => router.push('/edit-profile')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="person-outline" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                {user?.preferredLanguage === 'yoruba' ? 'Ṣatunkọ Profile' :
                 user?.preferredLanguage === 'hausa' ? 'Gyara Profile' :
                 user?.preferredLanguage === 'igbo' ? 'Dezie Profile' :
                 'Edit Profile'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.outline} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.colors.outline + '20' }]}
            onPress={() => router.push('/emergency-contacts')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="call-outline" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                {user?.preferredLanguage === 'yoruba' ? 'Awọn Olubasọrọ Ipajawiri' :
                 user?.preferredLanguage === 'hausa' ? 'Masu Tuntuɓar Gaggawa' :
                 user?.preferredLanguage === 'igbo' ? 'Ndị Nkwurịta Okwu Ihe Mberede' :
                 'Emergency Contacts'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.outline} />
          </TouchableOpacity>

          <LanguageSelector
            selectedLanguage={user?.preferredLanguage || 'english'}
            onLanguageChange={(language) => updateProfile({ preferredLanguage: language })}
          />
        </ProfileSection>

        {/* Privacy & Security */}
        <ProfileSection
          title={
            user?.preferredLanguage === 'yoruba' ? 'Aabo ati Asiri' :
            user?.preferredLanguage === 'hausa' ? 'Tsaro da Sirri' :
            user?.preferredLanguage === 'igbo' ? 'Nzuzo na Nchekwa' :
            'Privacy & Security'
          }
        >
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.outline + '20' }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="finger-print-outline" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                {user?.preferredLanguage === 'yoruba' ? 'Jijẹrisi Ẹrọ' :
                 user?.preferredLanguage === 'hausa' ? 'Tabbatar da Na\'ura' :
                 user?.preferredLanguage === 'igbo' ? 'Ngosipụta Ngwaọrụ' :
                 'Biometric Authentication'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.colors.outline + '20' }]}
            onPress={() => router.push('/privacy-settings')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-outline" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                {user?.preferredLanguage === 'yoruba' ? 'Eto Asiri' :
                 user?.preferredLanguage === 'hausa' ? 'Saitunan Sirri' :
                 user?.preferredLanguage === 'igbo' ? 'Ntọala Nzuzo' :
                 'Privacy Settings'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.outline} />
          </TouchableOpacity>
        </ProfileSection>

        {/* App Preferences */}
        <ProfileSection
          title={
            user?.preferredLanguage === 'yoruba' ? 'Awọn Ẹya App' :
            user?.preferredLanguage === 'hausa' ? 'Zaɓuɓɓukan App' :
            user?.preferredLanguage === 'igbo' ? 'Mmasị App' :
            'App Preferences'
          }
        >
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.outline + '20' }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                {user?.preferredLanguage === 'yoruba' ? 'Awọn Iwifun' :
                 user?.preferredLanguage === 'hausa' ? 'Sanarwa' :
                 user?.preferredLanguage === 'igbo' ? 'Ọkwa' :
                 'Notifications'}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => handleSettingToggle('notificationsEnabled', value)}
              trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.outline + '20' }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-offline-outline" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                {user?.preferredLanguage === 'yoruba' ? 'Ipa Ailagbara' :
                 user?.preferredLanguage === 'hausa' ? 'Yanayin Kashe Intanet' :
                 user?.preferredLanguage === 'igbo' ? 'Ọnọdụ Offline' :
                 'Offline Mode'}
              </Text>
            </View>
            <Switch
              value={offlineModeEnabled}
              onValueChange={(value) => handleSettingToggle('offlineModeEnabled', value)}
              trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.outline + '20' }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="speedometer-outline" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                {user?.preferredLanguage === 'yoruba' ? 'Imudarasi Data' :
                 user?.preferredLanguage === 'hausa' ? 'Inganta Data' :
                 user?.preferredLanguage === 'igbo' ? 'Nkwalite Data' :
                 'Data Optimization'}
              </Text>
            </View>
            <Switch
              value={dataOptimizationEnabled}
              onValueChange={(value) => handleSettingToggle('dataOptimizationEnabled', value)}
              trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </ProfileSection>

        {/* Legal & Support */}
        <ProfileSection
          title={
            user?.preferredLanguage === 'yoruba' ? 'Ofin ati Atilẹyin' :
            user?.preferredLanguage === 'hausa' ? 'Doka da Tallafi' :
            user?.preferredLanguage === 'igbo' ? 'Iwu na Nkwado' :
            'Legal & Support'
          }
        >
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.colors.outline + '20' }]}
            onPress={() => router.push('/help')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                {user?.preferredLanguage === 'yoruba' ? 'Iranlọwọ ati Atilẹyin' :
                 user?.preferredLanguage === 'hausa' ? 'Taimako da Tallafi' :
                 user?.preferredLanguage === 'igbo' ? 'Enyemaka na Nkwado' :
                 'Help & Support'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.outline} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.colors.outline + '20' }]}
            onPress={() => router.push('/privacy-policy')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                {user?.preferredLanguage === 'yoruba' ? 'Eto Asiri' :
                 user?.preferredLanguage === 'hausa' ? 'Manufar Sirri' :
                 user?.preferredLanguage === 'igbo' ? 'Usoro Nzuzo' :
                 'Privacy Policy'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.outline} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.colors.outline + '20' }]}
            onPress={() => router.push('/terms')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="reader-outline" size={20} color={theme.colors.onSurface} />
              <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                {user?.preferredLanguage === 'yoruba' ? 'Awọn Ofin ati Ipo' :
                 user?.preferredLanguage === 'hausa' ? 'Sharuɗɗa da Yanayi' :
                 user?.preferredLanguage === 'igbo' ? 'Usoro na Ọnọdụ' :
                 'Terms & Conditions'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.outline} />
          </TouchableOpacity>
        </ProfileSection>

        {/* Account Actions */}
        <View style={styles.accountActions}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.logoutText, { color: theme.colors.onSurfaceVariant }]}>
              {user?.preferredLanguage === 'yoruba' ? 'Jade Kuro' :
               user?.preferredLanguage === 'hausa' ? 'Fita' :
               user?.preferredLanguage === 'igbo' ? 'Pụọ' :
               'Log Out'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.colors.errorContainer }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.onErrorContainer} />
            <Text style={[styles.deleteText, { color: theme.colors.onErrorContainer }]}>
              {user?.preferredLanguage === 'yoruba' ? 'Paarẹ Akọọlẹ' :
               user?.preferredLanguage === 'hausa' ? 'Share Asusun' :
               user?.preferredLanguage === 'igbo' ? 'Hichapụ Akaụntụ' :
               'Delete Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.appVersion}>
          <Text style={[styles.versionText, { color: theme.colors.outline }]}>
            MISS Legal AI v1.0.0
          </Text>
          <Text style={[styles.versionSubtext, { color: theme.colors.outline }]}>
            {user?.preferredLanguage === 'yoruba' ? 'Ti ṣẹda fun Naijiria' :
             user?.preferredLanguage === 'hausa' ? 'An hada don Najeriya' :
             user?.preferredLanguage === 'igbo' ? 'Emere maka Naịjirịa' :
             'Made for Nigeria'}
          </Text>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        language={user?.preferredLanguage || 'english'}
      />
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  photoEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
  },
  accountActions: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'medium',
    fontFamily: 'Inter-Medium',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: 'medium',
    fontFamily: 'Inter-Medium',
  },
  appVersion: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  versionSubtext: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
});
