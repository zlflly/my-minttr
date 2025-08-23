import React from 'react';
import { PhotoNote } from '../lib/photo-types';

interface PhotoCardProps {
  photoNote: PhotoNote;
  onEdit?: (photoNote: PhotoNote) => void;
  onDelete?: (id: string) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photoNote, onEdit, onDelete }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="rounded-xl shadow-border bg-sand-1 relative flex flex-col overflow-hidden group hover:shadow-lg transition-shadow duration-200">
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
          onClick={() => onEdit?.(photoNote)}
        />
        
        {/* Border overlay */}
        <div className="absolute inset-0 box-border border-[0.5px] border-black/5 mix-blend-luminosity rounded-lg pointer-events-none"></div>
        
        {/* Action buttons (visible on hover) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          {onEdit && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(photoNote);
              }}
              className="bg-sand-1/80 hover:bg-sand-1 backdrop-blur-sm rounded-full p-1.5 shadow-border text-sand-11 hover:text-sand-12 transition"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('确定要删除这张图片笔记吗？')) {
                  onDelete(photoNote.id);
                }
              }}
              className="bg-sand-1/80 hover:bg-red-50 backdrop-blur-sm rounded-full p-1.5 shadow-border text-sand-11 hover:text-red-600 transition"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
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
    </div>
  );
};

export default PhotoCard;