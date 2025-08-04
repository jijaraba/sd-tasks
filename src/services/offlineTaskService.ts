import { ref, computed } from 'vue';
import { DatabaseService, Task } from './database';
import { networkService } from './network';
import { SyncService } from './sync';
import { apiService } from './api';
import { envUtils } from '../config/env';

export interface TaskFilters {
  status?: string;
  priority?: string;
  search?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  byStatus: Array<{ status: string; count: number }>;
  offline: number;
}

export class OfflineTaskService {
  private tasks = ref<Task[]>([]);
  private loading = ref<boolean>(false);
  private error = ref<string | null>(null);
  
  private dbService: DatabaseService;
  private syncService: SyncService;

  constructor(dbService: DatabaseService, syncService: SyncService) {
    this.dbService = dbService;
    this.syncService = syncService;
  }

  async initialize(): Promise<void> {
    try {
      // Load tasks from local database first
      await this.loadTasksFromDatabase();

      // If online, try to sync
      if (networkService.isOnline()) {
        await this.syncService.attemptSync();
        await this.loadTasksFromDatabase(); // Reload after sync
      }

      console.log('✅ Offline task service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize offline task service:', error);
    }
  }

  private async loadTasksFromDatabase(): Promise<void> {
    try {
      const tasks = await this.dbService.getAllTasks();
      this.tasks.value = tasks;
      this.error.value = null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
      envUtils.log('error', 'Failed to load tasks from database:', errorMessage);
      this.error.value = errorMessage;
    }
  }

  public async getTasks(filters?: TaskFilters): Promise<Task[]> {
    this.loading.value = true;
    this.error.value = null;

    try {
      // Always load from local database first
      await this.loadTasksFromDatabase();
      let tasks = this.tasks.value;

      // Apply filters if provided
      if (filters) {
        tasks = this.applyFilters(tasks, filters);
      }

      // If online, try to get fresh data from server and sync
      if (networkService.isOnline()) {
        try {
          // Attempt background sync
          await this.syncService.attemptSync();
          
          // Reload from database after sync
          await this.loadTasksFromDatabase();
          tasks = this.applyFilters(this.tasks.value, filters || {});
        } catch (error) {
          envUtils.log('warn', 'Failed to sync with server, using local data:', error);
        }
      }

      this.loading.value = false;
      return tasks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get tasks';
      envUtils.log('error', 'Failed to get tasks:', errorMessage);
      this.error.value = errorMessage;
      this.loading.value = false;
      return [];
    }
  }

  public async createTask(taskData: {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
  }): Promise<Task | null> {
    this.loading.value = true;
    this.error.value = null;

    try {
      // Get current user ID
      const userId = this.getCurrentUserId();
      
      const newTask: Omit<Task, 'id' | 'localId'> = {
        title: taskData.title,
        description: taskData.description,
        status: (taskData.status as any) || 'pending',
        priority: (taskData.priority as any) || 'medium',
        dueDate: taskData.dueDate,
        userId: userId
      };

      // Always save locally first (with offline flag)
      const savedTask = await this.dbService.createTask(newTask);

      // Reload tasks from database
      await this.loadTasksFromDatabase();
      this.loading.value = false;
      
      const isOffline = networkService.isOffline();
      envUtils.log('info', `📝 Task created: ${savedTask.title} (${isOffline ? 'offline' : 'will sync'})`);
      
      // If online, trigger sync in background
      if (networkService.isOnline()) {
        this.syncService.attemptSync().catch(error => {
          envUtils.log('warn', 'Background sync failed after task creation:', error);
        });
      }

      return savedTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      envUtils.log('error', 'Failed to create task:', errorMessage);
      this.error.value = errorMessage;
      this.loading.value = false;
      return null;
    }
  }

  public async updateTask(localId: string, updates: Partial<Task>): Promise<Task | null> {
    this.loading.value = true;
    this.error.value = null;

    try {
      // Update locally first
      const updatedTask = await this.dbService.updateTask(localId, updates);
      
      if (!updatedTask) {
        throw new Error('Task not found');
      }

      // Reload tasks from database
      await this.loadTasksFromDatabase();
      this.loading.value = false;
      
      envUtils.log('info', `📝 Task updated: ${updatedTask.title}`);
      
      // If online, trigger sync in background
      if (networkService.isOnline()) {
        this.syncService.attemptSync().catch(error => {
          envUtils.log('warn', 'Background sync failed after task update:', error);
        });
      }

      return updatedTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      envUtils.log('error', 'Failed to update task:', errorMessage);
      this.error.value = errorMessage;
      this.loading.value = false;
      return null;
    }
  }

  public async deleteTask(localId: string): Promise<boolean> {
    this.loading.value = true;
    this.error.value = null;

    try {
      const success = await this.dbService.deleteTask(localId);
      
      if (!success) {
        throw new Error('Task not found');
      }

      // Reload tasks from database
      await this.loadTasksFromDatabase();
      this.loading.value = false;
      
      envUtils.log('info', `🗑️ Task deleted: ${localId}`);
      
      // If online, trigger sync in background
      if (networkService.isOnline()) {
        this.syncService.attemptSync().catch(error => {
          envUtils.log('warn', 'Background sync failed after task deletion:', error);
        });
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      envUtils.log('error', 'Failed to delete task:', errorMessage);
      this.error.value = errorMessage;
      this.loading.value = false;
      return false;
    }
  }

  public async getTaskById(localId: string): Promise<Task | null> {
    try {
      return await this.dbService.getTaskById(localId);
    } catch (error) {
      envUtils.log('error', 'Failed to get task by ID:', error);
      return null;
    }
  }

  public async getTaskStats(): Promise<TaskStats> {
    const tasks = this.tasks.value;
    
    const stats: TaskStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status !== 'completed').length,
      offline: tasks.filter(t => t.needsSync || t.isOffline).length,
      byStatus: []
    };

    // Calculate by status
    const statusCounts: { [key: string]: number } = {};
    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    stats.byStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    return stats;
  }

  public async refreshTasks(): Promise<void> {
    if (networkService.isOnline()) {
      await this.syncService.attemptSync();
    }
    await this.loadTasksFromDatabase();
  }

  public async forceSyncTasks(): Promise<void> {
    if (!networkService.isOnline()) {
      throw new Error('Cannot sync while offline');
    }
    
    this.loading.value = true;
    try {
      await this.syncService.forceSync();
      await this.loadTasksFromDatabase();
    } finally {
      this.loading.value = false;
    }
  }

  public async getOfflineTasksCount(): Promise<number> {
    return await this.dbService.getOfflineTasksCount();
  }

  public isOffline(): boolean {
    return networkService.isOffline();
  }

  public getNetworkStatus() {
    return networkService.getNetworkStatus();
  }

  // Reactive getters for Vue components
  public getTasksRef() {
    return this.tasks;
  }

  public getLoadingRef() {
    return this.loading;
  }

  public getErrorRef() {
    return this.error;
  }

  // Computed properties
  public get tasksComputed() {
    return computed(() => this.tasks.value);
  }

  public get isLoadingComputed() {
    return computed(() => this.loading.value);
  }

  public get errorComputed() {
    return computed(() => this.error.value);
  }

  public get offlineTasksComputed() {
    return computed(() => this.tasks.value.filter(task => task.needsSync || task.isOffline));
  }

  public get pendingTasksComputed() {
    return computed(() => this.tasks.value.filter(task => task.status !== 'completed'));
  }

  public get completedTasksComputed() {
    return computed(() => this.tasks.value.filter(task => task.status === 'completed'));
  }

  // Utility methods
  private applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
    return tasks.filter(task => {
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }

  private getCurrentUserId(): number {
    // Get the current user ID from your auth service
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || 1;
      } catch {
        return 1;
      }
    }
    return 1;
  }

  // Database management
  public async clearAllData(): Promise<void> {
    await this.dbService.clearAllData();
    await this.loadTasksFromDatabase();
    envUtils.log('info', '🗑️ All offline data cleared');
  }

  public async exportTasks(): Promise<Task[]> {
    return this.tasks.value;
  }

  public async importTasks(tasks: Task[]): Promise<void> {
    // This could be used for data migration or backup restoration
    // Implementation would depend on specific requirements
    envUtils.log('info', `📥 Importing ${tasks.length} tasks`);
  }

  // Event handlers for network changes
  public onNetworkChange(callback: (isOnline: boolean) => void): void {
    networkService.addNetworkListener((status) => {
      callback(status.connected);
    });
  }
}