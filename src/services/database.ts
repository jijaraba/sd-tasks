import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as jeepSqliteDefineCustomElements } from 'jeep-sqlite/loader';

export interface Task {
  id?: number;
  localId?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  completedAt?: string;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
  needsSync?: boolean;
  action?: 'create' | 'update' | 'delete';
  isOffline?: boolean;
}

export interface SyncAction {
  id?: number;
  taskLocalId: string;
  action: 'create' | 'update' | 'delete';
  taskData: string; // JSON string
  timestamp: string;
  synced: boolean;
}

export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'sd_tasks_offline.db';
  private isInitialized = false;
  private useWebFallback = false;
  private webDB: IDBDatabase | null = null;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const platform = Capacitor.getPlatform();
      console.log('Initializing database for platform:', platform);

      if (platform === 'web') {
        // For web platform, try SQLite first, fallback to IndexedDB
        try {
          await this.initializeWebSQLite();
          // Test SQLite availability
          this.db = await this.sqlite.createConnection(
            this.dbName,
            false,
            'no-encryption',
            1,
            false
          );
          await this.db.open();
          await this.createTables();
          console.log('✅ Web SQLite initialized successfully');
        } catch (sqliteError) {
          console.warn('SQLite not available on web, using IndexedDB fallback:', sqliteError);
          this.useWebFallback = true;
          await this.initializeIndexedDB();
        }
      } else {
        // Native platforms
        this.db = await this.sqlite.createConnection(
          this.dbName,
          false,
          'no-encryption',
          1,
          false
        );
        await this.db.open();
        await this.createTables();
        console.log('✅ Native SQLite initialized successfully');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  private async initializeWebSQLite(): Promise<void> {
    // Define jeep-sqlite custom elements
    await jeepSqliteDefineCustomElements(window);
    
    // Initialize the web store
    await CapacitorSQLite.initWebStore();
    console.log('Web SQLite store initialized');
  }

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = () => {
        this.webDB = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create tasks table
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'localId' });
          taskStore.createIndex('serverId', 'serverId', { unique: false });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('userId', 'userId', { unique: false });
          taskStore.createIndex('needsSync', 'needsSync', { unique: false });
        }
        
        // Create sync_actions table
        if (!db.objectStoreNames.contains('sync_actions')) {
          const syncStore = db.createObjectStore('sync_actions', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('taskLocalId', 'taskLocalId', { unique: false });
          syncStore.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        localId TEXT UNIQUE,
        serverId INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'medium',
        dueDate TEXT,
        completedAt TEXT,
        userId INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        needsSync BOOLEAN DEFAULT 1,
        action TEXT,
        isOffline BOOLEAN DEFAULT 1
      );
    `;

    const createSyncActionsTable = `
      CREATE TABLE IF NOT EXISTS sync_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskLocalId TEXT NOT NULL,
        action TEXT NOT NULL,
        taskData TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT 0
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_tasks_localId ON tasks(localId);
      CREATE INDEX IF NOT EXISTS idx_tasks_serverId ON tasks(serverId);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_needsSync ON tasks(needsSync);
      CREATE INDEX IF NOT EXISTS idx_sync_actions_synced ON sync_actions(synced);
    `;

    await this.db.execute(createTasksTable);
    await this.db.execute(createSyncActionsTable);
    await this.db.execute(createIndexes);

    console.log('✅ Database tables created successfully');
  }

  // Task CRUD operations
  async getAllTasks(): Promise<Task[]> {
    if (this.useWebFallback) {
      return this.getAllTasksIndexedDB();
    }
    
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query('SELECT * FROM tasks ORDER BY createdAt DESC');
    return this.mapTasksFromDb(result.values || []);
  }

  private async getAllTasksIndexedDB(): Promise<Task[]> {
    if (!this.webDB) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.webDB!.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();

      request.onsuccess = () => {
        const tasks = request.result || [];
        // Sort by createdAt descending
        tasks.sort((a: Task, b: Task) => {
          const aTime = new Date(a.createdAt || '').getTime();
          const bTime = new Date(b.createdAt || '').getTime();
          return bTime - aTime;
        });
        resolve(tasks);
      };

      request.onerror = () => {
        reject(new Error('Failed to get tasks from IndexedDB'));
      };
    });
  }

  async getTaskById(localId: string): Promise<Task | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query('SELECT * FROM tasks WHERE localId = ?', [localId]);
    const tasks = this.mapTasksFromDb(result.values || []);
    return tasks.length > 0 ? tasks[0] : null;
  }

  async getTaskByServerId(serverId: number): Promise<Task | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query('SELECT * FROM tasks WHERE serverId = ?', [serverId]);
    const tasks = this.mapTasksFromDb(result.values || []);
    return tasks.length > 0 ? tasks[0] : null;
  }

  async createTask(task: Omit<Task, 'id' | 'localId'>): Promise<Task> {
    const localId = this.generateLocalId();
    const now = new Date().toISOString();

    const createdTask: Task = {
      ...task,
      localId,
      createdAt: now,
      updatedAt: now,
      needsSync: true,
      action: 'create',
      isOffline: true
    };

    if (this.useWebFallback) {
      await this.createTaskIndexedDB(createdTask);
    } else {
      if (!this.db) throw new Error('Database not initialized');

      const insertQuery = `
        INSERT INTO tasks (localId, title, description, status, priority, dueDate, userId, createdAt, updatedAt, needsSync, action, isOffline)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'create', 1)
      `;

      await this.db.run(insertQuery, [
        localId,
        task.title,
        task.description || null,
        task.status,
        task.priority,
        task.dueDate || null,
        task.userId,
        now,
        now
      ]);
    }

    // Add to sync queue
    await this.addSyncAction(localId, 'create', createdTask);

    return createdTask;
  }

  private async createTaskIndexedDB(task: Task): Promise<void> {
    if (!this.webDB) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.webDB!.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.add(task);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to create task in IndexedDB'));
    });
  }

  async updateTask(localId: string, updates: Partial<Task>): Promise<Task | null> {
    if (!this.db) throw new Error('Database not initialized');

    const existingTask = await this.getTaskById(localId);
    if (!existingTask) return null;

    const now = new Date().toISOString();
    const updatedTask: Task = { ...existingTask, ...updates, updatedAt: now, needsSync: true, action: 'update' };

    const updateQuery = `
      UPDATE tasks 
      SET title = ?, description = ?, status = ?, priority = ?, dueDate = ?, completedAt = ?, 
          updatedAt = ?, needsSync = 1, action = 'update'
      WHERE localId = ?
    `;

    await this.db.run(updateQuery, [
      updatedTask.title,
      updatedTask.description || null,
      updatedTask.status,
      updatedTask.priority,
      updatedTask.dueDate || null,
      updatedTask.completedAt || null,
      now,
      localId
    ]);

    // Add to sync queue
    await this.addSyncAction(localId, 'update', updatedTask);

    return updatedTask;
  }

  async deleteTask(localId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const task = await this.getTaskById(localId);
    if (!task) return false;

    // If task was created offline and never synced, just remove it
    if (task.isOffline && !task.id) {
      await this.db.run('DELETE FROM tasks WHERE localId = ?', [localId]);
      return true;
    }

    // Mark for deletion sync
    const updateQuery = `
      UPDATE tasks 
      SET needsSync = 1, action = 'delete', updatedAt = ?
      WHERE localId = ?
    `;

    await this.db.run(updateQuery, [new Date().toISOString(), localId]);

    // Add to sync queue
    await this.addSyncAction(localId, 'delete', task);

    return true;
  }

  // Sync operations
  async getPendingSyncActions(): Promise<SyncAction[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query('SELECT * FROM sync_actions WHERE synced = 0 ORDER BY timestamp ASC');
    return (result.values || []).map(row => ({
      id: row.id,
      taskLocalId: row.taskLocalId,
      action: row.action,
      taskData: row.taskData,
      timestamp: row.timestamp,
      synced: Boolean(row.synced)
    }));
  }

  async addSyncAction(taskLocalId: string, action: 'create' | 'update' | 'delete', taskData: Task): Promise<void> {
    if (this.useWebFallback) {
      await this.addSyncActionIndexedDB(taskLocalId, action, taskData);
      return;
    }

    if (!this.db) throw new Error('Database not initialized');

    const insertQuery = `
      INSERT INTO sync_actions (taskLocalId, action, taskData, timestamp, synced)
      VALUES (?, ?, ?, ?, 0)
    `;

    await this.db.run(insertQuery, [
      taskLocalId,
      action,
      JSON.stringify(taskData),
      new Date().toISOString()
    ]);
  }

  private async addSyncActionIndexedDB(taskLocalId: string, action: 'create' | 'update' | 'delete', taskData: Task): Promise<void> {
    if (!this.webDB) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.webDB!.transaction(['sync_actions'], 'readwrite');
      const store = transaction.objectStore('sync_actions');
      
      const syncAction = {
        taskLocalId,
        action,
        taskData: JSON.stringify(taskData),
        timestamp: new Date().toISOString(),
        synced: false
      };

      const request = store.add(syncAction);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add sync action to IndexedDB'));
    });
  }

  async markSyncActionAsCompleted(actionId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run('UPDATE sync_actions SET synced = 1 WHERE id = ?', [actionId]);
  }

  async clearCompletedSyncActions(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run('DELETE FROM sync_actions WHERE synced = 1');
  }

  // Server sync operations
  async updateTaskWithServerId(localId: string, serverId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const updateQuery = `
      UPDATE tasks 
      SET serverId = ?, needsSync = 0, action = NULL, isOffline = 0, updatedAt = ?
      WHERE localId = ?
    `;

    await this.db.run(updateQuery, [serverId, new Date().toISOString(), localId]);
  }

  async syncTasksFromServer(serverTasks: Task[]): Promise<void> {
    if (!this.isInitialized) throw new Error('Database not initialized');
    
    if (this.useWebFallback) {
      await this.syncTasksFromServerIndexedDB(serverTasks);
      return;
    }
    
    if (!this.db) throw new Error('SQLite database not initialized');

    for (const serverTask of serverTasks) {
      // Check if task already exists locally
      const existingTask = await this.getTaskByServerId(serverTask.id!);
      
      if (existingTask) {
        // Update existing task if it doesn't need sync
        if (!existingTask.needsSync) {
          const updateQuery = `
            UPDATE tasks 
            SET title = ?, description = ?, status = ?, priority = ?, dueDate = ?, completedAt = ?, 
                updatedAt = ?, needsSync = 0, action = NULL, isOffline = 0
            WHERE serverId = ?
          `;

          await this.db.run(updateQuery, [
            serverTask.title,
            serverTask.description || null,
            serverTask.status,
            serverTask.priority,
            serverTask.dueDate || null,
            serverTask.completedAt || null,
            serverTask.updatedAt || new Date().toISOString(),
            serverTask.id
          ]);
        }
      } else {
        // Insert new task from server
        const localId = this.generateLocalId();
        const insertQuery = `
          INSERT INTO tasks (localId, serverId, title, description, status, priority, dueDate, completedAt, userId, createdAt, updatedAt, needsSync, action, isOffline)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, 0)
        `;

        await this.db.run(insertQuery, [
          localId,
          serverTask.id,
          serverTask.title,
          serverTask.description || null,
          serverTask.status,
          serverTask.priority,
          serverTask.dueDate || null,
          serverTask.completedAt || null,
          serverTask.userId,
          serverTask.createdAt || new Date().toISOString(),
          serverTask.updatedAt || new Date().toISOString()
        ]);
      }
    }
  }

  private async syncTasksFromServerIndexedDB(serverTasks: Task[]): Promise<void> {
    if (!this.webDB) throw new Error('IndexedDB not initialized');

    const transaction = this.webDB.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');

    for (const serverTask of serverTasks) {
      try {
        // Check if task already exists locally by serverId
        if (!serverTask.id) continue; // Skip tasks without server ID
        
        const index = store.index('serverId');
        const existingRequest = index.get(serverTask.id);
        
        await new Promise<void>((resolve, reject) => {
          existingRequest.onsuccess = async () => {
            const existingTask = existingRequest.result;
            
            if (existingTask) {
              // Update existing task if it doesn't need sync
              if (!existingTask.needsSync) {
                const updatedTask = {
                  ...existingTask,
                  title: serverTask.title,
                  description: serverTask.description,
                  status: serverTask.status,
                  priority: serverTask.priority,
                  dueDate: serverTask.dueDate,
                  completedAt: serverTask.completedAt,
                  updatedAt: serverTask.updatedAt || new Date().toISOString(),
                  needsSync: false,
                  action: undefined,
                  isOffline: false,
                  id: serverTask.id // Update server ID
                };
                
                const updateRequest = store.put(updatedTask);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(new Error('Failed to update task in IndexedDB'));
              } else {
                resolve(); // Skip if local changes need sync
              }
            } else {
              // Create new task from server
              const newTask: Task = {
                ...serverTask,
                localId: this.generateLocalId(),
                id: serverTask.id,
                needsSync: false,
                action: undefined,
                isOffline: false,
                createdAt: serverTask.createdAt || new Date().toISOString(),
                updatedAt: serverTask.updatedAt || new Date().toISOString()
              };
              
              const addRequest = store.add(newTask);
              addRequest.onsuccess = () => resolve();
              addRequest.onerror = () => reject(new Error('Failed to add task to IndexedDB'));
            }
          };
          
          existingRequest.onerror = () => reject(new Error('Failed to check existing task in IndexedDB'));
        });
      } catch (error) {
        console.error('Error syncing task from server:', error);
      }
    }
  }

  // Utility methods
  async getTasksNeedingSync(): Promise<Task[]> {
    if (!this.isInitialized) throw new Error('Database not initialized');

    if (this.useWebFallback) {
      return this.getTasksNeedingSyncIndexedDB();
    }

    if (!this.db) throw new Error('SQLite database not initialized');

    const result = await this.db.query('SELECT * FROM tasks WHERE needsSync = 1 ORDER BY createdAt ASC');
    return this.mapTasksFromDb(result.values || []);
  }

  private async getTasksNeedingSyncIndexedDB(): Promise<Task[]> {
    if (!this.webDB) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.webDB!.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();

      request.onsuccess = () => {
        const tasks = request.result || [];
        // Sort by createdAt ascending
        tasks.sort((a: Task, b: Task) => {
          const aTime = new Date(a.createdAt || '').getTime();
          const bTime = new Date(b.createdAt || '').getTime();
          return aTime - bTime;
        });
        resolve(tasks.filter(task => task.needsSync));
      };

      request.onerror = () => {
        reject(new Error('Failed to get tasks needing sync from IndexedDB'));
      };
    });
  }

  async getOfflineTasksCount(): Promise<number> {
    if (!this.isInitialized) throw new Error('Database not initialized');

    if (this.useWebFallback) {
      return this.getOfflineTasksCountIndexedDB();
    }

    if (!this.db) throw new Error('SQLite database not initialized');

    const result = await this.db.query('SELECT COUNT(*) as count FROM tasks WHERE needsSync = 1');
    return result.values?.[0]?.count || 0;
  }

  private async getOfflineTasksCountIndexedDB(): Promise<number> {
    if (!this.webDB) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.webDB!.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();

      request.onsuccess = () => {
        const tasks = request.result || [];
        const count = tasks.filter((task: Task) => task.needsSync).length;
        resolve(count);
      };

      request.onerror = () => {
        reject(new Error('Failed to count offline tasks in IndexedDB'));
      };
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run('DELETE FROM tasks');
    await this.db.run('DELETE FROM sync_actions');
  }

  // Helper methods
  private mapTasksFromDb(rows: any[]): Task[] {
    return rows.map(row => ({
      id: row.serverId || undefined,
      localId: row.localId,
      title: row.title,
      description: row.description || undefined,
      status: row.status,
      priority: row.priority,
      dueDate: row.dueDate || undefined,
      completedAt: row.completedAt || undefined,
      userId: row.userId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      needsSync: Boolean(row.needsSync),
      action: row.action || undefined,
      isOffline: Boolean(row.isOffline)
    }));
  }

  private generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.sqlite.closeConnection(this.dbName, false);
      this.db = null;
      this.isInitialized = false;
    }
  }
}