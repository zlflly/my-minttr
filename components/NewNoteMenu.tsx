import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { CanvasIcon, ImageIcon, LinkIcon, MindIcon, PlusIcon } from './PhotoIcons';
import PhotoUploader from './PhotoUploader';
import CreateNoteDialog from './CreateNoteDialog';
import { NewPhotoData } from '@/lib/photo-types';
import { Note, createNote } from '@/lib/api';

interface NewNoteMenuProps {
  onNoteCreated: (note: Note) => void;
}

const NewNoteMenu: React.FC<NewNoteMenuProps> = ({ onNoteCreated }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [noteType, setNoteType] = useState<"link" | "text">("link");

  const handleImageClick = () => {
    setMenuOpen(false);
    setPhotoUploaderOpen(true);
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
    setNoteType("link");
    setCreateNoteOpen(true);
  };

  const handleTextClick = () => {
    setMenuOpen(false);
    setNoteType("text");
    setCreateNoteOpen(true);
  };

  const handlePhotoSubmit = async (data: NewPhotoData) => {
    try {
      // 创建FormData用于文件上传
      const formData = new FormData();
      formData.append('file', data.file);
      
      // 上传图片到blob存储
      const uploadResponse = await fetch('/api/blob', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('图片上传失败');
      }
      
      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.error?.message || '图片上传失败');
      }
      
      // 创建图片笔记
      const noteData = {
        type: 'IMAGE' as const,
        title: data.note || '图片笔记',
        content: data.note,
        imageUrl: uploadResult.data.url,
        tags: ''
      };
      
      const response = await createNote(noteData);
      
      if (response.success && response.data) {
        onNoteCreated(response.data);
      } else {
        throw new Error(response.error?.message || '创建笔记失败');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      alert('图片上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  return (
    <>
      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Trigger asChild>
          <button className="rounded-3xl bg-sand-3 shadow-3 backdrop-blur-xl border-[0.5px] border-white/45 overflow-hidden pointer-events-auto hover:scale-105 transition-transform">
            <div className="flex items-center gap-1 py-1 justify-center z-10 relative">
              <div className="text-[15px] font-medium text-sand-12 hover:bg-sand-a4 px-3 py-1.5 rounded-full select-none transition duration-100 ease-out flex items-center gap-2 scale-effect w-full justify-center">
                <PlusIcon className="w-[1em] h-[1em] text-current" />
                <span className="sm:inline hidden">New</span>
              </div>
            </div>
          </button>
        </Dialog.Trigger>
        
        <AnimatePresence>
          {menuOpen && (
            <Dialog.Portal>
              <Dialog.Overlay asChild>
                <motion.div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </Dialog.Overlay>
              
              <Dialog.Content asChild>
                <motion.div
                  className="fixed top-1/2 left-1/2 z-50"
                  initial={{ 
                    opacity: 0, 
                    scale: 0.95,
                    x: '-50%',
                    y: '-48%'
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: '-50%',
                    y: '-50%'
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.95,
                    x: '-50%',
                    y: '-48%'
                  }}
                  transition={{ 
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  {/* DialogTitle for accessibility - hidden visually but available to screen readers */}
                  <Dialog.Title className="sr-only">
                    创建新笔记
                  </Dialog.Title>
                  
                  <div 
                    className="rounded-3xl w-auto border-[0.5px] border-white/45 shadow-3 backdrop-blur-xl bg-sand-3 overflow-hidden pointer-events-auto max-w-[96%]" 
                    style={{ padding: '0.5rem 1rem', width: '374px' }}
                  >
                    <div className="flex flex-col gap-1 py-2">
                      <div className="text-sand-12 text-xs font-medium px-3">NEW</div>
                      
                      <button 
                        onClick={handleTextClick}
                        className="text-[15px] font-medium text-sand-12 hover:bg-sand-a4 px-3 hover:px-4 py-1.5 rounded-full select-none transition-all duration-100 ease-out flex items-center justify-between gap-2 scale-effect"
                      >
                        <div className="flex items-center gap-2">
                          <MindIcon className="w-[1em] h-[1em] text-current" />
                          Text
                        </div>
                        <kbd className="inline-flex items-center justify-center flex-shrink-0 font-mono font-normal text-xs min-w-[1.75em] h-fit px-2 py-0.5 rounded bg-sand-a2 text-sand-12">1</kbd>
                      </button>
                      
                      <button 
                        onClick={handleLinkClick}
                        className="text-[15px] font-medium text-sand-12 hover:bg-sand-a4 px-3 hover:px-4 py-1.5 rounded-full select-none transition-all duration-100 ease-out flex items-center justify-between gap-2 scale-effect"
                      >
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-[1em] h-[1em] text-current" />
                          Link
                        </div>
                        <kbd className="inline-flex items-center justify-center flex-shrink-0 font-mono font-normal text-xs min-w-[1.75em] h-fit px-2 py-0.5 rounded bg-sand-a2 text-sand-12">2</kbd>
                      </button>
                      
                      <button 
                        onClick={handleImageClick}
                        className="text-[15px] font-medium text-sand-12 hover:bg-sand-a4 px-3 hover:px-4 py-1.5 rounded-full select-none transition-all duration-100 ease-out flex items-center justify-between gap-2 scale-effect"
                      >
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-[1em] h-[1em] text-current" />
                          Image
                        </div>
                        <kbd className="inline-flex items-center justify-center flex-shrink-0 font-mono font-normal text-xs min-w-[1.75em] h-fit px-2 py-0.5 rounded bg-sand-a2 text-sand-12">3</kbd>
                      </button>
                      
                      <button className="text-[15px] font-medium text-sand-12 hover:bg-sand-a4 px-3 hover:px-4 py-1.5 rounded-full select-none transition-all duration-100 ease-out flex items-center justify-between gap-2 scale-effect">
                        <div className="flex items-center gap-2">
                          <CanvasIcon className="w-[1em] h-[1em] text-current" />
                          Canvas
                        </div>
                        <kbd className="inline-flex items-center justify-center flex-shrink-0 font-mono font-normal text-xs min-w-[1.75em] h-fit px-2 py-0.5 rounded bg-sand-a2 text-sand-12">4</kbd>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>

      {/* PhotoUploader Dialog */}
      <PhotoUploader
        open={photoUploaderOpen}
        onOpenChange={setPhotoUploaderOpen}
        onSubmit={handlePhotoSubmit}
      />

      {/* CreateNoteDialog for Link and Text */}
      <CreateNoteDialog
        open={createNoteOpen}
        onOpenChange={setCreateNoteOpen}
        onNoteCreated={onNoteCreated}
        initialTab={noteType}
      >
        <div />
      </CreateNoteDialog>
    </>
  );
};

export default NewNoteMenu;