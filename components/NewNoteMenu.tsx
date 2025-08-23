import React, { useState, useRef, useEffect } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [noteType, setNoteType] = useState<"link" | "text">("link");
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleImageClick = () => {
    setIsExpanded(false);
    setPhotoUploaderOpen(true);
  };

  const handleLinkClick = () => {
    setIsExpanded(false);
    setNoteType("link");
    setCreateNoteOpen(true);
  };

  const handleTextClick = () => {
    setIsExpanded(false);
    setNoteType("text");
    setCreateNoteOpen(true);
  };

  const handleMainButtonClick = () => {
    // 清除任何待定的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsExpanded(!isExpanded);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 300); // 300ms延迟，避免误触
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
        tags: data.tags || ''
      };
      
      const response = await createNote(noteData);
      
      if (response.success && response.data) {
        onNoteCreated(response.data);
        // 创建成功后关闭对话框
        setPhotoUploaderOpen(false);
      } else {
        throw new Error(response.error?.message || '创建笔记失败');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      alert('图片上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
      // 发生错误时也关闭对话框，让用户可以重新尝试
      setPhotoUploaderOpen(false);
    }
  };

  return (
    <>
      <div 
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div 
          className="relative rounded-3xl border-[0.5px] border-white/45 backdrop-blur-xl overflow-hidden pointer-events-auto max-w-[96%]"
          style={{
            backgroundColor: "rgb(241,240,239)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
          animate={{
            width: isExpanded ? "374px" : "auto",
            padding: isExpanded ? "0.5rem 1rem" : "0",
            scale: isExpanded ? [1, 1.02, 1] : 1,
            opacity: isExpanded ? [1, 0.95, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
            scale: {
              duration: 1.5,
              ease: "easeInOut",
              repeat: isExpanded ? Infinity : 0,
              repeatType: "reverse"
            },
            opacity: {
              duration: 1.2,
              ease: "easeInOut",
              repeat: isExpanded ? Infinity : 0,
              repeatType: "reverse"
            }
          }}
        >
          {/* 展开的菜单内容 */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                className="relative z-10 py-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <motion.div 
                  className="text-sand-12 text-xs font-medium px-3 mb-1.5"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  NEW
                </motion.div>
                
                {[
                  { id: 'mind', label: 'Mind', icon: MindIcon, hotkey: '1', onClick: handleTextClick },
                  { id: 'link', label: 'Link', icon: LinkIcon, hotkey: '2', onClick: handleLinkClick },
                  { id: 'image', label: 'Image', icon: ImageIcon, hotkey: '3', onClick: handleImageClick },
                  { id: 'canvas', label: 'Canvas', icon: CanvasIcon, hotkey: '4', onClick: () => {} }
                ].map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={item.onClick}
                      className="w-full text-[15px] font-medium text-sand-12 hover:bg-sand-a4 px-3 hover:px-4 py-1.5 rounded-full select-none transition-all duration-100 ease-out flex items-center justify-between gap-2 scale-effect"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.05, duration: 0.2 }}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-[1em] h-[1em] text-current" />
                        {item.label}
                      </div>
                      <kbd className="inline-flex items-center justify-center flex-shrink-0 font-mono font-normal text-xs min-w-[1.75em] h-fit px-2 py-0.5 rounded bg-sand-a2 text-sand-12">
                        {item.hotkey}
                      </kbd>
                    </motion.button>
                  );
                })}
                
                {/* 分隔线 */}
                <motion.div 
                  className="h-[0.5px] bg-gray-200/40 mx-3 my-1" 
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.35, duration: 0.2 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 主按钮 */}
          <button
            className={`w-full flex items-center justify-center gap-2 text-[15px] font-medium text-sand-12 rounded-full select-none transition-all duration-200 active:scale-95 ${
              !isExpanded ? 'px-4 py-2.5 hover:bg-sand-a4' : 'py-1.5 hover:bg-sand-a4'
            }`}
            onClick={handleMainButtonClick}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <PlusIcon className="w-5 h-5 text-sand-12" />
            </motion.div>
            <span>New</span>
          </button>
        </motion.div>
      </div>

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