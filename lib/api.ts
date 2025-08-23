// API 工具函数
import { apiCache, metadataCache, generateCacheKey } from './cache';
import type { 
  Note, 
  APIResponse, 
  CreateNoteData, 
  UpdateNoteData, 
  LinkMetadata,
  OperationResult 
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
export async function fetchNotes(page = 1, limit = 20): Promise<APIResponse<Note[]>> {
  try {
    // 检查缓存
    const cacheKey = generateCacheKey.notes(page, limit)
    const cachedData = apiCache.get(cacheKey) as APIResponse<Note[]> | null
    if (cachedData) {
      return cachedData
    }

    const response = await fetch(`/api/notes?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    const data = await response.json();
    
    // 缓存成功的响应（1分钟TTL，因为笔记可能经常更新）
    if (data.success) {
      apiCache.set(cacheKey, data, 60 * 1000)
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
      }
    };
  }
}

// 创建笔记
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
}): Promise<APIResponse<Note>> {
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
    
    return response.json();
  } catch (error) {
    console.error('创建笔记失败:', error);
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
      }
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
      }
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
      }
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
      }
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