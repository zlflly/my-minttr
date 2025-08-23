import React, { useState, useCallback } from 'react';
import { PhotoNote } from '../lib/photo-types';
import NoteContextMenu from './ContextMenu';
import PhotoEditDialog from './PhotoEditDialog';
import { Button } from '@/components/ui/button';
import type { Note } from '@/lib/api';

interface PhotoCardProps {
  photoNote: PhotoNote;
  note: Note; // 添加完整的Note对象用于右键菜单
  onEdit?: (photoNote: PhotoNote) => void;
  onDelete?: (id: string) => void;
  onHide?: () => void;
  onColorChange?: (color: "default" | "pink" | "blue" | "green") => void;
  onNoteUpdated?: (updatedNote: Note) => void; // 添加笔记更新回调
}

const PhotoCard: React.FC<PhotoCardProps> = ({ 
  photoNote, 
  note, 
  onEdit, 
  onDelete, 
  onHide, 
  onColorChange, 
  onNoteUpdated 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false) // 添加编辑对话框状态
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleEdit = useCallback(() => {
    setShowEditDialog(true);
  }, []);

  const handleHide = useCallback(() => {
    onHide?.();
  }, [onHide]);

  const handleColorChange = useCallback((color: "default" | "pink" | "blue" | "green") => {
    onColorChange?.(color);
  }, [onColorChange]);

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

  return (
    <>
    <NoteContextMenu 
      note={note} 
      onHide={handleHide} 
      onEdit={handleEdit} 
      onDelete={handleDelete} 
      onColorChange={handleColorChange}
    >
      <div className={`rounded-xl shadow-border bg-sand-1 relative flex flex-col overflow-hidden group hover:shadow-lg transition-shadow duration-200 ${note.isHidden ? 'blur-sm opacity-70' : ''}`}>
      {/* Green indicator */}
      <div className="w-[1.5px] h-4 bg-green-9 absolute top-[19px] -left-[0.7px]"></div>
      
      {/* Image container */}
      <div className="relative m-1 rounded-lg overflow-hidden aspect-square w-[calc(100%-8px)]">
        {/* Blurred background */}
        <div className="absolute inset-0 blur-xl">
          <img 
            alt="" 
            className="w-[120%] h-[120%] object-cover opacity-50" 
            src={photoNote.imageUrl}
          />
        </div>
        
        {/* Main image */}
        <img 
          alt={photoNote.imageAlt || "image"} 
          className="relative w-full h-full object-contain mx-auto rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200" 
          src={photoNote.imageUrl}
          onClick={() => setShowEditDialog(true)}
        />
        
        {/* Border overlay */}
        <div className="absolute inset-0 box-border border-[0.5px] border-black/5 mix-blend-luminosity rounded-lg pointer-events-none"></div>
      </div>
      
      {/* Divider */}
      <div className="dash-sand-a7 bg-dash-6 h-[0.5px] bg-repeat-x"></div>
      
      {/* Note content */}
      <div className="bg-mi-amber-2 overflow-hidden p-3 rounded-lg my-[5px] mx-[5px] shadow-border-amber">
        <div className="prose prose-zinc text-mi-sm line-clamp-12 sm:line-clamp-16 prose-li:marker:text-sand-11 subpixel-antialiased prose-headings:antialiased">
          {photoNote.note ? (
            <div 
              dangerouslySetInnerHTML={{ 
                __html: photoNote.note.replace(/\*\*(.*?)\*\*/g, '<mark>$1</mark>') 
              }} 
            />
          ) : (
            <p className="text-sand-9 italic">No note added</p>
          )}
        </div>
        
        {/* Metadata */}
        <div className="mt-2 pt-2 border-t border-sand-a6">
          <div className="text-xs text-sand-9">
            {formatDate(photoNote.createdAt)}
            {photoNote.updatedAt > photoNote.createdAt && (
              <span className="ml-2">(edited {formatDate(photoNote.updatedAt)})</span>
            )}
          </div>
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
    onNoteUpdated={onNoteUpdated}
    open={showEditDialog}
    onOpenChange={setShowEditDialog}
  />
</>
  );
};

export default PhotoCard;