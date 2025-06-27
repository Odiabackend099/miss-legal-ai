import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export const showToast = (
  message: string, 
  type: ToastType = 'info',
  options?: {
    duration?: number;
    position?: 'top' | 'bottom';
    title?: string;
    onPress?: () => void;
    onHide?: () => void;
  }
) => {
  Toast.show({
    type,
    text1: options?.title || getDefaultTitle(type),
    text2: message,
    position: options?.position || 'top',
    visibilityTime: options?.duration || 4000,
    autoHide: true,
    topOffset: 60,
    bottomOffset: 40,
    onPress: options?.onPress,
    onHide: options?.onHide,
  });
};

const getDefaultTitle = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
    default:
      return 'Info';
  }
};

export const hideToast = () => {
  Toast.hide();
};

export const showSuccessToast = (message: string, options?: Parameters<typeof showToast>[2]) => {
  showToast(message, 'success', options);
};

export const showErrorToast = (message: string, options?: Parameters<typeof showToast>[2]) => {
  showToast(message, 'error', options);
};

export const showWarningToast = (message: string, options?: Parameters<typeof showToast>[2]) => {
  showToast(message, 'warning', options);
};

export const showInfoToast = (message: string, options?: Parameters<typeof showToast>[2]) => {
  showToast(message, 'info', options);
};

// Predefined toast configurations for common scenarios
export const toastConfig = {
  // Network related toasts
  networkError: () => showErrorToast('Network error. Please check your connection.'),
  offline: () => showWarningToast('You are currently offline. Some features may be limited.'),
  online: () => showSuccessToast('Connection restored. All features are now available.'),
  
  // Authentication related toasts
  loginSuccess: () => showSuccessToast('Successfully logged in!'),
  loginError: () => showErrorToast('Login failed. Please check your credentials.'),
  logoutSuccess: () => showSuccessToast('Successfully logged out.'),
  sessionExpired: () => showWarningToast('Session expired. Please log in again.'),
  
  // Voice related toasts
  voicePermissionDenied: () => showErrorToast('Microphone permission is required for voice features.'),
  voiceProcessingError: () => showErrorToast('Error processing voice input. Please try again.'),
  voiceRecordingStarted: () => showInfoToast('Recording started. Speak now.'),
  voiceRecordingStopped: () => showInfoToast('Recording stopped. Processing...'),
  
  // Document related toasts
  documentSaved: () => showSuccessToast('Document saved successfully.'),
  documentError: () => showErrorToast('Error saving document. Please try again.'),
  documentShared: () => showSuccessToast('Document shared successfully.'),
  
  // Emergency related toasts
  emergencyActivated: () => showWarningToast('Emergency mode activated. Help is on the way.', {
    duration: 10000,
  }),
  emergencyDeactivated: () => showInfoToast('Emergency mode deactivated.'),
  emergencyContactsNotified: () => showSuccessToast('Emergency contacts have been notified.'),
  
  // Payment related toasts
  paymentSuccess: () => showSuccessToast('Payment completed successfully.'),
  paymentError: () => showErrorToast('Payment failed. Please try again.'),
  subscriptionUpdated: () => showSuccessToast('Subscription updated successfully.'),
  
  // General app toasts
  featureComingSoon: () => showInfoToast('This feature is coming soon!'),
  premiumRequired: () => showWarningToast('This feature requires a premium subscription.'),
  updateAvailable: () => showInfoToast('App update available. Please update for the best experience.'),
  maintenanceMode: () => showWarningToast('App is under maintenance. Some features may be unavailable.'),
};

export default {
  show: showToast,
  hide: hideToast,
  success: showSuccessToast,
  error: showErrorToast,
  warning: showWarningToast,
  info: showInfoToast,
  config: toastConfig,
};
