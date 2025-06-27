import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useOffline } from '@/providers/OfflineProvider';
import { useDocuments } from '@/hooks/useDocuments';
import DocumentCard from '@/components/documents/DocumentCard';
import FilterTabs from '@/components/documents/FilterTabs';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import FloatingActionButton from '@/components/FloatingActionButton';
import { Document, DocumentType, DocumentStatus } from '@/types/documents';
import { showToast } from '@/utils/toast';

export default function DocumentsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const {
    documents,
    loading,
    refreshing,
    loadDocuments,
    refreshDocuments,
    downloadDocument,
    shareDocument,
    deleteDocument,
  } = useDocuments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<DocumentType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | 'all'>('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedFilter === 'all' || doc.type === selectedFilter;
      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchQuery, selectedFilter, selectedStatus]);

  const documentTypes = [
    { key: 'all', label: 'All' },
    { key: 'tenancy_agreement', label: 'Tenancy' },
    { key: 'affidavit', label: 'Affidavit' },
    { key: 'power_of_attorney', label: 'Power of Attorney' },
    { key: 'will', label: 'Will' },
    { key: 'contract', label: 'Contract' },
  ];

  const statusTypes = [
    { key: 'all', label: 'All Status' },
    { key: 'draft', label: 'Draft' },
    { key: 'processing', label: 'Processing' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed', label: 'Failed' },
  ];

  const handleDocumentPress = (document: Document) => {
    router.push({
      pathname: '/document-viewer',
      params: { documentId: document.id },
    });
  };

  const handleDownload = async (document: Document) => {
    try {
      if (!isOnline && !document.isOfflineAvailable) {
        showToast(
          user?.preferredLanguage === 'yoruba' 
            ? 'O nilo ina-laini lati gba iwe naa'
            : user?.preferredLanguage === 'hausa'
            ? 'Kana bukatar intanet don saukar da takardar'
            : user?.preferredLanguage === 'igbo'
            ? 'Ịchọrọ ịntanetị ka ị budata akwụkwọ ahụ'
            : 'You need internet connection to download this document',
          'error'
        );
        return;
      }

      await downloadDocument(document.id);
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Iwe ti gba tagbagba'
          : user?.preferredLanguage === 'hausa'
          ? 'An sauke takardar da nasara'
          : user?.preferredLanguage === 'igbo'
          ? 'Budata akwụkwọ ahụ nke ọma'
          : 'Document downloaded successfully',
        'success'
      );
    } catch (error) {
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Aṣiṣe ninu gbigba iwe naa'
          : user?.preferredLanguage === 'hausa'
          ? 'Kuskure wajen saukar da takardar'
          : user?.preferredLanguage === 'igbo'
          ? 'Nduzi na nbudata akwụkwọ ahụ'
          : 'Error downloading document',
        'error'
      );
    }
  };

  const handleShare = async (document: Document) => {
    try {
      await shareDocument(document.id);
    } catch (error) {
      showToast(
        user?.preferredLanguage === 'yoruba' 
          ? 'Aṣiṣe ninu pinpin iwe naa'
          : user?.preferredLanguage === 'hausa'
          ? 'Kuskure wajen raba takardar'
          : user?.preferredLanguage === 'igbo'
          ? 'Nduzi na nkesa akwụkwọ ahụ'
          : 'Error sharing document',
        'error'
      );
    }
  };

  const handleDelete = (document: Document) => {
    Alert.alert(
      user?.preferredLanguage === 'yoruba' 
        ? 'Paarẹ Iwe'
        : user?.preferredLanguage === 'hausa'
        ? 'Share Takarda'
        : user?.preferredLanguage === 'igbo'
        ? 'Hichapụ Akwụkwọ'
        : 'Delete Document',
      user?.preferredLanguage === 'yoruba' 
        ? `Ṣe o fẹ paarẹ "${document.title}"? Eyi ko le pada si ẹhin.`
        : user?.preferredLanguage === 'hausa'
        ? `Ka so ka share "${document.title}"? Ba za a iya mayar da shi ba.`
        : user?.preferredLanguage === 'igbo'
        ? `Ị chọrọ ihichapụ "${document.title}"? A gaghị enwe ike iweghachi ya.`
        : `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
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
              await deleteDocument(document.id);
              showToast(
                user?.preferredLanguage === 'yoruba' 
                  ? 'Iwe ti parẹ'
                  : user?.preferredLanguage === 'hausa'
                  ? 'An share takarda'
                  : user?.preferredLanguage === 'igbo'
                  ? 'Ehichapụla akwụkwọ ahụ'
                  : 'Document deleted',
                'success'
              );
            } catch (error) {
              showToast(
                user?.preferredLanguage === 'yoruba' 
                  ? 'Aṣiṣe ninu piparẹ iwe'
                  : user?.preferredLanguage === 'hausa'
                  ? 'Kuskure wajen share takarda'
                  : user?.preferredLanguage === 'igbo'
                  ? 'Nduzi na mhichapụ akwụkwọ'
                  : 'Error deleting document',
                'error'
              );
            }
          },
        },
      ]
    );
  };

  const handleCreateDocument = () => {
    router.push('/voice-chat?mode=document');
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <DocumentCard
      document={item}
      onPress={() => handleDocumentPress(item)}
      onDownload={() => handleDownload(item)}
      onShare={() => handleShare(item)}
      onDelete={() => handleDelete(item)}
      language={user?.preferredLanguage || 'english'}
    />
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="document-text-outline"
      title={
        user?.preferredLanguage === 'yoruba' 
          ? 'Ko si iwe kankan'
          : user?.preferredLanguage === 'hausa'
          ? 'Babu takarda'
          : user?.preferredLanguage === 'igbo'
          ? 'Enweghị akwụkwọ ọ bụla'
          : 'No documents yet'
      }
      subtitle={
        user?.preferredLanguage === 'yoruba' 
          ? 'Bẹrẹ pẹlu ṣiṣẹda iwe ofin akọkọ rẹ'
          : user?.preferredLanguage === 'hausa'
          ? 'Fara da ƙirƙirar takardar shari\'a ta farko'
          : user?.preferredLanguage === 'igbo'
          ? 'Bido site na imepụta akwụkwọ iwu mbụ gị'
          : 'Start by creating your first legal document'
      }
      actionText={
        user?.preferredLanguage === 'yoruba' 
          ? 'Ṣẹda Iwe'
          : user?.preferredLanguage === 'hausa'
          ? 'Ƙirƙiri Takarda'
          : user?.preferredLanguage === 'igbo'
          ? 'Mepụta Akwụkwọ'
          : 'Create Document'
      }
      onAction={handleCreateDocument}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {user?.preferredLanguage === 'yoruba' 
            ? 'Awọn Iwe'
            : user?.preferredLanguage === 'hausa'
            ? 'Takardu'
            : user?.preferredLanguage === 'igbo'
            ? 'Akwụkwọ'
            : 'Documents'}
        </Text>
        
        {!isOnline && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline" size={16} color={theme.colors.error} />
            <Text style={[styles.offlineText, { color: theme.colors.error }]}>
              {user?.preferredLanguage === 'yoruba' ? 'Ailagbara' :
               user?.preferredLanguage === 'hausa' ? 'Babu intanet' :
               user?.preferredLanguage === 'igbo' ? 'Enweghị ịntanetị' :
               'Offline'}
            </Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Ionicons name="search" size={20} color={theme.colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.onSurfaceVariant }]}
          placeholder={
            user?.preferredLanguage === 'yoruba' 
              ? 'Wa ninu awọn iwe...'
              : user?.preferredLanguage === 'hausa'
              ? 'Nemo cikin takardu...'
              : user?.preferredLanguage === 'igbo'
              ? 'Chọọ n\'ime akwụkwọ...'
              : 'Search documents...'
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

      {/* Filter Tabs */}
      <FilterTabs
        options={documentTypes}
        selectedValue={selectedFilter}
        onValueChange={setSelectedFilter}
        language={user?.preferredLanguage || 'english'}
      />

      {/* Status Filter */}
      <FilterTabs
        options={statusTypes}
        selectedValue={selectedStatus}
        onValueChange={setSelectedStatus}
        language={user?.preferredLanguage || 'english'}
        style={styles.statusFilter}
      />

      {/* Document List */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredDocuments.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredDocuments}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshDocuments}
              tintColor={theme.colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        icon="add"
        onPress={handleCreateDocument}
        disabled={!isOnline}
        style={!isOnline ? styles.disabledFab : undefined}
      />

      {/* Document Count */}
      {filteredDocuments.length > 0 && (
        <View style={[styles.documentCount, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.countText, { color: theme.colors.onSurfaceVariant }]}>
            {filteredDocuments.length === 1 
              ? (user?.preferredLanguage === 'yoruba' ? '1 iwe' :
                 user?.preferredLanguage === 'hausa' ? '1 takarda' :
                 user?.preferredLanguage === 'igbo' ? '1 akwụkwọ' :
                 '1 document')
              : (user?.preferredLanguage === 'yoruba' ? `${filteredDocuments.length} awọn iwe` :
                 user?.preferredLanguage === 'hausa' ? `${filteredDocuments.length} takardu` :
                 user?.preferredLanguage === 'igbo' ? `${filteredDocuments.length} akwụkwọ` :
                 `${filteredDocuments.length} documents`)
            }
          </Text>
        </View>
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
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offlineText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
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
  statusFilter: {
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },
  disabledFab: {
    opacity: 0.5,
  },
  documentCount: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});
