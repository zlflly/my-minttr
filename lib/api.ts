// API 工具函数
import { apiCache, metadataCache, generateCacheKey } from './cache';
import { optimisticCache } from './optimistic-cache';
import type { 
  Note, 
  APIResponse, 
  CreateNoteData, 
  UpdateNoteData, 
  LinkMetadata,
  OperationResult,
  APIError as APIErrorInterface
} from './types';
import { 
  createNoteSchema, 
  updateNoteSchema, 
  metadataExtractionSchema,
  paginationSchema,
  sanitizeString,
  sanitizeUrl
} from './validation';
import { 
  handleError, 
  createNetworkError, 
  createValidationError,
  ErrorType,
  ErrorSeverity
} from './error-handler';

// 重新导出类型，保持向后兼容
export type { Note, APIResponse } from './types';

// API错误处理助手
function handleAPIError(error: unknown, context: string): never {
  if (error instanceof Error) {
    // 网络错误
    if (error.message.includes('fetch')) {
      const networkError = createNetworkError(
        '网络请求失败，请检查网络连接',
        { component: 'API', action: context }
      );
      handleError(networkError);
      throw networkError;
    }
    
    // 验证错误
    if (error.name === 'ZodError') {
      const validationError = createValidationError(
        '数据验证失败',
        { originalError: error.message },
        { component: 'API', action: context }
      );
      handleError(validationError);
      throw validationError;
    }
  }
  
  // 未知错误
  const unknownError = new Error(error instanceof Error ? error.message : '未知API错误');
  handleError(unknownError);
  throw unknownError;
}

// 获取笔记列表
export async function fetchNotes(page = 1, limit = 20, search?: string): Promise<APIResponse<Note[]>> {
  try {
    // 检查乐观缓存
    const optimisticKey = `notes_${page}_${search || ''}`
    const optimisticData = optimisticCache.get<Note[]>(optimisticKey)
    
    // 如果有乐观缓存数据，立即返回
    if (optimisticData) {
      // 异步更新真实数据，但不阻塞UI
      setTimeout(() => fetchNotesFromServer(page, limit, search, optimisticKey), 0)
      return {
        success: true,
        data: optimisticData,
        pagination: {
          page,
          limit,
          total: optimisticData.length,
          totalPages: Math.ceil(optimisticData.length / limit)
        }
      }
    }

    // 检查传统缓存 - 搜索请求不缓存
    const cacheKey = generateCacheKey.notes(page, limit, search)
    const cachedData = !search ? apiCache.get(cacheKey) as APIResponse<Note[]> | null : null
    if (cachedData) {
      // 同时更新乐观缓存
      optimisticCache.set(optimisticKey, cachedData.data || [])
      return cachedData
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await fetch(`/api/notes?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    const data = await response.json();
    
    // 缓存成功的响应（1分钟TTL，因为笔记可能经常更新）- 但不缓存搜索结果
    if (data.success && !search) {
      apiCache.set(cacheKey, data, 60 * 1000)
      // 同时更新乐观缓存
      optimisticCache.set(optimisticKey, data.data || [])
    }
    
    return data;
  } catch (error) {
    console.error('获取笔记列表失败:', error);
    try {
      handleAPIError(error, 'fetchNotes');
    } catch {
      // 错误已被处理，返回失败响应
    }
    return {
      success: false,
      error: {
        code: 'FETCH_NOTES_ERROR',
        message: error instanceof Error ? error.message : '获取笔记列表失败'
      } as APIErrorInterface
    };
  }
}

// 从服务器获取笔记数据的辅助函数
async function fetchNotesFromServer(page: number, limit: number, search?: string, optimisticKey?: string) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await fetch(`/api/notes?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && optimisticKey) {
      // 更新乐观缓存
      optimisticCache.set(optimisticKey, data.data || []);
    }
    
    return data;
  } catch (error) {
    console.error('后台更新笔记列表失败:', error);
  }
}

// 创建笔记（支持乐观更新）
export async function createNote(noteData: {
  type?: "LINK" | "TEXT" | "IMAGE";
  title?: string;
  content?: string;
  url?: string;
  description?: string;
  domain?: string;
  faviconUrl?: string;
  imageUrl?: string;
  tags?: string;
}, enableOptimistic = true): Promise<APIResponse<Note>> {
  // 创建临时笔记对象用于乐观更新
  const tempNote: Note = {
    id: `temp_${Date.now()}`,
    type: (noteData.type as any) || 'TEXT',
    title: noteData.title || null,
    content: noteData.content || null,
    url: noteData.url || null,
    description: noteData.description || null,
    domain: noteData.domain || null,
    faviconUrl: noteData.faviconUrl || null,
    imageUrl: noteData.imageUrl || null,
    tags: noteData.tags || '',
    color: 'default',
    isHidden: false,
    isArchived: false,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    accessedAt: new Date(),
  };

  let tempId: string | null = null;

  // 乐观更新：立即添加到缓存
  if (enableOptimistic) {
    tempId = optimisticCache.optimisticCreate(tempNote);
  }

  try {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    const result = await response.json();

    // 确认乐观更新成功
    if (enableOptimistic && tempId && result.success) {
      optimisticCache.confirmOptimisticUpdate(tempId, result.data.id, result.data);
    }

    return result;
  } catch (error) {
    console.error('创建笔记失败:', error);
    
    // 回滚乐观更新
    if (enableOptimistic && tempId) {
      optimisticCache.rollbackOptimisticUpdate(tempId);
    }
    
    try {
      handleAPIError(error, 'createNote');
    } catch {
      // 错误已被处理，返回失败响应
    }
    return {
      success: false,
      error: {
        code: 'CREATE_NOTE_ERROR',
        message: error instanceof Error ? error.message : '创建笔记失败'
      } as APIErrorInterface
    };
  }
}

// 更新笔记
export async function updateNote(id: string, noteData: Partial<Note>): Promise<APIResponse<Note>> {
  try {
    const response = await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    return response.json();
  } catch (error) {
    console.error('更新笔记失败:', error);
    try {
      handleAPIError(error, 'updateNote');
    } catch {
      // 错误已被处理，返回失败响应
    }
    return {
      success: false,
      error: {
        code: 'UPDATE_NOTE_ERROR',
        message: error instanceof Error ? error.message : '更新笔记失败'
      } as APIErrorInterface
    };
  }
}

// 删除笔记
export async function deleteNote(id: string): Promise<APIResponse<{ message: string }>> {
  try {
    const response = await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    return response.json();
  } catch (error) {
    console.error('删除笔记失败:', error);
    try {
      handleAPIError(error, 'deleteNote');
    } catch {
      // 错误已被处理，返回失败响应
    }
    return {
      success: false,
      error: {
        code: 'DELETE_NOTE_ERROR',
        message: error instanceof Error ? error.message : '删除笔记失败'
      } as APIErrorInterface
    };
  }
}

// 提取链接元数据
export async function extractMetadata(url: string): Promise<APIResponse<{
  title: string;
  description: string;
  image: string;
  favicon: string;
  domain: string;
}>> {
  try {
    // 检查缓存（元数据相对稳定，可以缓存更长时间）
    const cacheKey = generateCacheKey.metadata(url)
    const cachedData = metadataCache.get(cacheKey) as APIResponse<{
      title: string;
      description: string;
      image: string;
      favicon: string;
      domain: string;
    }> | null
    if (cachedData) {
      return cachedData
    }

    const response = await fetch('/api/metadata/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    const data = await response.json();
    
    // 缓存成功的元数据（30分钟TTL）
    if (data.success) {
      metadataCache.set(cacheKey, data, 30 * 60 * 1000)
    }
    
    return data;
  } catch (error) {
    console.error('提取元数据失败:', error);
    try {
      handleAPIError(error, 'extractMetadata');
    } catch {
      // 错误已被处理，返回失败响应
    }
    return {
      success: false,
      error: {
        code: 'EXTRACT_METADATA_ERROR',
        message: error instanceof Error ? error.message : '提取元数据失败'
      } as APIErrorInterface
    };
  }
}

// URL 验证
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}