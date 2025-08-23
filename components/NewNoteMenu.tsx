'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, LinkIcon, MindIcon, PlusIcon } from './PhotoIcons';
import PhotoUploader from './PhotoUploader';
import CreateNoteDialog from './CreateNoteDialog';
import { NewPhotoData } from '@/lib/photo-types';
import { Note, createNote } from '@/lib/api';
import { 
  useAccessibility, 
  AriaLabels, 
  KeyboardKeys, 
  createAriaProps,
  FocusManager
} from '@/lib/accessibility';

interface NewNoteMenuProps {
  onNoteCreated: (note: Note) => void;
}

// --- Animation Variants --- //

const menuVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      duration: 0.2, 
      ease: "easeOut" as const,
      staggerChildren: 0.04,
      delayChildren: 0.05
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: { 
      duration: 0.15, 
      ease: "easeIn" as const
    } 
  },
};

const buttonVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      duration: 0.15, 
      ease: "easeOut" as const
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: { 
      duration: 0.15, 
      ease: "easeIn" as const
    } 
  },
};

const itemVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const
    }
  },
};

const NewNoteMenu: React.FC<NewNoteMenuProps> = ({ onNoteCreated }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [noteType, setNoteType] = useState<"link" | "text">("link");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const justClickedRef = useRef(false); // Ref to track click interaction
  const menuRef = useRef<HTMLDivElement>(null);
  
  // 可访问性工具
  const { announce } = useAccessibility();
  
  // 使用 React 18 的 useId hook 生成稳定的 ID
  const id = useId();
  const menuId = `new-note-menu-${id}`;
  const menuButtonId = `menu-button-${id}`;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const triggerVibration = () => {
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const openDialog = (type: "image" | "link" | "text") => {
    triggerVibration();
    setIsExpanded(false);
    
    // 宣布选择的类型
    const typeNames = { image: '图片', link: '链接', text: '文本' };
    announce(`正在创建${typeNames[type]}笔记`);
    
    if (type === 'image') {
      setPhotoUploaderOpen(true);
    } else {
      setNoteType(type);
      setCreateNoteOpen(true);
    }
  };

  const handleMainButtonClick = () => {
    triggerVibration();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // If we are closing the menu via click, set the ref
    if (isExpanded) {
      justClickedRef.current = true;
      announce('菜单已关闭');
    } else {
      announce('新建笔记菜单已打开');
    }

    setIsExpanded(!isExpanded);
  };

  const handleMouseEnter = () => {
    // If a click just happened, ignore the hover event
    if (justClickedRef.current) {
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!isExpanded) setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    // When mouse leaves, always reset the click ref
    justClickedRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsExpanded(false), 300);
  };

  const handlePhotoSubmit = async (data: NewPhotoData) => {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      const uploadResponse = await fetch('/api/blob', { method: 'POST', body: formData });
      if (!uploadResponse.ok) throw new Error('图片上传失败');
      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) throw new Error(uploadResult.error?.message || '图片上传失败');
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
        setPhotoUploaderOpen(false);
      } else {
        throw new Error(response.error?.message || '创建笔记失败');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      alert('图片上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
      setPhotoUploaderOpen(false);
    }
  };

  const menuItems = [
    { id: 'mind', label: 'Mind', icon: MindIcon, hotkey: '1', type: 'text' as const, ariaLabel: '创建思维笔记' },
    { id: 'link', label: 'Link', icon: LinkIcon, hotkey: '2', type: 'link' as const, ariaLabel: '创建链接笔记' },
    { id: 'image', label: 'Image', icon: ImageIcon, hotkey: '3', type: 'image' as const, ariaLabel: '创建图片笔记' }
  ];
  
  // 键盘导航处理
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isExpanded) {
      if (event.key === KeyboardKeys.ENTER || event.key === KeyboardKeys.SPACE) {
        event.preventDefault();
        handleMainButtonClick();
      }
      return;
    }

    switch (event.key) {
      case KeyboardKeys.ESCAPE:
        event.preventDefault();
        setIsExpanded(false);
        announce('菜单已关闭');
        break;
      case '1':
      case '2':
      case '3':
        event.preventDefault();
        const index = parseInt(event.key) - 1;
        if (menuItems[index]) {
          openDialog(menuItems[index].type);
        }
        break;
      case KeyboardKeys.ARROW_UP:
      case KeyboardKeys.ARROW_DOWN:
        event.preventDefault();
        if (menuRef.current) {
          const focusableElements = FocusManager.getFocusableElements(menuRef.current);
          const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
          const nextIndex = event.key === KeyboardKeys.ARROW_UP 
            ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
            : (currentIndex + 1) % focusableElements.length;
          focusableElements[nextIndex]?.focus();
        }
        break;
    }
  };

  const commonStyles = {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px) saturate(180%)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
    border: "1px solid rgba(255,255,255,0.25)",
  };

  return (
    <>
      <div 
        ref={menuRef}
        className="fixed bottom-6 left-1/2 z-50"
        style={{ transform: 'translateX(-50%)' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        role="navigation"
        aria-label={AriaLabels.MAIN_NAVIGATION}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            // --- EXPANDED MENU COMPONENT ---
            <motion.div
              key="menu"
              id={menuId}
              className="w-[374px] rounded-3xl overflow-hidden pointer-events-auto mx-2"
              style={{
                ...commonStyles,
                background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75))",
              }}
              variants={menuVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="menu"
              aria-labelledby={menuButtonId}
            >
              <motion.div variants={{ animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}>
                <div className="relative z-10 py-2 px-4">
                  <motion.div className="text-gray-800 text-xs font-medium px-3 mb-1.5" variants={itemVariants}>NEW</motion.div>
                  {menuItems.map((item) => (
                    <motion.button
                      key={item.id}
                      onClick={() => openDialog(item.type)}
                      className="w-full text-[15px] font-semibold text-gray-800 hover:bg-gray-200/60 active:bg-gray-300/50 px-3 hover:px-4 py-1.5 rounded-full select-none transition-all duration-100 ease-out flex items-center justify-between gap-2 scale-effect focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      variants={itemVariants}
                      role="menuitem"
                      aria-label={item.ariaLabel}
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="w-[1em] h-[1em] text-current" />
                        {item.label}
                      </div>
                      <kbd 
                        className="inline-flex items-center justify-center flex-shrink-0 font-mono font-normal text-xs min-w-[1.75em] h-fit px-2 py-0.5 rounded bg-white/50 text-gray-700 backdrop-blur-sm"
                        aria-label={`快捷键 ${item.hotkey}`}
                      >
                        {item.hotkey}
                      </kbd>
                    </motion.button>
                  ))}
                  <motion.div className="h-[0.5px] bg-gray-200/40 mx-3 my-1" variants={itemVariants} />
                </div>
                <button
                  id={menuButtonId}
                  className="w-full flex items-center justify-center gap-2 text-[15px] font-semibold text-gray-800 rounded-full select-none transition-all duration-200 active:scale-95 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={handleMainButtonClick}
                  role="menuitem"
                  aria-label="关闭新建菜单"
                  tabIndex={0}
                >
                  <motion.div animate={{ rotate: 45 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
                    <PlusIcon className="w-5 h-5 text-gray-800" />
                  </motion.div>
                  <span>New</span>
                </button>
              </motion.div>
            </motion.div>
          ) : (
            // --- COLLAPSED BUTTON COMPONENT ---
            <motion.div
              key="button"
              className="pointer-events-auto"
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                id={menuButtonId}
                onClick={handleMainButtonClick}
                className="w-[92px] flex items-center justify-center gap-2 text-[15px] font-medium text-gray-800 rounded-3xl select-none transition-all duration-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{
                  ...commonStyles,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75))",
                }}
                aria-expanded={isExpanded}
                aria-haspopup="menu"
                aria-controls={isExpanded ? menuId : undefined}
                aria-label={AriaLabels.CREATE_NOTE}
                tabIndex={0}
              >
                <motion.div animate={{ rotate: 0 }} transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}>
                  <PlusIcon className="w-5 h-5 text-gray-800" />
                </motion.div>
                <span>New</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PhotoUploader open={photoUploaderOpen} onOpenChange={setPhotoUploaderOpen} onSubmit={handlePhotoSubmit} />
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