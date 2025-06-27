import React, { Component, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { showToast } from '@/utils/toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to crash analytics
    this.reportError(error, errorInfo);
  }

  private async reportError(error: Error, errorInfo: any) {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          platform: Device.osName,
          version: Device.osVersion,
          model: Device.modelName,
          brand: Device.brand,
          appVersion: Application.nativeApplicationVersion,
          buildVersion: Application.nativeBuildVersion,
        },
        userAgent: navigator.userAgent,
      };

      // Store error report locally for potential upload
      await AsyncStorage.setItem(
        `error_report_${this.state.errorId}`,
        JSON.stringify(errorReport)
      );

      // TODO: Send to error reporting service (Sentry, Bugsnag, etc.)
      // await errorReportingService.reportError(errorReport);

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleReportIssue = () => {
    const errorSummary = this.state.error 
      ? `Error: ${this.state.error.message}\nStack: ${this.state.error.stack?.substring(0, 500)}...`
      : 'Unknown error occurred';

    Alert.alert(
      'Report Issue',
      'Would you like to report this issue to help us improve the app?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Report',
          onPress: () => {
            // TODO: Open email client or support form
            showToast('Thank you for your feedback. We will investigate this issue.', 'info');
          },
        },
      ]
    );
  };

  private renderErrorDetails = () => {
    if (!this.state.error) return null;

    return (
      <View style={styles.errorDetails}>
        <Text style={styles.errorTitle}>Error Details</Text>
        <ScrollView style={styles.errorScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.errorText}>
            <Text style={styles.errorLabel}>Message: </Text>
            {this.state.error.message}
          </Text>
          
          {this.state.error.stack && (
            <Text style={styles.errorText}>
              <Text style={styles.errorLabel}>Stack Trace: </Text>
              {this.state.error.stack}
            </Text>
          )}
          
          {this.state.errorInfo?.componentStack && (
            <Text style={styles.errorText}>
              <Text style={styles.errorLabel}>Component Stack: </Text>
              {this.state.errorInfo.componentStack}
            </Text>
          )}
          
          <Text style={styles.errorText}>
            <Text style={styles.errorLabel}>Error ID: </Text>
            {this.state.errorId}
          </Text>
          
          <Text style={styles.errorText}>
            <Text style={styles.errorLabel}>Timestamp: </Text>
            {new Date().toLocaleString()}
          </Text>
        </ScrollView>
      </View>
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={80} color="#ef4444" />
            </View>

            {/* Error Message */}
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error. We apologize for the inconvenience.
            </Text>

            {/* Multilingual Error Messages */}
            <View style={styles.multilingualContainer}>
              <Text style={styles.multilingualText}>
                🇳🇬 <Text style={styles.bold}>Yoruba:</Text> Aṣiṣe kan ṣẹlẹ. Gbiyanju lẹẹkansi.
              </Text>
              <Text style={styles.multilingualText}>
                🇳🇬 <Text style={styles.bold}>Hausa:</Text> Kuskure ya faru. Ka sake gwadawa.
              </Text>
              <Text style={styles.multilingualText}>
                🇳🇬 <Text style={styles.bold}>Igbo:</Text> Njehie mere. Nwaa ọzọ.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={this.handleRestart}>
                <Ionicons name="refresh" size={20} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={this.handleReportIssue}>
                <Ionicons name="bug" size={20} color="#6b7280" />
                <Text style={styles.secondaryButtonText}>Report Issue</Text>
              </TouchableOpacity>
            </View>

            {/* Error Details (Expandable) */}
            {__DEV__ && this.renderErrorDetails()}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                If this problem persists, please contact our support team.
              </Text>
              <Text style={styles.supportText}>
                📞 Support: +234-XXX-XXXX-XXX
              </Text>
              <Text style={styles.supportText}>
                📧 Email: support@misslegai.com
              </Text>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: 'Inter-Regular',
  },
  multilingualContainer: {
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  multilingualText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  bold: {
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  errorDetails: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },
  errorScroll: {
    maxHeight: 150,
  },
  errorText: {
    fontSize: 12,
    color: '#7f1d1d',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  errorLabel: {
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  supportText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
});
