import { Network } from '@capacitor/network';
import { ref, computed } from 'vue';

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

class NetworkService {
  private networkStatus = ref<NetworkStatus>({
    connected: true,
    connectionType: 'wifi'
  });

  private networkListeners: Array<(status: NetworkStatus) => void> = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get initial network status
      const status = await Network.getStatus();
      this.updateNetworkStatus({
        connected: status.connected,
        connectionType: status.connectionType
      });

      // Listen for network changes
      Network.addListener('networkStatusChange', (status) => {
        this.updateNetworkStatus({
          connected: status.connected,
          connectionType: status.connectionType
        });
      });

      this.initialized = true;
      console.log('✅ Network service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize network service:', error);
      // Continue with default connected state
    }
  }

  private updateNetworkStatus(status: NetworkStatus): void {
    console.log('📡 Network status changed:', status);
    this.networkStatus.value = status;

    // Notify listeners
    this.networkListeners.forEach(listener => listener(status));
  }

  public isOnline(): boolean {
    return this.networkStatus.value.connected;
  }

  public isOffline(): boolean {
    return !this.networkStatus.value.connected;
  }

  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus.value;
  }

  public getNetworkStatusRef() {
    return this.networkStatus;
  }

  // Computed property for reactive components
  public get isConnected() {
    return computed(() => this.networkStatus.value.connected);
  }

  // Add listener for network changes
  public addNetworkListener(listener: (status: NetworkStatus) => void): void {
    this.networkListeners.push(listener);
  }

  // Remove listener
  public removeNetworkListener(listener: (status: NetworkStatus) => void): void {
    const index = this.networkListeners.indexOf(listener);
    if (index > -1) {
      this.networkListeners.splice(index, 1);
    }
  }

  // Test network connectivity with actual HTTP request
  public async testConnectivity(url: string = 'https://www.google.com'): Promise<boolean> {
    if (!this.networkStatus.value.connected) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.log('🔍 Connectivity test failed:', error);
      return false;
    }
  }

  // Wait for network to be online
  public async waitForConnection(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        this.removeNetworkListener(connectionListener);
        resolve(false);
      }, timeout);

      const connectionListener = (status: NetworkStatus) => {
        if (status.connected) {
          clearTimeout(timeoutId);
          this.removeNetworkListener(connectionListener);
          resolve(true);
        }
      };

      this.addNetworkListener(connectionListener);
    });
  }

  // Check if connection is good for sync (not just connected but stable)
  public async isConnectionGoodForSync(): Promise<boolean> {
    if (!this.isOnline()) {
      return false;
    }

    // Test actual connectivity
    const connectivityTest = await this.testConnectivity();
    if (!connectivityTest) {
      return false;
    }

    // Check connection type
    const status = this.getNetworkStatus();
    
    // Log connection type for user awareness
    if (status.connectionType === 'cellular') {
      console.log('📱 On cellular connection - sync will proceed');
    } else if (status.connectionType === 'wifi') {
      console.log('📶 On WiFi connection - optimal for sync');
    }

    return true;
  }

  // Get connection quality indicator
  public getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!this.networkStatus.value.connected) {
      return 'offline';
    }

    const type = this.networkStatus.value.connectionType;
    
    switch (type) {
      case 'wifi':
        return 'excellent';
      case '4g':
      case '5g':
        return 'good';
      case '3g':
      case '2g':
        return 'poor';
      default:
        return 'good';
    }
  }

  // Get user-friendly connection description
  public getConnectionDescription(): string {
    if (!this.networkStatus.value.connected) {
      return 'No internet connection';
    }

    const type = this.networkStatus.value.connectionType;
    const quality = this.getConnectionQuality();

    switch (quality) {
      case 'excellent':
        return `Connected via ${type.toUpperCase()} - Excellent connection`;
      case 'good':
        return `Connected via ${type.toUpperCase()} - Good connection`;
      case 'poor':
        return `Connected via ${type.toUpperCase()} - Limited connection`;
      default:
        return `Connected via ${type.toUpperCase()}`;
    }
  }
}

// Create singleton instance
export const networkService = new NetworkService();
export default networkService;