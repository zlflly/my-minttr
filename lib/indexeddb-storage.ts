/**
 * IndexedDB存储管理器
 * 用于离线数据存储和同步
 */

import type { Note } from './types';

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  method: string;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

export interface SyncResult {
  success: boolean;
  operationId: string;
  error?: string;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'NotesAppDB';
  private readonly dbVersion = 1;

  // 数据库结构定义
  private readonly stores = {
    notes: 'notes',           // 笔记数据
    operations: 'operations', // 离线操作队列
    cache: 'cache',          // API响应缓存
    metadata: 'metadata'     // 元数据缓存
  };

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB not available in server environment'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建笔记存储
        if (!db.objectStoreNames.contains(this.stores.notes)) {
          const notesStore = db.createObjectStore(this.stores.notes, { keyPath: 'id' });
          notesStore.createIndex('type', 'type');
          notesStore.createIndex('createdAt', 'createdAt');
          notesStore.createIndex('updatedAt', 'updatedAt');
          notesStore.createIndex('isArchived', 'isArchived');
        }

        // 创建离线操作存储
        if (!db.objectStoreNames.contains(this.stores.operations)) {
          const operationsStore = db.createObjectStore(this.stores.operations, { keyPath: 'id' });
          operationsStore.createIndex('timestamp', 'timestamp');
          operationsStore.createIndex('type', 'type');
        }

        // 创建缓存存储
        if (!db.objectStoreNames.contains(this.stores.cache)) {
          const cacheStore = db.createObjectStore(this.stores.cache, { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp');
          cacheStore.createIndex('expiry', 'expiry');
        }

        // 创建元数据存储
        if (!db.objectStoreNames.contains(this.stores.metadata)) {
          db.createObjectStore(this.stores.metadata, { keyPath: 'url' });
        }
      };
    });
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  /**
   * 执行事务
   */
  private async transaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    callback: (stores: IDBObjectStore | IDBObjectStore[]) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.ensureDB();
    const tx = db.transaction(storeNames, mode);
    
    const stores = Array.isArray(storeNames)
      ? storeNames.map(name => tx.objectStore(name))
      : tx.objectStore(storeNames);

    const request = callback(stores);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  // ===== 笔记数据管理 =====

  /**
   * 保存笔记到本地
   */
  async saveNote(note: Note): Promise<void> {
    await this.transaction(
      this.stores.notes,
      'readwrite',
      (store) => (store as IDBObjectStore).put({ 
        ...note, 
        _lastModified: Date.now(),
        _isOffline: false 
      })
    );
  }

  /**
   * 批量保存笔记
   */
  async saveNotes(notes: Note[]): Promise<void> {
    await this.transaction(
      this.stores.notes,
      'readwrite',
      (store) => {
        const promises = notes.map(note => 
          (store as IDBObjectStore).put({ 
            ...note, 
            _lastModified: Date.now(),
            _isOffline: false 
          })
        );
        return promises[promises.length - 1]; // 返回最后一个请求
      }
    );
  }

  /**
   * 获取所有笔记
   */
  async getNotes(options?: {
    limit?: number;
    offset?: number;
    type?: string;
    search?: string;
  }): Promise<Note[]> {
    const notes = await this.transaction(
      this.stores.notes,
      'readonly',
      (store) => (store as IDBObjectStore).getAll()
    );

    let filtered = notes.filter(note => !note.isArchived);

    // 类型过滤
    if (options?.type) {
      filtered = filtered.filter(note => note.type === options.type);
    }

    // 搜索过滤
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      filtered = filtered.filter(note =>
        note.title?.toLowerCase().includes(searchTerm) ||
        note.content?.toLowerCase().includes(searchTerm) ||
        note.description?.toLowerCase().includes(searchTerm) ||
        note.tags?.toLowerCase().includes(searchTerm)
      );
    }

    // 排序
    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 分页
    if (options?.offset || options?.limit) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  /**
   * 根据ID获取笔记
   */
  async getNote(id: string): Promise<Note | null> {
    const note = await this.transaction(
      this.stores.notes,
      'readonly',
      (store) => (store as IDBObjectStore).get(id)
    );
    return note || null;
  }

  /**
   * 删除笔记
   */
  async deleteNote(id: string): Promise<void> {
    await this.transaction(
      this.stores.notes,
      'readwrite',
      (store) => (store as IDBObjectStore).delete(id)
    );
  }

  /**
   * 获取笔记总数
   */
  async getNotesCount(): Promise<number> {
    const count = await this.transaction(
      this.stores.notes,
      'readonly',
      (store) => (store as IDBObjectStore).count()
    );
    return count;
  }

  // ===== 离线操作管理 =====

  /**
   * 添加离线操作
   */
  async addOfflineOperation(operation: OfflineOperation): Promise<void> {
    await this.transaction(
      this.stores.operations,
      'readwrite',
      (store) => (store as IDBObjectStore).add(operation)
    );
  }

  /**
   * 获取所有待同步的操作
   */
  async getPendingOperations(): Promise<OfflineOperation[]> {
    const operations = await this.transaction(
      this.stores.operations,
      'readonly',
      (store) => (store as IDBObjectStore).getAll()
    );

    return operations.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 移除已同步的操作
   */
  async removeOperation(operationId: string): Promise<void> {
    await this.transaction(
      this.stores.operations,
      'readwrite',
      (store) => (store as IDBObjectStore).delete(operationId)
    );
  }

  /**
   * 更新操作重试次数
   */
  async updateOperationRetryCount(operationId: string, retryCount: number): Promise<void> {
    const operation = await this.transaction(
      this.stores.operations,
      'readwrite',
      async (store) => {
        const op = await (store as IDBObjectStore).get(operationId);
        if (op) {
          op.retryCount = retryCount;
          return (store as IDBObjectStore).put(op);
        }
        return null;
      }
    );
  }

  /**
   * 清理失败次数过多的操作
   */
  async cleanupFailedOperations(maxRetries = 3): Promise<void> {
    const operations = await this.getPendingOperations();
    const failedOperations = operations.filter(op => op.retryCount >= maxRetries);

    for (const operation of failedOperations) {
      await this.removeOperation(operation.id);
    }
  }

  // ===== 缓存管理 =====

  /**
   * 缓存API响应
   */
  async cacheApiResponse(key: string, data: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };

    await this.transaction(
      this.stores.cache,
      'readwrite',
      (store) => (store as IDBObjectStore).put(cacheEntry)
    );
  }

  /**
   * 获取缓存的API响应
   */
  async getCachedApiResponse(key: string): Promise<any | null> {
    const entry = await this.transaction(
      this.stores.cache,
      'readonly',
      (store) => (store as IDBObjectStore).get(key)
    );

    if (!entry) return null;

    // 检查是否过期
    if (Date.now() > entry.expiry) {
      // 异步删除过期缓存
      this.transaction(
        this.stores.cache,
        'readwrite',
        (store) => (store as IDBObjectStore).delete(key)
      ).catch(console.error);
      return null;
    }

    return entry.data;
  }

  /**
   * 清理过期缓存
   */
  async cleanupExpiredCache(): Promise<void> {
    const entries = await this.transaction(
      this.stores.cache,
      'readonly',
      (store) => (store as IDBObjectStore).getAll()
    );

    const now = Date.now();
    const expiredKeys = entries
      .filter(entry => now > entry.expiry)
      .map(entry => entry.key);

    if (expiredKeys.length > 0) {
      await this.transaction(
        this.stores.cache,
        'readwrite',
        (store) => {
          expiredKeys.forEach(key => (store as IDBObjectStore).delete(key));
          return (store as IDBObjectStore).get(expiredKeys[0]); // 返回一个请求
        }
      );
    }
  }

  // ===== 数据同步 =====

  /**
   * 检查数据是否需要同步
   */
  async needsSync(): Promise<boolean> {
    const operations = await this.getPendingOperations();
    return operations.length > 0;
  }

  /**
   * 获取同步统计
   */
  async getSyncStats(): Promise<{
    pendingOperations: number;
    lastSync: number | null;
    cacheSize: number;
  }> {
    const [operations, cacheEntries] = await Promise.all([
      this.getPendingOperations(),
      this.transaction(
        this.stores.cache,
        'readonly',
        (store) => (store as IDBObjectStore).count()
      )
    ]);

    return {
      pendingOperations: operations.length,
      lastSync: operations.length > 0 
        ? Math.max(...operations.map(op => op.timestamp))
        : null,
      cacheSize: cacheEntries
    };
  }

  // ===== 数据库管理 =====

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    const storeNames = Object.values(this.stores);
    
    await this.transaction(
      storeNames,
      'readwrite',
      (stores) => {
        (stores as IDBObjectStore[]).forEach(store => store.clear());
        return (stores as IDBObjectStore[])[0].count(); // 返回一个请求
      }
    );
  }

  /**
   * 获取存储统计
   */
  async getStorageStats(): Promise<{
    notes: number;
    operations: number;
    cache: number;
    metadata: number;
  }> {
    const counts = await Promise.all([
      this.transaction(this.stores.notes, 'readonly', store => (store as IDBObjectStore).count()),
      this.transaction(this.stores.operations, 'readonly', store => (store as IDBObjectStore).count()),
      this.transaction(this.stores.cache, 'readonly', store => (store as IDBObjectStore).count()),
      this.transaction(this.stores.metadata, 'readonly', store => (store as IDBObjectStore).count())
    ]);

    return {
      notes: counts[0],
      operations: counts[1],
      cache: counts[2],
      metadata: counts[3]
    };
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 创建单例实例
export const indexedDBStorage = new IndexedDBManager();

// 初始化数据库（在客户端环境）
if (typeof window !== 'undefined') {
  indexedDBStorage.init().catch(error => {
    console.warn('Failed to initialize IndexedDB:', error);
  });
}

// 便捷方法导出
export const offlineStorage = {
  // 笔记相关
  saveNote: (note: Note) => indexedDBStorage.saveNote(note),
  saveNotes: (notes: Note[]) => indexedDBStorage.saveNotes(notes),
  getNote: (id: string) => indexedDBStorage.getNote(id),
  getNotes: (options?: Parameters<typeof indexedDBStorage.getNotes>[0]) => 
    indexedDBStorage.getNotes(options),
  deleteNote: (id: string) => indexedDBStorage.deleteNote(id),
  getNotesCount: () => indexedDBStorage.getNotesCount(),

  // 离线操作相关
  addOperation: (operation: OfflineOperation) => indexedDBStorage.addOfflineOperation(operation),
  getPendingOperations: () => indexedDBStorage.getPendingOperations(),
  removeOperation: (id: string) => indexedDBStorage.removeOperation(id),

  // 缓存相关
  cacheResponse: (key: string, data: any, ttl?: number) => 
    indexedDBStorage.cacheApiResponse(key, data, ttl),
  getCachedResponse: (key: string) => indexedDBStorage.getCachedApiResponse(key),

  // 同步相关
  needsSync: () => indexedDBStorage.needsSync(),
  getSyncStats: () => indexedDBStorage.getSyncStats(),

  // 管理相关
  clearAll: () => indexedDBStorage.clearAll(),
  getStats: () => indexedDBStorage.getStorageStats(),
};