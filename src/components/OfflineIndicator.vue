<template>
  <div class="offline-indicator-container">
    <!-- Network Status Bar -->
    <div v-if="!networkStatus.connected" class="offline-banner">
      <ion-icon :icon="cloudOfflineOutline" class="offline-icon"></ion-icon>
      <span class="offline-text">You're working offline</span>
      <span v-if="pendingActions > 0" class="pending-count">
        {{ pendingActions }} changes pending
      </span>
    </div>

    <!-- Sync Status -->
    <div v-if="syncStatus.isSyncing" class="sync-banner">
      <ion-spinner name="crescent" class="sync-spinner"></ion-spinner>
      <span class="sync-text">Syncing tasks...</span>
    </div>

    <!-- Sync Errors -->
    <div v-if="syncStatus.syncErrors.length > 0" class="error-banner">
      <ion-icon :icon="warningOutline" class="error-icon"></ion-icon>
      <span class="error-text">Sync failed - {{ syncStatus.syncErrors.length }} errors</span>
      <ion-button 
        fill="clear" 
        size="small" 
        color="light" 
        @click="retrySyncAction"
        class="retry-button"
      >
        <ion-icon :icon="refreshOutline" slot="icon-only"></ion-icon>
      </ion-button>
    </div>

    <!-- Connection Quality Info -->
    <div v-if="networkStatus.connected && connectionQuality !== 'excellent'" class="quality-banner">
      <ion-icon :icon="getQualityIcon()" class="quality-icon"></ion-icon>
      <span class="quality-text">{{ getQualityText() }}</span>
    </div>

    <!-- Last Sync Info (auto-hide after 3 seconds) -->
    <div 
      v-if="showLastSyncInfo && syncStatus.lastSync && !syncStatus.isSyncing" 
      class="sync-info"
    >
      <ion-icon :icon="checkmarkCircleOutline" class="sync-icon"></ion-icon>
      <span class="sync-text">Synced {{ formatLastSync(syncStatus.lastSync) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { 
  IonIcon, 
  IonSpinner, 
  IonButton 
} from '@ionic/vue';
import { 
  cloudOfflineOutline, 
  checkmarkCircleOutline, 
  warningOutline,
  refreshOutline,
  wifiOutline,
  cellularOutline,
  speedometerOutline
} from 'ionicons/icons';
import { useOfflineServices } from '@/services/offlineServices';

const { networkService, syncService } = useOfflineServices();

// Reactive refs
const networkStatus = ref(networkService.getNetworkStatus());
const syncStatus = ref(syncService.getSyncStatus());
const showLastSyncInfo = ref(false);

// Computed properties
const pendingActions = computed(() => syncStatus.value.pendingActions);
const connectionQuality = computed(() => networkService.getConnectionQuality());

// Update intervals
let statusUpdateInterval: any;
let lastSyncInfoTimeout: any;

onMounted(() => {
  // Update status every 2 seconds
  statusUpdateInterval = setInterval(() => {
    networkStatus.value = networkService.getNetworkStatus();
    syncStatus.value = syncService.getSyncStatus();
  }, 2000);

  // Watch for sync completion to show last sync info
  watch(() => syncStatus.value.lastSync, (newLastSync, oldLastSync) => {
    if (newLastSync && newLastSync !== oldLastSync) {
      showLastSyncInfo.value = true;
      
      // Hide last sync info after 3 seconds
      if (lastSyncInfoTimeout) {
        clearTimeout(lastSyncInfoTimeout);
      }
      lastSyncInfoTimeout = setTimeout(() => {
        showLastSyncInfo.value = false;
      }, 3000);
    }
  });
});

onUnmounted(() => {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
  }
  if (lastSyncInfoTimeout) {
    clearTimeout(lastSyncInfoTimeout);
  }
});

// Actions
const retrySyncAction = async () => {
  try {
    await syncService.forceSync();
  } catch (error) {
    console.error('Failed to retry sync:', error);
  }
};

// Utility functions
const formatLastSync = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else {
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  }
};

const getQualityIcon = () => {
  switch (connectionQuality.value) {
    case 'good': return cellularOutline;
    case 'poor': return speedometerOutline;
    default: return wifiOutline;
  }
};

const getQualityText = () => {
  const status = networkStatus.value;
  switch (connectionQuality.value) {
    case 'good': 
      return `Connected via ${status.connectionType.toUpperCase()}`;
    case 'poor': 
      return `Slow ${status.connectionType.toUpperCase()} connection`;
    default: 
      return 'Good connection';
  }
};
</script>

<style scoped>
.offline-indicator-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none;
}

.offline-banner,
.sync-banner,
.error-banner,
.quality-banner,
.sync-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sd-space-2);
  padding: var(--sd-space-2) var(--sd-space-4);
  font-size: 0.875rem;
  font-weight: 500;
  pointer-events: auto;
  animation: slideDown 0.3s ease-out;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.offline-banner {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: white;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.sync-banner {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.error-banner {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: white;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.quality-banner {
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  color: white;
  padding: var(--sd-space-1) var(--sd-space-3);
  font-size: 0.8rem;
  box-shadow: 0 2px 8px rgba(8, 145, 178, 0.3);
}

.sync-info {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  padding: var(--sd-space-1) var(--sd-space-3);
  font-size: 0.8rem;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
  animation: slideDown 0.3s ease-out, fadeOut 0.3s ease-out 2.7s forwards;
}

.offline-icon,
.error-icon,
.sync-icon,
.quality-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.sync-spinner {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.pending-count {
  background-color: rgba(255, 255, 255, 0.25);
  padding: var(--sd-space-1) var(--sd-space-2);
  border-radius: 12px;
  font-size: 0.75rem;
  margin-left: auto;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.retry-button {
  --padding-start: var(--sd-space-2);
  --padding-end: var(--sd-space-2);
  --padding-top: var(--sd-space-1);
  --padding-bottom: var(--sd-space-1);
  height: auto;
  margin-left: var(--sd-space-2);
  font-size: 1rem;
  --color: rgba(255, 255, 255, 0.9);
  --color-hover: white;
}

.retry-button:hover {
  --color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .offline-banner,
  .sync-banner,
  .error-banner,
  .quality-banner {
    padding: var(--sd-space-1) var(--sd-space-3);
    font-size: 0.8rem;
    gap: var(--sd-space-1);
  }

  .pending-count {
    font-size: 0.7rem;
    padding: 2px var(--sd-space-1);
  }

  .retry-button {
    font-size: 0.9rem;
    margin-left: var(--sd-space-1);
  }

  .offline-icon,
  .error-icon,
  .sync-icon,
  .quality-icon {
    font-size: 1.1rem;
  }

  .sync-spinner {
    width: 1.1rem;
    height: 1.1rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .offline-banner {
    background: linear-gradient(135deg, #991b1b, #dc2626);
  }
  
  .sync-banner {
    background: linear-gradient(135deg, #d97706, #f59e0b);
  }
  
  .error-banner {
    background: linear-gradient(135deg, #991b1b, #dc2626);
  }
  
  .quality-banner {
    background: linear-gradient(135deg, #075985, #0891b2);
  }
  
  .sync-info {
    background: linear-gradient(135deg, #047857, #059669);
  }
}

/* Accessibility improvements */
.offline-indicator-container [role="alert"] {
  /* Screen reader announcements */
}

@media (prefers-reduced-motion: reduce) {
  .offline-banner,
  .sync-banner,
  .error-banner,
  .quality-banner,
  .sync-info {
    animation: none;
  }
}
</style>