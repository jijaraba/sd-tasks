import { ref, computed } from 'vue';
import { DatabaseService, Task, SyncAction } from './database';
import { networkService } from './network';
import { env, envUtils } from '../config/env';

export interface SyncStatus {
  isSyncing: boolean;
  lastSync: Date | null;
  pendingActions: number;
  syncErrors: string[];
  lastError?: string;
}

export interface SyncResult {
  success: boolean;
  syncedActions: number;
  downloadedTasks: number;
  errors: string[];
}

export class SyncService {
  private syncStatus = ref<SyncStatus>({
    isSyncing: false,
    lastSync: null,
    pendingActions: 0,
    syncErrors: []
  });

  private dbService: DatabaseService;
  private syncInterval: any;
  private autoSyncEnabled = true;
  private lastSyncTimestamp = 0;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.initializeSync();
  }

  private async initializeSync(): Promise<void> {
    try {
      // Load last sync timestamp from localStorage
      const lastSync = localStorage.getItem('lastSyncTimestamp');
      if (lastSync) {
        this.lastSyncTimestamp = parseInt(lastSync);
        this.syncStatus.value.lastSync = new Date(this.lastSyncTimestamp);
      }

      // Update pending actions count
      await this.updateSyncStatus();

      // Listen for network changes
      networkService.addNetworkListener(async (status) => {
        if (status.connected && this.autoSyncEnabled) {
          envUtils.log('info', '🔄 Network connected - attempting sync');
          await this.attemptSync();
        } else if (!status.connected) {
          envUtils.log('info', '📴 Network disconnected - stopping auto sync');
          this.stopAutoSync();
        }
      });

      // Start auto sync if online
      if (networkService.isOnline() && this.autoSyncEnabled) {
        this.startAutoSync();
      }

      console.log('✅ Sync service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize sync service:', error);
    }
  }

  private async updateSyncStatus(): Promise<void> {
    try {
      const pendingActions = await this.dbService.getPendingSyncActions();
      
      this.syncStatus.value = {
        ...this.syncStatus.value,
        pendingActions: pendingActions.length
      };
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }

  public async attemptSync(): Promise<SyncResult> {
    if (this.syncStatus.value.isSyncing) {
      envUtils.log('info', 'ℹ️ Sync already in progress');
      return { success: false, syncedActions: 0, downloadedTasks: 0, errors: ['Sync already in progress'] };
    }

    if (!await networkService.isConnectionGoodForSync()) {
      envUtils.log('warn', '⚠️ Connection not suitable for sync');
      return { success: false, syncedActions: 0, downloadedTasks: 0, errors: ['No suitable connection'] };
    }

    // Set syncing status
    this.syncStatus.value = {
      ...this.syncStatus.value,
      isSyncing: true,
      syncErrors: []
    };

    try {
      envUtils.log('info', '🔄 Starting sync process...');

      // Step 1: Download tasks from server
      const downloadResult = await this.downloadServerTasks();

      // Step 2: Upload local changes
      const uploadResult = await this.uploadLocalChanges();

      // Step 3: Clean up completed sync actions
      await this.dbService.clearCompletedSyncActions();

      // Update sync timestamp
      this.lastSyncTimestamp = Date.now();
      localStorage.setItem('lastSyncTimestamp', this.lastSyncTimestamp.toString());
      this.syncStatus.value.lastSync = new Date(this.lastSyncTimestamp);

      // Update pending actions count
      await this.updateSyncStatus();

      const result: SyncResult = {
        success: uploadResult.errors.length === 0,
        syncedActions: uploadResult.syncedActions,
        downloadedTasks: downloadResult.downloadedTasks,
        errors: uploadResult.errors
      };

      if (result.success) {
        envUtils.log('info', `✅ Sync completed successfully: ${result.syncedActions} actions synced, ${result.downloadedTasks} tasks downloaded`);
      } else {
        envUtils.log('warn', `⚠️ Sync completed with errors: ${result.errors.length} errors`);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      envUtils.log('error', '❌ Sync failed:', errorMessage);
      
      this.syncStatus.value = {
        ...this.syncStatus.value,
        syncErrors: [errorMessage],
        lastError: errorMessage
      };

      return { success: false, syncedActions: 0, downloadedTasks: 0, errors: [errorMessage] };
    } finally {
      this.syncStatus.value = {
        ...this.syncStatus.value,
        isSyncing: false
      };
    }
  }

  private async downloadServerTasks(): Promise<{ downloadedTasks: number }> {
    try {
      const token = localStorage.getItem(env.AUTH_TOKEN_KEY);
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${env.API_BASE_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const serverTasks: Task[] = data.tasks || [];

      // Sync tasks to local database
      await this.dbService.syncTasksFromServer(serverTasks);
      
      envUtils.log('info', `⬇️ Downloaded ${serverTasks.length} tasks from server`);
      return { downloadedTasks: serverTasks.length };
    } catch (error) {
      envUtils.log('error', '❌ Failed to download server tasks:', error);
      throw error;
    }
  }

  private async uploadLocalChanges(): Promise<{ syncedActions: number; errors: string[] }> {
    const pendingActions = await this.dbService.getPendingSyncActions();
    let syncedActions = 0;
    const errors: string[] = [];

    envUtils.log('info', `⬆️ Uploading ${pendingActions.length} pending actions`);

    for (const action of pendingActions) {
      try {
        await this.syncAction(action);
        await this.dbService.markSyncActionAsCompleted(action.id!);
        syncedActions++;
        envUtils.log('info', `✅ Synced ${action.action} action for task: ${action.taskLocalId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = `Failed to sync ${action.action} for task ${action.taskLocalId}: ${errorMessage}`;
        errors.push(errorDetails);
        envUtils.log('error', `❌ ${errorDetails}`);
      }
    }

    return { syncedActions, errors };
  }

  private async syncAction(action: SyncAction): Promise<void> {
    const token = localStorage.getItem(env.AUTH_TOKEN_KEY);
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const taskData = JSON.parse(action.taskData) as Task;

    switch (action.action) {
      case 'create':
        await this.syncCreateAction(action, taskData, headers);
        break;
      case 'update':
        await this.syncUpdateAction(action, taskData, headers);
        break;
      case 'delete':
        await this.syncDeleteAction(action, taskData, headers);
        break;
    }
  }

  private async syncCreateAction(action: SyncAction, taskData: Task, headers: any): Promise<void> {
    const createData = {
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      dueDate: taskData.dueDate
    };

    const response = await fetch(`${env.API_BASE_URL}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create task: ${response.status}`);
    }

    const result = await response.json();
    const serverTask = result.task;

    // Update local task with server ID
    await this.dbService.updateTaskWithServerId(action.taskLocalId, serverTask.id);

    envUtils.log('info', `✅ Created task on server: ${serverTask.title} (ID: ${serverTask.id})`);
  }

  private async syncUpdateAction(action: SyncAction, taskData: Task, headers: any): Promise<void> {
    if (!taskData.id) {
      throw new Error('Cannot update task without server ID');
    }

    const updateData = {
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      dueDate: taskData.dueDate
    };

    const response = await fetch(`${env.API_BASE_URL}/tasks/${taskData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update task: ${response.status}`);
    }

    const result = await response.json();
    const serverTask = result.task;

    // Update local task to mark as synced
    await this.dbService.updateTaskWithServerId(action.taskLocalId, serverTask.id);

    envUtils.log('info', `✅ Updated task on server: ${serverTask.title} (ID: ${serverTask.id})`);
  }

  private async syncDeleteAction(action: SyncAction, taskData: Task, headers: any): Promise<void> {
    if (!taskData.id) {
      throw new Error('Cannot delete task without server ID');
    }

    const response = await fetch(`${env.API_BASE_URL}/tasks/${taskData.id}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete task: ${response.status}`);
    }

    // Remove from local database
    await this.dbService.deleteTask(action.taskLocalId);

    envUtils.log('info', `✅ Deleted task from server: ${taskData.title} (ID: ${taskData.id})`);
  }

  public startAutoSync(intervalMs: number = 30000): void {
    this.stopAutoSync();
    
    this.syncInterval = setInterval(async () => {
      if (networkService.isOnline() && !this.syncStatus.value.isSyncing && this.autoSyncEnabled) {
        const pendingActions = await this.dbService.getPendingSyncActions();
        if (pendingActions.length > 0) {
          envUtils.log('info', `🔄 Auto-sync triggered: ${pendingActions.length} pending actions`);
          await this.attemptSync();
        }
      }
    }, intervalMs);

    envUtils.log('info', `🔄 Auto-sync started with ${intervalMs}ms interval`);
  }

  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      envUtils.log('info', '⏹️ Auto-sync stopped');
    }
  }

  public async forceSync(): Promise<SyncResult> {
    envUtils.log('info', '🔄 Force sync requested');
    return await this.attemptSync();
  }

  public enableAutoSync(): void {
    this.autoSyncEnabled = true;
    if (networkService.isOnline()) {
      this.startAutoSync();
    }
  }

  public disableAutoSync(): void {
    this.autoSyncEnabled = false;
    this.stopAutoSync();
  }

  public getSyncStatus(): SyncStatus {
    return this.syncStatus.value;
  }

  public getSyncStatusRef() {
    return this.syncStatus;
  }

  // Computed properties for reactive components
  public get isSyncing() {
    return computed(() => this.syncStatus.value.isSyncing);
  }

  public get pendingActionsCount() {
    return computed(() => this.syncStatus.value.pendingActions);
  }

  public get lastSyncDate() {
    return computed(() => this.syncStatus.value.lastSync);
  }

  public get hasErrors() {
    return computed(() => this.syncStatus.value.syncErrors.length > 0);
  }

  public async clearSyncData(): Promise<void> {
    await this.dbService.clearCompletedSyncActions();
    this.lastSyncTimestamp = 0;
    localStorage.removeItem('lastSyncTimestamp');
    
    this.syncStatus.value = {
      ...this.syncStatus.value,
      lastSync: null,
      syncErrors: [],
      lastError: undefined
    };
    
    await this.updateSyncStatus();
    envUtils.log('info', '🗑️ Sync data cleared');
  }

  public async resetDatabase(): Promise<void> {
    await this.dbService.clearAllData();
    await this.clearSyncData();
    envUtils.log('info', '🗑️ Database reset completed');
  }
}