// 增强的类型定义文件

import { z } from 'zod';

// 基础类型定义
export type NoteType = 'LINK' | 'TEXT' | 'IMAGE' | 'TODO';
export type ColorType = 'default' | 'pink' | 'blue' | 'green';

// Note接口增强版
export interface Note {
  readonly id: string;
  readonly type: NoteType;
  title?: string | null;
  content?: string | null;
  url?: string | null;
  description?: string | null;
  domain?: string | null;
  faviconUrl?: string | null;
  imageUrl?: string | null;
  tags: string;
  color: ColorType;
  isHidden: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly accessedAt: string;
}

// API响应类型
export interface APIError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export interface Pagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface APIResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: APIError;
  readonly pagination?: Pagination;
}

// 操作结果类型
export type OperationResult<T = unknown> = Promise<APIResponse<T>>;

// 事件处理器类型
export interface NoteEventHandlers {
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onHide?: (noteId: string, isHidden: boolean) => void;
  onColorChange?: (noteId: string, color: ColorType) => void;
  onUpdate?: (note: Note) => void;
}

// 组件Props类型
export interface BaseComponentProps {
  readonly className?: string;
  readonly children?: React.ReactNode;
}

export interface NoteCardProps extends BaseComponentProps {
  readonly note: Note;
  readonly onDelete?: (noteId: string) => void;
  readonly onNoteUpdate?: (updatedNote: Note) => void;
}

export interface CreateNoteData {
  type?: NoteType;
  title?: string;
  content?: string;
  url?: string;
  description?: string;
  domain?: string;
  faviconUrl?: string;
  imageUrl?: string;
  tags?: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  url?: string;
  description?: string;
  tags?: string;
  color?: ColorType;
  isHidden?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
}

// 缓存相关类型
export interface CacheItem<T> {
  readonly data: T;
  readonly timestamp: number;
  readonly ttl: number;
}

export interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl: number): void;
  delete(key: string): boolean;
  clear(): void;
}

// 元数据相关类型
export interface LinkMetadata {
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly favicon: string;
  readonly domain: string;
}

// 照片相关类型
export interface PhotoNote {
  readonly id: string;
  readonly imageUrl: string;
  readonly imageAlt?: string;
  readonly note?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface NewPhotoData {
  readonly file: File;
  readonly note?: string;
  readonly tags?: string;
}

// 错误类型
export class APIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 工具函数类型
export type ThrottledFunction<T extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<T>
) => void;

export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<T>
) => void;

// React Hook 类型
export interface UseNotesReturn {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

// 状态管理类型
export interface AppState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  totalNotes: number;
}

export type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'LOAD_MORE_NOTES'; payload: Note[] }
  | { type: 'SET_PAGINATION'; payload: { page: number; hasMore: boolean; total: number } };

// 配置类型
export interface AppConfig {
  readonly apiBaseUrl: string;
  readonly maxFileSize: number;
  readonly allowedImageTypes: readonly string[];
  readonly cacheTimeout: {
    readonly notes: number;
    readonly metadata: number;
  };
  readonly pagination: {
    readonly defaultLimit: number;
    readonly maxLimit: number;
  };
}