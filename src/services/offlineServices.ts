import { DatabaseService } from './database';
import { SyncService } from './sync';
import { OfflineTaskService } from './offlineTaskService';
import { networkService } from './network';

// Global service instances
let dbService: DatabaseService;
let syncService: SyncService;
let taskService: OfflineTaskService;

let isInitialized = false;

// Initialize all offline services
export async function initializeOfflineServices(): Promise<void> {
  if (isInitialized) return;

  try {
    console.log('🚀 Initializing offline services...');

    // Initialize database service
    dbService = new DatabaseService();
    await dbService.initialize();

    // Initialize network service
    await networkService.initialize();

    // Initialize sync service
    syncService = new SyncService(dbService);

    // Initialize task service (but don't auto-sync during initialization)
    taskService = new OfflineTaskService(dbService, syncService);
    
    // Wait for all services to be properly set up
    await taskService.initialize();

    isInitialized = true;
    console.log('✅ All offline services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize offline services:', error);
    throw error;
  }
}

// Service getters
export function getDatabaseService(): DatabaseService {
  if (!dbService) {
    throw new Error('DatabaseService not initialized. Call initializeOfflineServices() first.');
  }
  return dbService;
}

export function getSyncService(): SyncService {
  if (!syncService) {
    throw new Error('SyncService not initialized. Call initializeOfflineServices() first.');
  }
  return syncService;
}

export function getTaskService(): OfflineTaskService {
  if (!taskService) {
    throw new Error('OfflineTaskService not initialized. Call initializeOfflineServices() first.');
  }
  return taskService;
}

export function getNetworkService() {
  return networkService;
}

// Check if services are initialized
export function areServicesInitialized(): boolean {
  return isInitialized;
}

// Cleanup function for app shutdown
export async function cleanupOfflineServices(): Promise<void> {
  try {
    if (syncService) {
      syncService.stopAutoSync();
    }
    
    if (dbService) {
      await dbService.close();
    }
    
    isInitialized = false;
    console.log('🧹 Offline services cleaned up successfully');
  } catch (error) {
    console.error('❌ Failed to cleanup offline services:', error);
  }
}

// Composable for Vue components
export function useOfflineServices() {
  if (!isInitialized) {
    throw new Error('Offline services not initialized. Call initializeOfflineServices() first.');
  }

  return {
    dbService: getDatabaseService(),
    syncService: getSyncService(),
    taskService: getTaskService(),
    networkService: getNetworkService()
  };
}

// Health check for all services
export async function checkServicesHealth(): Promise<{
  database: boolean;
  network: boolean;
  sync: boolean;
  task: boolean;
}> {
  const health = {
    database: false,
    network: false,
    sync: false,
    task: false
  };

  try {
    // Check database
    if (dbService) {
      await dbService.getAllTasks();
      health.database = true;
    }

    // Check network
    health.network = networkService.isOnline();

    // Check sync service
    if (syncService) {
      syncService.getSyncStatus();
      health.sync = true;
    }

    // Check task service
    if (taskService) {
      taskService.getTasksRef();
      health.task = true;
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }

  return health;
}

// Reset all offline data (useful for debugging or data corruption)
export async function resetOfflineData(): Promise<void> {
  if (!isInitialized) {
    throw new Error('Services not initialized');
  }

  try {
    await syncService.resetDatabase();
    console.log('🔄 Offline data reset completed');
  } catch (error) {
    console.error('❌ Failed to reset offline data:', error);
    throw error;
  }
}

// Export service instances for direct access (use with caution)
export const offlineServices = {
  get database() { return getDatabaseService(); },
  get sync() { return getSyncService(); },
  get task() { return getTaskService(); },
  get network() { return getNetworkService(); }
};