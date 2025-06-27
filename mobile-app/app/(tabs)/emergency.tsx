import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Linking,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useEmergency } from '@/providers/EmergencyProvider';
import { useOffline } from '@/providers/OfflineProvider';
import EmergencyButton from '@/components/emergency/EmergencyButton';
import EmergencyContactCard from '@/components/emergency/EmergencyContactCard';
import LocationStatus from '@/components/emergency/LocationStatus';
import EmergencyHistory from '@/components/emergency/EmergencyHistory';
import AddContactModal from '@/components/emergency/AddContactModal';
import { EmergencyContact, EmergencyType } from '@/types/emergency';
import { showToast } from '@/utils/toast';
import { nigerianEmergencyNumbers } from '@/constants/emergency';

const { width, height } = Dimensions.get('window');

export default function EmergencyScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const {
    emergencyContacts,
    currentLocation,
    emergencyHistory,
    isEmergencyActive,
    activateEmergency,
    deactivateEmergency,
    addEmergencyContact,
    removeEmergencyContact,
    updateLocation,
  } = useEmergency();

  const [showAddContact, setShowAddContact] = useState(false);
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('security');
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [glowAnimation] = useState(new Animated.Value(0));
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Start pulsing animation for emergency button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
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
    // Update location periodically
    const updateLocationPeriodically = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          updateLocation(location.coords);
        }
      } catch (error) {
        console.error('Error updating location:', error);
      }
    };

    updateLocationPeriodically();
    const locationInterval = setInterval(updateLocationPeriodically, 60000); // Every minute

    return () => clearInterval(locationInterval);
  }, []);

  const handleEmergencyPress = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      if (isEmergencyActive) {
        // Deactivate emergency
        deactivateEmergency();
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
        setCountdown(0);
        return;
      }

      // Start countdown before activating emergency
      setCountdown(5);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
            }
            // Activate emergency after countdown
            activateEmergency(emergencyType);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Emergency activation error:', error);
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Aṣiṣe ninu imuṣiṣẹ ipajawiri'
          : user?.preferredLanguage === 'hausa'
          ? 'Kuskure wajen kunna gaggawa'
          : user?.preferredLanguage === 'igbo'
          ? 'Njehie na mmalite ihe mberede'
          : 'Error activating emergency',
        'error'
      );
    }
  };

  const handleEmergencyLongPress = () => {
    Alert.alert(
      user?.preferredLanguage === 'yoruba' 
        ? 'Yan Iru Ipajawiri'
        : user?.preferredLanguage === 'hausa'
        ? 'Zaɓi Nau\'in Gaggawa'
        : user?.preferredLanguage === 'igbo'
        ? 'Họrọ Ụdị Ihe Mberede'
        : 'Select Emergency Type',
      user?.preferredLanguage === 'yoruba' 
        ? 'Kini iru ipajawiri ti o nilo iranlowo fun?'
        : user?.preferredLanguage === 'hausa'
        ? 'Wane irin gaggawa kake bukatar taimako?'
        : user?.preferredLanguage === 'igbo'
        ? 'Kedu ụdị ihe mberede ị chọrọ enyemaka?'
        : 'What type of emergency do you need help with?',
      [
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Aabo' : 
                user?.preferredLanguage === 'hausa' ? 'Tsaro' : 
                user?.preferredLanguage === 'igbo' ? 'Nchekwa' : 'Security',
          onPress: () => setEmergencyType('security'),
        },
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Ilera' : 
                user?.preferredLanguage === 'hausa' ? 'Lafiya' : 
                user?.preferredLanguage === 'igbo' ? 'Ahụ Ike' : 'Medical',
          onPress: () => setEmergencyType('medical'),
        },
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Ina' : 
                user?.preferredLanguage === 'hausa' ? 'Gobara' : 
                user?.preferredLanguage === 'igbo' ? 'Ọkụ' : 'Fire',
          onPress: () => setEmergencyType('fire'),
        },
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Miiran' : 
                user?.preferredLanguage === 'hausa' ? 'Wasu' : 
                user?.preferredLanguage === 'igbo' ? 'Ndị Ọzọ' : 'Other',
          onPress: () => setEmergencyType('other'),
        },
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Fagilee' : 
                user?.preferredLanguage === 'hausa' ? 'Soke' : 
                user?.preferredLanguage === 'igbo' ? 'Kagbuo' : 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCallEmergencyServices = (number: string) => {
    Alert.alert(
      user?.preferredLanguage === 'yoruba' 
        ? 'Pe Awọn Iṣẹ Ipajawiri'
        : user?.preferredLanguage === 'hausa'
        ? 'Kira Ma\'aikatan Gaggawa'
        : user?.preferredLanguage === 'igbo'
        ? 'Kpọọ Ndị Ọrụ Ihe Mberede'
        : 'Call Emergency Services',
      user?.preferredLanguage === 'yoruba' 
        ? `Ṣe o fẹ pe ${number}?`
        : user?.preferredLanguage === 'hausa'
        ? `Ka so ka kira ${number}?`
        : user?.preferredLanguage === 'igbo'
        ? `Ị chọrọ ịkpọ ${number}?`
        : `Do you want to call ${number}?`,
      [
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Fagilee' : 
                user?.preferredLanguage === 'hausa' ? 'Soke' : 
                user?.preferredLanguage === 'igbo' ? 'Kagbuo' : 'Cancel',
          style: 'cancel',
        },
        {
          text: user?.preferredLanguage === 'yoruba' ? 'Pe' : 
                user?.preferredLanguage === 'hausa' ? 'Kira' : 
                user?.preferredLanguage === 'igbo' ? 'Kpọọ' : 'Call',
          onPress: () => Linking.openURL(`tel:${number}`),
        },
      ]
    );
  };

  const handleAddContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    try {
      await addEmergencyContact(contact);
      setShowAddContact(false);
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Olubasọrọ ipajawiri ti fi kun'
          : user?.preferredLanguage === 'hausa'
          ? 'An ƙara mai tuntuɓar gaggawa'
          : user?.preferredLanguage === 'igbo'
          ? 'Agbakwunyela onye nkwurịta okwu ihe mberede'
          : 'Emergency contact added successfully',
        'success'
      );
    } catch (error) {
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Aṣiṣe ninu fifi olubasọrọ kun'
          : user?.preferredLanguage === 'hausa'
          ? 'Kuskure wajen ƙara mai tuntuɓa'
          : user?.preferredLanguage === 'igbo'
          ? 'Njehie n\'ịgbakwunye onye nkwurịta okwu'
          : 'Error adding emergency contact',
        'error'
      );
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    try {
      await removeEmergencyContact(contactId);
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Olubasọrọ ipajawiri ti yọ kuro'
          : user?.preferredLanguage === 'hausa'
          ? 'An cire mai tuntuɓar gaggawa'
          : user?.preferredLanguage === 'igbo'
          ? 'Ewepụla onye nkwurịta okwu ihe mberede'
          : 'Emergency contact removed',
        'success'
      );
    } catch (error) {
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Aṣiṣe ninu yiyọ olubasọrọ kuro'
          : user?.preferredLanguage === 'hausa'
          ? 'Kuskure wajen cire mai tuntuɓa'
          : user?.preferredLanguage === 'igbo'
          ? 'Njehie n\'iwepụ onye nkwurịta okwu'
          : 'Error removing emergency contact',
        'error'
      );
    }
  };

  const cancelEmergencyCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setCountdown(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {user?.preferredLanguage === 'yoruba' 
            ? 'Ipajawiri'
            : user?.preferredLanguage === 'hausa'
            ? 'Gaggawa'
            : user?.preferredLanguage === 'igbo'
            ? 'Ihe Mberede'
            : 'Emergency'}
        </Text>
        
        {isEmergencyActive && (
          <View style={[styles.activeStatus, { backgroundColor: theme.colors.error }]}>
            <Text style={[styles.activeStatusText, { color: theme.colors.onError }]}>
              {user?.preferredLanguage === 'yoruba' ? 'Ṣiṣẹ' :
               user?.preferredLanguage === 'hausa' ? 'Kunna' :
               user?.preferredLanguage === 'igbo' ? 'Na-arụ ọrụ' :
               'ACTIVE'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Status */}
        <LocationStatus
          location={currentLocation}
          isOnline={isOnline}
          language={user?.preferredLanguage || 'english'}
        />

        {/* Emergency Button */}
        <View style={styles.emergencyButtonContainer}>
          {countdown > 0 && (
            <View style={[styles.countdownContainer, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={[styles.countdownText, { color: theme.colors.onErrorContainer }]}>
                {user?.preferredLanguage === 'yoruba' 
                  ? `Imuṣiṣẹ ipajawiri ni ${countdown}...`
                  : user?.preferredLanguage === 'hausa'
                  ? `Kunna gaggawa cikin ${countdown}...`
                  : user?.preferredLanguage === 'igbo'
                  ? `Na-amalite ihe mberede n'ime ${countdown}...`
                  : `Activating emergency in ${countdown}...`}
              </Text>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.colors.surface }]}
                onPress={cancelEmergencyCountdown}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.onSurface }]}>
                  {user?.preferredLanguage === 'yoruba' ? 'Fagilee' :
                   user?.preferredLanguage === 'hausa' ? 'Soke' :
                   user?.preferredLanguage === 'igbo' ? 'Kagbuo' :
                   'Cancel'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Animated.View
            style={[
              styles.emergencyButtonWrapper,
              {
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          >
            <EmergencyButton
              isActive={isEmergencyActive}
              emergencyType={emergencyType}
              onPress={handleEmergencyPress}
              onLongPress={handleEmergencyLongPress}
              disabled={countdown > 0}
              language={user?.preferredLanguage || 'english'}
            />
          </Animated.View>

          <Text style={[styles.emergencyInstructions, { color: theme.colors.outline }]}>
            {user?.preferredLanguage === 'yoruba' 
              ? 'Tẹ fun ipajawiri, ti o ba gun fun yan iru'
              : user?.preferredLanguage === 'hausa'
              ? 'Danna don gaggawa, tsaya tsayi don zaɓar nau\'i'
              : user?.preferredLanguage === 'igbo'
              ? 'Pịa maka ihe mberede, jide ogologo oge ịhọrọ ụdị'
              : 'Tap for emergency, hold to select type'}
          </Text>
        </View>

        {/* Emergency Services */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {user?.preferredLanguage === 'yoruba' 
              ? 'Awọn Iṣẹ Ipajawiri'
              : user?.preferredLanguage === 'hausa'
              ? 'Ma\'aikatan Gaggawa'
              : user?.preferredLanguage === 'igbo'
              ? 'Ndị Ọrụ Ihe Mberede'
              : 'Emergency Services'}
          </Text>
          
          {nigerianEmergencyNumbers.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => handleCallEmergencyServices(service.number)}
            >
              <View style={styles.serviceInfo}>
                <Ionicons name={service.icon} size={24} color={service.color} />
                <View style={styles.serviceText}>
                  <Text style={[styles.serviceName, { color: theme.colors.onSurfaceVariant }]}>
                    {service.name[user?.preferredLanguage || 'english'] || service.name.english}
                  </Text>
                  <Text style={[styles.serviceNumber, { color: theme.colors.outline }]}>
                    {service.number}
                  </Text>
                </View>
              </View>
              <Ionicons name="call" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {user?.preferredLanguage === 'yoruba' 
                ? 'Awọn Olubasọrọ Ipajawiri'
                : user?.preferredLanguage === 'hausa'
                ? 'Masu Tuntuɓar Gaggawa'
                : user?.preferredLanguage === 'igbo'
                ? 'Ndị Nkwurịta Okwu Ihe Mberede'
                : 'Emergency Contacts'}
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowAddContact(true)}
            >
              <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {emergencyContacts.length === 0 ? (
            <View style={[styles.emptyContacts, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Ionicons name="people-outline" size={48} color={theme.colors.outline} />
              <Text style={[styles.emptyContactsText, { color: theme.colors.outline }]}>
                {user?.preferredLanguage === 'yoruba' 
                  ? 'Ko si olubasọrọ ipajawiri kankan'
                  : user?.preferredLanguage === 'hausa'
                  ? 'Babu mai tuntuɓar gaggawa'
                  : user?.preferredLanguage === 'igbo'
                  ? 'Enweghị onye nkwurịta okwu ihe mberede'
                  : 'No emergency contacts added'}
              </Text>
              <TouchableOpacity
                style={[styles.addFirstContactButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowAddContact(true)}
              >
                <Text style={[styles.addFirstContactText, { color: theme.colors.onPrimary }]}>
                  {user?.preferredLanguage === 'yoruba' ? 'Fi Akọkọ Kun' :
                   user?.preferredLanguage === 'hausa' ? 'Ƙara Na Farko' :
                   user?.preferredLanguage === 'igbo' ? 'Gbakwunye Nke Mbụ' :
                   'Add First Contact'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            emergencyContacts.map((contact) => (
              <EmergencyContactCard
                key={contact.id}
                contact={contact}
                onRemove={handleRemoveContact}
                language={user?.preferredLanguage || 'english'}
              />
            ))
          )}
        </View>

        {/* Emergency History */}
        {emergencyHistory.length > 0 && (
          <EmergencyHistory
            history={emergencyHistory}
            language={user?.preferredLanguage || 'english'}
          />
        )}
      </ScrollView>

      {/* Add Contact Modal */}
      <AddContactModal
        visible={showAddContact}
        onClose={() => setShowAddContact(false)}
        onAdd={handleAddContact}
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
  activeStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emergencyButtonContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  countdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'medium',
    fontFamily: 'Inter-Medium',
  },
  emergencyButtonWrapper: {
    marginBottom: 16,
  },
  emergencyInstructions: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceText: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'medium',
    fontFamily: 'Inter-Medium',
  },
  serviceNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  emptyContacts: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyContactsText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: 'Inter-Regular',
  },
  addFirstContactButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addFirstContactText: {
    fontSize: 14,
    fontWeight: 'medium',
    fontFamily: 'Inter-Medium',
  },
});
