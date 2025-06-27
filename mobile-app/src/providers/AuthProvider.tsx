import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

import { User, AuthState, LoginCredentials, RegisterData, Subscription, UsageStats, DataUsage } from '@/types/auth';
import { ApiClient } from '@/services/ApiClient';
import { showToast } from '@/utils/toast';

interface AuthContextType {
  user: User | null;
  authState: AuthState;
  isLoading: boolean;
  preferredLanguage: string | null;
  subscription: Subscription | null;
  usageStats: UsageStats | null;
  dataUsage: DataUsage | null;
  
  // Auth methods
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  // Profile methods
  updateProfile: (updates: Partial<User>) => Promise<void>;
  uploadProfilePhoto: (uri: string) => Promise<string>;
  
  // Preferences
  setPreferredLanguage: (language: string) => void;
  
  // Password methods
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  
  // Email verification
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  
  // Subscription methods
  loadSubscription: () => Promise<void>;
  loadUsageStats: () => Promise<void>;
  loadDataUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  PREFERRED_LANGUAGE: 'preferred_language',
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [isLoading, setIsLoading] = useState(false);
  const [preferredLanguage, setPreferredLanguageState] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [dataUsage, setDataUsage] = useState<DataUsage | null>(null);

  const apiClient = new ApiClient();

  useEffect(() => {
    initializeAuth();
    loadPreferredLanguage();
  }, []);

  const initializeAuth = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (accessToken && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        apiClient.setAuthToken(accessToken);
        setAuthState('authenticated');
        
        // Load additional data
        await Promise.all([
          loadSubscription(),
          loadUsageStats(),
          loadDataUsage(),
        ]);
      } else {
        setAuthState('unauthenticated');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState('unauthenticated');
    }
  };

  const loadPreferredLanguage = async () => {
    try {
      const language = await AsyncStorage.getItem(STORAGE_KEYS.PREFERRED_LANGUAGE);
      setPreferredLanguageState(language || 'english');
    } catch (error) {
      console.error('Error loading preferred language:', error);
      setPreferredLanguageState('english');
    }
  };

  const setPreferredLanguage = async (language: string) => {
    try {
      setPreferredLanguageState(language);
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERRED_LANGUAGE, language);
      
      // Update user profile if authenticated
      if (user) {
        await updateProfile({ preferredLanguage: language });
      }
    } catch (error) {
      console.error('Error setting preferred language:', error);
    }
  };

  const saveAuthData = async (accessToken: string, refreshToken: string, userData: User) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)),
      ]);
      
      setUser(userData);
      apiClient.setAuthToken(accessToken);
      setAuthState('authenticated');
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw new Error('Failed to save authentication data');
    }
  };

  const clearAuthData = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);
      
      setUser(null);
      setSubscription(null);
      setUsageStats(null);
      setDataUsage(null);
      apiClient.clearAuthToken();
      setAuthState('unauthenticated');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { accessToken, refreshToken, user: userData } = response.data;
      
      await saveAuthData(accessToken, refreshToken, userData);
      
      // Load additional data after successful login
      await Promise.all([
        loadSubscription(),
        loadUsageStats(),
        loadDataUsage(),
      ]);
      
      showToast(
        preferredLanguage === 'yoruba' ? 'O ti wọle tagbagba' :
        preferredLanguage === 'hausa' ? 'An shiga da nasara' :
        preferredLanguage === 'igbo' ? 'Abanye nke ọma' :
        'Login successful',
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      showToast(
        preferredLanguage === 'yoruba' ? 'Aṣiṣe ninu wiwọle' :
        preferredLanguage === 'hausa' ? 'Kuskure wajen shiga' :
        preferredLanguage === 'igbo' ? 'Njehie n\'ịbanye' :
        message,
        'error'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        ...data,
        preferredLanguage: preferredLanguage || 'english',
      });
      
      const { accessToken, refreshToken, user: userData } = response.data;
      await saveAuthData(accessToken, refreshToken, userData);
      
      showToast(
        preferredLanguage === 'yoruba' ? 'Akọọlẹ ti ṣẹda tagbagba' :
        preferredLanguage === 'hausa' ? 'An kirkiri asusun da nasara' :
        preferredLanguage === 'igbo' ? 'Emepụtara akaụntụ nke ọma' :
        'Account created successfully',
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      showToast(
        preferredLanguage === 'yoruba' ? 'Aṣiṣe ninu ṣiṣẹda akọọlẹ' :
        preferredLanguage === 'hausa' ? 'Kuskure wajen kirkirin asusun' :
        preferredLanguage === 'igbo' ? 'Njehie n\'imepụta akaụntụ' :
        message,
        'error'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Notify server about logout
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        // Continue with local logout even if server request fails
        console.warn('Server logout failed:', error);
      }
      
      await clearAuthData();
      
      showToast(
        preferredLanguage === 'yoruba' ? 'O ti jade tagbagba' :
        preferredLanguage === 'hausa' ? 'An fita da nasara' :
        preferredLanguage === 'igbo' ? 'Apụọla nke ọma' :
        'Logged out successfully',
        'success'
      );
    } catch (error) {
      console.error('Logout error:', error);
      // Force local logout even if there's an error
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthState = async (): Promise<boolean> => {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      return !!accessToken;
    } catch (error) {
      console.error('Error checking auth state:', error);
      return false;
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/auth/refresh', {
        refreshToken: refreshTokenValue,
      });

      const { accessToken, refreshToken: newRefreshToken, user: userData } = response.data;
      await saveAuthData(accessToken, newRefreshToken, userData);
    } catch (error) {
      console.error('Token refresh failed:', error);
      await clearAuthData();
      router.replace('/(auth)');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const response = await apiClient.put('/user/profile', updates);
      const updatedUser = { ...user, ...response.data };
      
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      
      showToast(
        preferredLanguage === 'yoruba' ? 'Profile ti ṣe ayipada' :
        preferredLanguage === 'hausa' ? 'An sabunta profile' :
        preferredLanguage === 'igbo' ? 'Edegharịala profile' :
        'Profile updated successfully',
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Profile update failed';
      showToast(
        preferredLanguage === 'yoruba' ? 'Aṣiṣe ninu yiyipada profile' :
        preferredLanguage === 'hausa' ? 'Kuskure wajen sabunta profile' :
        preferredLanguage === 'igbo' ? 'Njehie n\'idegharị profile' :
        message,
        'error'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadProfilePhoto = async (uri: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await apiClient.post('/user/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const photoUrl = response.data.photoUrl;
      await updateProfile({ profilePhoto: photoUrl });
      
      return photoUrl;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Photo upload failed';
      showToast(message, 'error');
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      showToast(
        preferredLanguage === 'yoruba' ? 'Ọrọ igbaniwọle ti yipada' :
        preferredLanguage === 'hausa' ? 'An canza kalmar shiga' :
        preferredLanguage === 'igbo' ? 'Agbanwela okwu nbanye' :
        'Password changed successfully',
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password change failed';
      showToast(
        preferredLanguage === 'yoruba' ? 'Aṣiṣe ninu yiyipada ọrọ igbaniwọle' :
        preferredLanguage === 'hausa' ? 'Kuskure wajen canza kalmar shiga' :
        preferredLanguage === 'igbo' ? 'Njehie n\'ịgbanwe okwu nbanye' :
        message,
        'error'
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      
      showToast(
        preferredLanguage === 'yoruba' ? 'Ifiranṣẹ atunniwọle ti firanṣẹ' :
        preferredLanguage === 'hausa' ? 'An aika da saƙon sake saita' :
        preferredLanguage === 'igbo' ? 'Ezigala ozi ntọgharị' :
        'Password reset email sent',
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password reset request failed';
      showToast(message, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      });
      
      showToast(
        preferredLanguage === 'yoruba' ? 'Ọrọ igbaniwọle ti tun ṣeto' :
        preferredLanguage === 'hausa' ? 'An sake saita kalmar shiga' :
        preferredLanguage === 'igbo' ? 'Etọgharịala okwu nbanye' :
        'Password reset successfully',
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password reset failed';
      showToast(message, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/verify-email', { token });
      
      if (user) {
        const updatedUser = { ...user, emailVerified: true };
        setUser(updatedUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      }
      
      showToast(
        preferredLanguage === 'yoruba' ? 'Email ti jẹrisi' :
        preferredLanguage === 'hausa' ? 'An tabbatar da email' :
        preferredLanguage === 'igbo' ? 'Akwadola email' :
        'Email verified successfully',
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Email verification failed';
      showToast(message, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) throw new Error('No email available');

    setIsLoading(true);
    try {
      await apiClient.post('/auth/resend-verification', {
        email: user.email,
      });
      
      showToast(
        preferredLanguage === 'yoruba' ? 'Ifiranṣẹ ijẹrisi ti tun firanṣẹ' :
        preferredLanguage === 'hausa' ? 'An sake aika da saƙon tabbatarwa' :
        preferredLanguage === 'igbo' ? 'Ezigharịala ozi nkwado' :
        'Verification email sent',
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to resend verification email';
      showToast(message, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      await apiClient.delete('/user/account');
      await clearAuthData();
      
      showToast(
        preferredLanguage === 'yoruba' ? 'Akọọlẹ ti paarẹ' :
        preferredLanguage === 'hausa' ? 'An share asusun' :
        preferredLanguage === 'igbo' ? 'Ehichapụla akaụntụ' :
        'Account deleted successfully',
        'success'
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Account deletion failed';
      showToast(message, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await apiClient.get('/user/subscription');
      setSubscription(response.data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await apiClient.get('/user/usage-stats');
      setUsageStats(response.data);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const loadDataUsage = async () => {
    try {
      const response = await apiClient.get('/user/data-usage');
      setDataUsage(response.data);
    } catch (error) {
      console.error('Error loading data usage:', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    authState,
    isLoading,
    preferredLanguage,
    subscription,
    usageStats,
    dataUsage,
    
    login,
    register,
    logout,
    checkAuthState,
    refreshToken,
    deleteAccount,
    
    updateProfile,
    uploadProfilePhoto,
    
    setPreferredLanguage,
    
    changePassword,
    requestPasswordReset,
    resetPassword,
    
    verifyEmail,
    resendVerificationEmail,
    
    loadSubscription,
    loadUsageStats,
    loadDataUsage,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
