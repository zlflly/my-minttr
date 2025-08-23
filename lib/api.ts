// API 工具函数

export interface Note {
  id: string;
  type: "LINK" | "TEXT";
  title?: string;
  content?: string;
  url?: string;
  description?: string;
  domain?: string;
  faviconUrl?: string;
  imageUrl?: string;
  tags: string;
  color?: "default" | "pink" | "blue" | "green";
  isHidden?: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  accessedAt: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 获取笔记列表
export async function fetchNotes(page = 1, limit = 20): Promise<APIResponse<Note[]>> {
  try {
    const response = await fetch(`/api/notes?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    return response.json();
  } catch (error) {
    console.error('获取笔记列表失败:', error);
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
  type?: "LINK" | "TEXT";
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    return response.json();
  } catch (error) {
    console.error('创建笔记失败:', error);
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    return response.json();
  } catch (error) {
    console.error('更新笔记失败:', error);
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    return response.json();
  } catch (error) {
    console.error('删除笔记失败:', error);
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
    const response = await fetch('/api/metadata/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是JSON格式');
    }
    
    return response.json();
  } catch (error) {
    console.error('提取元数据失败:', error);
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