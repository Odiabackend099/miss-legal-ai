import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useOffline } from '@/providers/OfflineProvider';
import { useLawyers } from '@/hooks/useLawyers';
import LawyerCard from '@/components/lawyers/LawyerCard';
import FilterChips from '@/components/lawyers/FilterChips';
import SortModal from '@/components/lawyers/SortModal';
import BookingModal from '@/components/lawyers/BookingModal';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Lawyer, LawyerSpecialization, LawyerLocation } from '@/types/lawyers';
import { showToast } from '@/utils/toast';

export default function LawyersScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const {
    lawyers,
    loading,
    refreshing,
    loadLawyers,
    refreshLawyers,
    bookConsultation,
  } = useLawyers();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<LawyerSpecialization | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<LawyerLocation | 'all'>('all');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'price' | 'availability'>('rating');

  useEffect(() => {
    loadLawyers();
  }, []);

  const filteredAndSortedLawyers = useMemo(() => {
    let filtered = lawyers.filter(lawyer => {
      const matchesSearch = 
        lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lawyer.specializations.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        lawyer.bio.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecialization = 
        selectedSpecialization === 'all' || 
        lawyer.specializations.includes(selectedSpecialization);
      
      const matchesLocation = 
        selectedLocation === 'all' || 
        lawyer.location === selectedLocation;
      
      const matchesLanguage = 
        !user?.preferredLanguage || 
        lawyer.languages.includes(user.preferredLanguage) ||
        lawyer.languages.includes('english');

      return matchesSearch && matchesSpecialization && matchesLocation && matchesLanguage;
    });

    // Sort lawyers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experienceYears - a.experienceYears;
        case 'price':
          return a.consultationFee - b.consultationFee;
        case 'availability':
          return a.isAvailable === b.isAvailable ? 0 : a.isAvailable ? -1 : 1;
        default:
          return 0;
      }
    });

    return filtered;
  }, [lawyers, searchQuery, selectedSpecialization, selectedLocation, sortBy, user?.preferredLanguage]);

  const specializationOptions = [
    { key: 'all', label: 'All' },
    { key: 'property_law', label: 'Property Law' },
    { key: 'family_law', label: 'Family Law' },
    { key: 'corporate_law', label: 'Corporate Law' },
    { key: 'criminal_law', label: 'Criminal Law' },
    { key: 'employment_law', label: 'Employment Law' },
    { key: 'intellectual_property', label: 'IP Law' },
    { key: 'immigration_law', label: 'Immigration' },
    { key: 'tax_law', label: 'Tax Law' },
  ];

  const locationOptions = [
    { key: 'all', label: 'All Locations' },
    { key: 'lagos', label: 'Lagos' },
    { key: 'abuja', label: 'Abuja' },
    { key: 'kano', label: 'Kano' },
    { key: 'ibadan', label: 'Ibadan' },
    { key: 'port_harcourt', label: 'Port Harcourt' },
    { key: 'kaduna', label: 'Kaduna' },
    { key: 'enugu', label: 'Enugu' },
    { key: 'abeokuta', label: 'Abeokuta' },
  ];

  const handleLawyerPress = (lawyer: Lawyer) => {
    router.push({
      pathname: '/lawyer-profile',
      params: { lawyerId: lawyer.id },
    });
  };

  const handleBookConsultation = (lawyer: Lawyer) => {
    if (!isOnline) {
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'O nilo ina-laini lati beere isunmọ'
          : user?.preferredLanguage === 'hausa'
          ? 'Kana bukatar intanet don abukar shawarwari'
          : user?.preferredLanguage === 'igbo'
          ? 'Ịchọrọ ịntanetị ka ị debata ndụmọdụ'
          : 'You need internet connection to book consultation',
        'error'
      );
      return;
    }

    if (!lawyer.isAvailable) {
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Agbẹjọro yii ko wa lọwọlọwọ'
          : user?.preferredLanguage === 'hausa'
          ? 'Lauyan nan ba ya samuwa a yanzu'
          : user?.preferredLanguage === 'igbo'
          ? 'Onye ọka iwu a adịghị ugbu a'
          : 'This lawyer is not available right now',
        'warning'
      );
      return;
    }

    setSelectedLawyer(lawyer);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (bookingDetails: any) => {
    try {
      if (!selectedLawyer) return;

      await bookConsultation(selectedLawyer.id, bookingDetails);
      setShowBookingModal(false);
      setSelectedLawyer(null);
      
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Isunmọ ti beere tagbagba'
          : user?.preferredLanguage === 'hausa'
          ? 'An abukar shawarwari da nasara'
          : user?.preferredLanguage === 'igbo'
          ? 'Debatara ndụmọdụ ahụ nke ọma'
          : 'Consultation booked successfully',
        'success'
      );
    } catch (error) {
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Aṣiṣe ninu bibere isunmọ'
          : user?.preferredLanguage === 'hausa'
          ? 'Kuskure wajen abukar shawarwari'
          : user?.preferredLanguage === 'igbo'
          ? 'Njehie na ndebata ndụmọdụ'
          : 'Error booking consultation',
        'error'
      );
    }
  };

  const renderLawyer = ({ item }: { item: Lawyer }) => (
    <LawyerCard
      lawyer={item}
      onPress={() => handleLawyerPress(item)}
      onBookConsultation={() => handleBookConsultation(item)}
      language={user?.preferredLanguage || 'english'}
    />
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="people-outline"
      title={
        user?.preferredLanguage === 'yoruba' 
          ? 'Ko si agbẹjọro ti a ri'
          : user?.preferredLanguage === 'hausa'
          ? 'Ba a sami lauya ba'
          : user?.preferredLanguage === 'igbo'
          ? 'Ahụghị onye ọka iwu ọ bụla'
          : 'No lawyers found'
      }
      subtitle={
        user?.preferredLanguage === 'yoruba' 
          ? 'Gbiyanju yiyipada awọn asayan asẹ rẹ'
          : user?.preferredLanguage === 'hausa'
          ? 'Gwada canza zaɓin tace'
          : user?.preferredLanguage === 'igbo'
          ? 'Gbalịa ịgbanwe nhọrọ nzacha gị'
          : 'Try adjusting your filter options'
      }
      actionText={
        user?.preferredLanguage === 'yoruba' 
          ? 'Pada Si Gbogbo'
          : user?.preferredLanguage === 'hausa'
          ? 'Koma Zuwa Duka'
          : user?.preferredLanguage === 'igbo'
          ? 'Laghachi Na Niile'
          : 'Reset Filters'
      }
      onAction={() => {
        setSearchQuery('');
        setSelectedSpecialization('all');
        setSelectedLocation('all');
      }}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {user?.preferredLanguage === 'yoruba' 
            ? 'Awọn Agbẹjọro'
            : user?.preferredLanguage === 'hausa'
            ? 'Lauya'
            : user?.preferredLanguage === 'igbo'
            ? 'Ndị Ọka Iwu'
            : 'Lawyers'}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="filter" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          
          {!isOnline && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="cloud-offline" size={16} color={theme.colors.error} />
            </View>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Ionicons name="search" size={20} color={theme.colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.onSurfaceVariant }]}
          placeholder={
            user?.preferredLanguage === 'yoruba' 
              ? 'Wa agbẹjọro tabi ẹka...'
              : user?.preferredLanguage === 'hausa'
              ? 'Nemo lauya ko sassa...'
              : user?.preferredLanguage === 'igbo'
              ? 'Chọọ onye ọka iwu ma ọ bụ ngalaba...'
              : 'Search lawyers or specialization...'
          }
          placeholderTextColor={theme.colors.outline}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <FilterChips
          label={
            user?.preferredLanguage === 'yoruba' ? 'Ẹka' :
            user?.preferredLanguage === 'hausa' ? 'Sassa' :
            user?.preferredLanguage === 'igbo' ? 'Ngalaba' :
            'Specialization'
          }
          options={specializationOptions}
          selectedValue={selectedSpecialization}
          onValueChange={setSelectedSpecialization}
          language={user?.preferredLanguage || 'english'}
        />
        
        <FilterChips
          label={
            user?.preferredLanguage === 'yoruba' ? 'Ibi' :
            user?.preferredLanguage === 'hausa' ? 'Wuri' :
            user?.preferredLanguage === 'igbo' ? 'Ebe' :
            'Location'
          }
          options={locationOptions}
          selectedValue={selectedLocation}
          onValueChange={setSelectedLocation}
          language={user?.preferredLanguage || 'english'}
        />
      </View>

      {/* Results Count */}
      {filteredAndSortedLawyers.length > 0 && (
        <View style={styles.resultsCount}>
          <Text style={[styles.resultsText, { color: theme.colors.outline }]}>
            {filteredAndSortedLawyers.length === 1 
              ? (user?.preferredLanguage === 'yoruba' ? '1 agbẹjọro ti wa' :
                 user?.preferredLanguage === 'hausa' ? '1 lauya da aka samu' :
                 user?.preferredLanguage === 'igbo' ? '1 onye ọka iwu achọtara' :
                 '1 lawyer found')
              : (user?.preferredLanguage === 'yoruba' ? `${filteredAndSortedLawyers.length} awọn agbẹjọro ti wa` :
                 user?.preferredLanguage === 'hausa' ? `${filteredAndSortedLawyers.length} lauyoyi da aka samu` :
                 user?.preferredLanguage === 'igbo' ? `${filteredAndSortedLawyers.length} ndị ọka iwu achọtara` :
                 `${filteredAndSortedLawyers.length} lawyers found`)
            }
          </Text>
        </View>
      )}

      {/* Lawyers List */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredAndSortedLawyers.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredAndSortedLawyers}
          renderItem={renderLawyer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshLawyers}
              tintColor={theme.colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        selectedSort={sortBy}
        onSortChange={setSortBy}
        language={user?.preferredLanguage || 'english'}
      />

      {/* Booking Modal */}
      <BookingModal
        visible={showBookingModal}
        lawyer={selectedLawyer}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedLawyer(null);
        }}
        onConfirm={handleConfirmBooking}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  separator: {
    height: 16,
  },
});
