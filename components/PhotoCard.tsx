import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { PhotoNote } from '../lib/photo-types';
import NoteContextMenu from './ContextMenu';
import PhotoEditDialog from './PhotoEditDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateNote } from '@/lib/api';
import type { Note } from '@/lib/api';
import LazyImage from './LazyImage';
import HighlightText from './HighlightText';

interface PhotoCardProps {
  photoNote: PhotoNote;
  note: Note; // 添加完整的Note对象用于右键菜单
  onEdit?: (photoNote: PhotoNote) => void;
  onDelete?: (id: string) => void;
  onHide?: () => void;
  onColorChange?: (color: "default" | "pink" | "blue" | "green") => void;
  onNoteUpdated?: (updatedNote: Note) => void; // 添加笔记更新回调
  searchTerm?: string; // 添加搜索词
}

const PhotoCard: React.FC<PhotoCardProps> = ({ 
  photoNote, 
  note, 
  onEdit, 
  onDelete, 
  onHide, 
  onColorChange, 
  onNoteUpdated,
  searchTerm = ""
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false) // 添加编辑对话框状态
  // 本地状态用于即时响应
  const [localColor, setLocalColor] = useState(note.color)
  const [localIsHidden, setLocalIsHidden] = useState(note.isHidden)
  
  // 使用 useMemo 缓存 note 对象，避免不必要的重新渲染
  const memoizedNote = useMemo(() => ({
    ...note,
    color: localColor,
    isHidden: localIsHidden
  }), [note, localColor, localIsHidden, note.tags, note.content, note.title])
  
  // 同步本地状态与props状态
  useEffect(() => {
    setLocalColor(note.color)
    setLocalIsHidden(note.isHidden)
  }, [note.color, note.isHidden])
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTags = () => {
    if (!note.tags) return []
    return note.tags.split(/\s+/).filter(tag => tag.trim()).map(tag => tag.trim())
  };

  const handleEdit = useCallback(() => {
    setShowEditDialog(true);
  }, []);

  const handleHide = useCallback(async () => {
    // 立即更新本地状态实现即时响应
    const newHiddenState = !localIsHidden
    setLocalIsHidden(newHiddenState)
    
    try {
      const result = await updateNote(note.id, { isHidden: newHiddenState })
      if (result.success && result.data) {
        onNoteUpdated?.(result.data)
      }
    } catch (error) {
      console.error('Failed to update photo note visibility:', error)
      // 如果后端更新失败，回滚本地状态
      setLocalIsHidden(!newHiddenState)
    }
  }, [localIsHidden, note.id, onNoteUpdated]);

  const handleColorChange = useCallback(async (color: "default" | "pink" | "blue" | "green") => {
    // 立即更新本地状态实现即时响应
    setLocalColor(color)
    
    try {
      const result = await updateNote(note.id, { color })
      if (result.success && result.data) {
        onNoteUpdated?.(result.data)
      }
    } catch (error) {
      console.error('Failed to update photo note color:', error)
      // 如果后端更新失败，回滚本地状态
      setLocalColor(note.color)
    }
  }, [localColor, note.color, note.id, onNoteUpdated]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setIsDeleting(true);
    onDelete?.(photoNote.id);
  }, [photoNote.id, onDelete]);

  const handleCancelDelete = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShowDeleteConfirm(false);
      setIsClosing(false);
    }, 200);
  }, []);

  const handleNoteUpdated = useCallback((updatedNote: Note) => {
    // 更新本地状态
    setLocalColor(updatedNote.color)
    setLocalIsHidden(updatedNote.isHidden)
    // 通知父组件
    onNoteUpdated?.(updatedNote)
  }, [onNoteUpdated]);

  return (
    <>
    <NoteContextMenu 
      note={memoizedNote} 
      onHide={handleHide} 
      onEdit={handleEdit} 
      onDelete={handleDelete} 
      onColorChange={handleColorChange}
    >
      <div className={`rounded-xl shadow-border bg-sand-1 relative flex flex-col overflow-hidden group hover:shadow-lg transition-shadow duration-200 ${localIsHidden ? 'blur-sm opacity-70' : ''}`}>
      {/* Green indicator */}
      <div className="w-[1.5px] h-4 bg-green-9 absolute top-[19px] -left-[0.7px]"></div>
      
      {/* Image container */}
      <div className="relative m-1 rounded-lg overflow-hidden aspect-square w-[calc(100%-8px)]">
        {/* Blurred background */}
        <div className="absolute inset-0 blur-xl">
          <img 
            src={photoNote.imageUrl}
            alt="" 
            className="w-[120%] h-[120%] object-cover opacity-50" 
            style={{ transform: 'translate(-10%, -10%)' }}
          />
        </div>
        
        {/* Main image */}
        <img 
          src={photoNote.imageUrl}
          alt={photoNote.imageAlt || "image"} 
          className="relative w-full h-full object-contain mx-auto rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200" 
        />
        
        {/* Click overlay for edit */}
        <div 
          className="absolute inset-0 cursor-pointer z-10"
          onClick={() => setShowEditDialog(true)}
        />
        
        {/* Border overlay */}
        <div className="absolute inset-0 box-border border-[0.5px] border-black/5 mix-blend-luminosity rounded-lg pointer-events-none"></div>
      </div>
      
      {/* Divider */}
      <div className="dash-sand-a7 bg-dash-6 h-[0.5px] bg-repeat-x"></div>
      
      {/* Note content - 只有当有内容时才显示 */}
      {photoNote.note && photoNote.note.trim() && (
        <>
          <div className="bg-mi-amber-2 overflow-hidden p-3 rounded-lg my-[5px] mx-[5px] shadow-border-amber">
            <div className="prose prose-zinc text-mi-sm line-clamp-12 sm:line-clamp-16 prose-li:marker:text-sand-11 subpixel-antialiased prose-headings:antialiased">
              <HighlightText text={photoNote.note} searchTerm={searchTerm} />
            </div>
          </div>
          
          {/* 分隔线 */}
          <div className="dash-sand-a7 bg-dash-6 h-[0.5px] bg-repeat-x"></div>
        </>
      )}
      
      {/* 统一的底部样式 - 标签和日期 */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {getTags().map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              <HighlightText text={tag} searchTerm={searchTerm} />
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-[#A3A3A3]">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{formatDate(photoNote.createdAt)}</span>
          {photoNote.updatedAt > photoNote.createdAt && (
            <span className="ml-2">(edited)</span>
          )}
        </div>
      </div>
      
      {/* 删除确认覆盖层 */}
      {showDeleteConfirm && (
        <div 
          className={`absolute inset-0 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 transition-all duration-200 ${
            isClosing 
              ? 'animate-out fade-out-0 zoom-out-95' 
              : 'animate-in fade-in-0 zoom-in-95'
          } ${
            isDeleting 
              ? 'bg-[rgb(246,244,240)]/80' 
              : 'bg-white/80'
          }`}
        >
          {isDeleting ? (
            // 删除中状态：显示加载环
            <div className="flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : (
            // 确认状态：显示确认对话框
            <div 
              className={`flex flex-col items-center gap-3 p-4 transition-opacity duration-150 ${
                isClosing ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 256 256" 
                  className="w-5 h-5 text-red-500"
                >
                  <rect width="256" height="256" fill="none"></rect>
                  <line 
                    x1="216" y1="56" x2="40" y2="56" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="16"
                  ></line>
                  <line 
                    x1="104" y1="104" x2="104" y2="168" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="16"
                  ></line>
                  <line 
                    x1="152" y1="104" x2="152" y2="168" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="16"
                  ></line>
                  <path 
                    d="M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="16"
                  ></path>
                  <path 
                    d="M168,56V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V56" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="16"
                  ></path>
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  Delete this card?
                </span>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDelete}
                  className="min-w-[70px] h-8 text-xs"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmDelete}
                  className="min-w-[90px] h-8 text-xs bg-red-500 hover:bg-red-600 text-white"
                  disabled={isDeleting}
                >
                  Confirm delete
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </NoteContextMenu>
    
  {/* 图片笔记编辑对话框 */}
  <PhotoEditDialog
    note={note}
    photoNote={photoNote}
    onNoteUpdated={handleNoteUpdated}
    open={showEditDialog}
    onOpenChange={setShowEditDialog}
  />
</>
  );
};

export default PhotoCard;