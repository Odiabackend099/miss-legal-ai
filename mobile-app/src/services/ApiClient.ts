import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-netinfo/src';

import { ApiResponse } from '@/types';
import { showToast } from '@/utils/toast';

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface QueuedRequest {
  id: string;
  config: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timestamp: number;
  retryCount: number;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private authToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.misslegai.com',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MISS-Legal-AI-Mobile/1.0.0',
        'X-Platform': 'mobile',
        'X-App-Version': '1.0.0',
      },
    });

    this.setupInterceptors();
    this.setupNetworkListener();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (this.authToken && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Add request timestamp
        config.metadata = {
          startTime: Date.now(),
        };

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response time
        const endTime = Date.now();
        const startTime = response.config.metadata?.startTime;
        if (startTime) {
          const responseTime = endTime - startTime;
          console.log(`API Response time: ${responseTime}ms for ${response.config.url}`);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (token refresh)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearAuthToken();
            // You can emit an event here or use a callback to redirect to login
            showToast('Session expired. Please log in again.', 'warning');
            return Promise.reject(refreshError);
          }
        }

        // Handle network errors
        if (!error.response) {
          // Network error - queue request for retry when online
          if (originalRequest.retryWhenOnline !== false) {
            return this.queueRequestForRetry(originalRequest);
          }
        }

        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || '60';
          const delay = parseInt(retryAfter) * 1000;
          
          showToast(`Rate limit exceeded. Retrying in ${retryAfter} seconds.`, 'warning');
          
          await this.delay(delay);
          return this.client(originalRequest);
        }

        // Handle server errors (5xx) with retry
        if (error.response?.status >= 500 && originalRequest.retryCount < this.config.retryAttempts) {
          originalRequest.retryCount = (originalRequest.retryCount || 0) + 1;
          
          const delay = this.config.retryDelay * Math.pow(2, originalRequest.retryCount - 1);
          await this.delay(delay);
          
          return this.client(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  private setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        this.processRequestQueue();
      }
    });
  }

  private async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${this.config.baseURL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      await this.setAuthToken(accessToken);
      await SecureStore.setItemAsync('refresh_token', newRefreshToken);
    } catch (error) {
      await this.clearAuthToken();
      throw error;
    }
  }

  private queueRequestForRetry(config: AxiosRequestConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: Date.now().toString(),
        config,
        resolve,
        reject,
        timestamp: Date.now(),
        retryCount: 0,
      };

      this.requestQueue.push(queuedRequest);
      
      // Limit queue size
      if (this.requestQueue.length > 100) {
        const oldestRequest = this.requestQueue.shift();
        if (oldestRequest) {
          oldestRequest.reject(new Error('Request queue overflow'));
        }
      }
    });
  }

  private async processRequestQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (!request) continue;

      try {
        const response = await this.client(request.config);
        request.resolve(response);
      } catch (error) {
        request.retryCount++;
        
        if (request.retryCount < this.config.retryAttempts) {
          // Re-queue for retry
          this.requestQueue.unshift(request);
          await this.delay(this.config.retryDelay * request.retryCount);
        } else {
          request.reject(error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    await SecureStore.setItemAsync('access_token', token);
  }

  public async clearAuthToken(): Promise<void> {
    this.authToken = null;
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  }

  // Public API methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.get(url, config);
  }

  public async post<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.post(url, data, config);
  }

  public async put<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.put(url, data, config);
  }

  public async patch<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.patch(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.delete(url, config);
  }

  // File upload with progress
  public async uploadFile<T = any>(
    url: string,
    file: FormData,
    onProgress?: (progressEvent: any) => void,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.client.post(url, file, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  }

  // Download file with progress
  public async downloadFile(
    url: string,
    onProgress?: (progressEvent: any) => void,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<Blob>> {
    return this.client.get(url, {
      ...config,
      responseType: 'blob',
      onDownloadProgress: onProgress,
    });
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', {
        timeout: 5000,
        retryWhenOnline: false,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Get current network status
  public async getNetworkStatus(): Promise<{
    isConnected: boolean;
    isInternetReachable: boolean;
    type: string;
  }> {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected || false,
      isInternetReachable: state.isInternetReachable || false,
      type: state.type,
    };
  }

  // Cancel all pending requests
  public cancelAllRequests(): void {
    this.requestQueue.forEach((request) => {
      request.reject(new Error('Request cancelled'));
    });
    this.requestQueue = [];
  }

  // Get queue status
  public getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    oldestRequestAge: number;
  } {
    const oldestRequest = this.requestQueue[0];
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      oldestRequestAge: oldestRequest ? Date.now() - oldestRequest.timestamp : 0,
    };
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();
export default ApiClient;
