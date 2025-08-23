import React, { useState, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadIcon } from './PhotoIcons';
import { NewPhotoData } from '../lib/photo-types';

interface PhotoUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewPhotoData) => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ open, onOpenChange, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(file);
          }
          break;
        }
      }
    }
  }, [handleFileSelect]);

  React.useEffect(() => {
    if (open) {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [open, handlePaste]);

  // 平滑关闭动画处理
  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const handleSubmit = useCallback(() => {
    if (selectedFile && !isLoading) {
      setIsLoading(true);
      onSubmit({
        file: selectedFile,
        note: note.trim(),
        tags: tags.trim()
      });
      // 注意：不在这里关闭对话框，等待外部处理完成后再关闭
      // 重置表单状态将在handleOpenChange中处理
    }
  }, [selectedFile, note, tags, isLoading, onSubmit]);

  const resetForm = useCallback(() => {
    setSelectedFile(null);
    setNote('');
    setTags('');
    setIsLoading(false);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }, [onOpenChange, resetForm]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1]
                }}
              />
            </Dialog.Overlay>
            
            <Dialog.Content asChild>
              <motion.div
                className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto"
                initial={{ 
                  opacity: 0, 
                  y: '100%',
                  scale: 0.95
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1
                }}
                exit={{ 
                  opacity: 0, 
                  y: '100%',
                  scale: 0.95
                }}
                transition={{ 
                  type: "spring",
                  damping: 25,
                  stiffness: 200,
                  mass: 1,
                  duration: 0.6
                }}
              >
                {/* DialogTitle for accessibility - hidden visually but available to screen readers */}
                <Dialog.Title className="sr-only">
                  上传图片
                </Dialog.Title>
                
                <div className="bg-sand-1 rounded-t-xl shadow-border flex-1 max-h-[90vh] overflow-hidden flex flex-col mb-0">
                  <div className="flex flex-col gap-2 max-h-full overflow-hidden flex-1 justify-between">
                    <div className="flex flex-col flex-1 overflow-hidden shadow-border rounded-xl">
                      {/* Image upload area */}
                      <div 
                        className={`w-full min-h-[312px] flex items-center justify-center flex-col gap-2 overflow-hidden relative border-dashed border-2 transition-colors ${
                          dragOver ? 'border-sand-8 bg-sand-2' : 'border-sand-6'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        {selectedFile ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <img 
                              src={URL.createObjectURL(selectedFile)} 
                              alt="Preview" 
                              className="max-w-full max-h-[280px] object-contain rounded-lg"
                              onLoad={(e) => {
                                // Clean up object URL to prevent memory leaks
                                const img = e.target as HTMLImageElement;
                                if (img.src.startsWith('blob:')) {
                                  setTimeout(() => URL.revokeObjectURL(img.src), 100);
                                }
                              }}
                            />
                            <button 
                              onClick={() => setSelectedFile(null)}
                              className="absolute top-2 right-2 bg-sand-1 hover:bg-sand-3 rounded-full p-2 shadow-border"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <UploadIcon className="text-sand-9" />
                            <div className="text-[15px] text-sand-11 flex items-center gap-1 flex-wrap">
                              Drop image here or press{' '}
                              <kbd className="inline-flex items-center justify-center flex-shrink-0 font-mono font-normal text-xs min-w-[1.75em] h-fit px-2 py-0.5 rounded bg-sand-a2 text-sand-12">⌘</kbd>
                              +
                              <kbd className="inline-flex items-center justify-center flex-shrink-0 font-mono font-normal text-xs min-w-[1.75em] h-fit px-2 py-0.5 rounded bg-sand-a2 text-sand-12">V</kbd>
                              {' '}to paste
                            </div>
                            <label>
                              <input 
                                ref={fileInputRef}
                                className="hidden" 
                                accept="image/*" 
                                type="file" 
                                onChange={handleFileInputChange}
                              />
                              <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-sand-11 hover:text-sand-12 hover:bg-sand-a3 rounded-full transition cursor-pointer">
                                Choose a file
                              </span>
                            </label>
                            <div className="flex justify-between gap-2 text-xs text-sand-11 px-3 absolute bottom-2 left-0 right-0">
                              <div>Supported formats: PNG, JPG, WebP, GIF</div>
                              <div>Max file size: 10MB</div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Divider */}
                      <div className="dash-sand-a6 bg-dash-6 h-[0.5px] bg-repeat-x"></div>
                      
                      {/* Note input */}
                      <div className="bg-mi-amber-2 text-sand-11 px-3 py-2">
                        <div className="font-snpro" style={{ minHeight: '70px' }}>
                          <div 
                            contentEditable
                            className="prose text-[15px] max-w-full prose-zinc text-sand-12 focus:outline-none prose-li:marker:text-sand-11 subpixel-antialiased"
                            style={{ minHeight: '70px' }}
                            onInput={(e) => {
                              const target = e.target as HTMLDivElement;
                              setNote(target.textContent || '');
                            }}
                            data-placeholder="Write a note"
                          />
                        </div>
                      </div>
                      
                      {/* 细细的分隔线 */}
                      <div className="h-[1px] bg-gray-200"></div>
                      
                      {/* 浅蓝色标签创建区域 */}
                      <div className="bg-blue-50 px-3 py-2 rounded-b-xl" style={{ height: '35px' }}>
                        <input
                          type="text"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          placeholder="Add tags (separated by spaces)"
                          className="w-full text-[13px] bg-transparent text-gray-600 placeholder-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 justify-end items-center w-full px-2 mt-2 pb-2">
                      <motion.button 
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-sand-11 hover:text-sand-12 hover:bg-sand-a3 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={handleSubmit}
                        disabled={!selectedFile || isLoading}
                        className="px-4 py-2 text-sm font-medium bg-sand-9 text-sand-1 hover:bg-sand-10 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-sand-1/30 border-t-sand-1 rounded-full animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Done'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default PhotoUploader;