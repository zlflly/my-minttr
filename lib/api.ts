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
  const response = await fetch(`/api/notes?page=${page}&limit=${limit}`);
  return response.json();
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
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(noteData),
  });
  return response.json();
}

// 更新笔记
export async function updateNote(id: string, noteData: Partial<Note>): Promise<APIResponse<Note>> {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(noteData),
  });
  return response.json();
}

// 删除笔记
export async function deleteNote(id: string): Promise<APIResponse<{ message: string }>> {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

// 提取链接元数据
export async function extractMetadata(url: string): Promise<APIResponse<{
  title: string;
  description: string;
  image: string;
  favicon: string;
  domain: string;
}>> {
  const response = await fetch('/api/metadata/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  return response.json();
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