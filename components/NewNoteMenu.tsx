'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, LinkIcon, MindIcon, PlusIcon, Grid3X3, Columns3 } from './PhotoIcons';
import PhotoUploader from './PhotoUploader';
import CreateNoteDialog from './CreateNoteDialog';
import { NewPhotoData } from '@/lib/photo-types';
import { Note, createNote } from '@/lib/api';
import type { CreateNoteData } from '@/lib/types';
import { 
  useAccessibility, 
  AriaLabels, 
  KeyboardKeys, 
  createAriaProps,
  FocusManager
} from '@/lib/accessibility';

// 布局类型
type LayoutType = 'grid' | 'waterfall'

interface NewNoteMenuProps {
  onNoteCreated: (note: Note) => void;
  onLayoutToggle?: () => void;
  currentLayout?: LayoutType;
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

const NewNoteMenu: React.FC<NewNoteMenuProps> = ({ 
  onNoteCreated, 
  onLayoutToggle, 
  currentLayout = 'grid' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false);
  const [createNoteOpen, setCreateNoteOpen] = useState(false);
  const [noteType, setNoteType] = useState<"link" | "text">("link");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const justClickedRef = useRef(false); // Ref to track click interaction
  const hasLeftMenuRef = useRef(false); // Ref to track if mouse has left menu area
  const menuRef = useRef<HTMLDivElement>(null);
  
  // 可访问性工具
  const { announce } = useAccessibility();
  
  // 使用 React 18 的 useId hook 生成稳定的 ID
  const id = useId();
  const menuId = `new-note-menu-${id}`;
  const menuButtonId = `menu-button-${id}`;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 处理主按钮点击
  const handleMainButtonClick = () => {
    justClickedRef.current = true;
    hasLeftMenuRef.current = false; // 点击时重置离开标记
    setIsExpanded(!isExpanded);
    
    if (!isExpanded) {
      announce('新建菜单已展开');
    } else {
      announce('新建菜单已关闭');
    }
  };

  // 处理鼠标进入
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // 只有在没有刚点击过 且 鼠标曾经离开过菜单区域 的情况下才自动展开
    if (!justClickedRef.current || hasLeftMenuRef.current) {
      setIsExpanded(true);
      announce('新建菜单已展开');
    }
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    hasLeftMenuRef.current = true; // 标记鼠标已离开
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (!justClickedRef.current || hasLeftMenuRef.current) {
        setIsExpanded(false);
        announce('新建菜单已关闭');
        justClickedRef.current = false; // 重置点击标记
      }
    }, 300);
  };

  // 处理对话框打开
  const openDialog = (type: "photo" | "link" | "text") => {
    if (type === "photo") {
      setPhotoUploaderOpen(true);
    } else {
      setNoteType(type);
      setCreateNoteOpen(true);
    }
    setIsExpanded(false);
    announce(`打开${type === "photo" ? "图片上传" : type === "link" ? "链接笔记" : "文本笔记"}对话框`);
  };

  // 处理图片提交
  const handlePhotoSubmit = useCallback(async (photoData: NewPhotoData) => {
    const startTime = Date.now();
    
    try {
      if (!photoData.file) {
        announce('No image file provided');
        return;
      }

      announce('开始上传图片...');

      // 首先上传图片到 Blob 存储
      const formData = new FormData();
      formData.append('file', photoData.file);

      const uploadResponse = await fetch('/api/blob', {
        method: 'POST',
        body: formData,
      });

      // 检查HTTP状态码
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`HTTP ${uploadResponse.status}: ${uploadResponse.statusText} - ${errorText}`);
        announce(`上传失败 (${uploadResponse.status}): ${uploadResponse.statusText}`);
        return;
      }

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        console.error("Failed to upload image:", uploadResult.error);
        const errorMsg = uploadResult.error?.message || uploadResult.error?.code || '未知错误';
        announce(`图片上传失败: ${errorMsg}`);
        return;
      }

      announce('图片上传成功，正在保存笔记...');

      // 使用上传后的 URL 创建笔记
      const newNote: CreateNoteData = {
        type: "IMAGE",
        title: photoData.note || "Image Note",
        content: photoData.note,
        imageUrl: uploadResult.data.url,
        tags: photoData.tags || "",
      };

      const response = await createNote(newNote);
      const totalTime = Date.now() - startTime;
      
      if (response.success && response.data) {
        onNoteCreated(response.data);
        announce(`图片笔记创建成功！用时 ${(totalTime / 1000).toFixed(1)} 秒`);
        setPhotoUploaderOpen(false); // 关闭上传对话框
      } else {
        console.error("Failed to create image note:", response.error);
        announce('笔记创建失败，请重试');
      }
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error("Error creating image note:", error);
      
      let errorMessage = '请检查网络连接';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      announce(`创建失败（用时 ${(totalTime / 1000).toFixed(1)} 秒）: ${errorMessage}`);
    }
  }, [onNoteCreated, announce]);

  // 处理布局切换
  const handleLayoutToggle = () => {
    if (onLayoutToggle) {
      onLayoutToggle();
      announce(`Switched to ${currentLayout === 'grid' ? 'Waterfall' : 'Grid'} layout`);
    }
  };

  // 菜单项配置
  const menuItems = [
    {
      id: "photo",
      type: "photo" as const,
      label: "Image",
      icon: ImageIcon,
      hotkey: "1",
      ariaLabel: "Create image note"
    },
    {
      id: "link",
      type: "link" as const,
      label: "Link",
      icon: LinkIcon,
      hotkey: "2",
      ariaLabel: "Create link note"
    },
    {
      id: "text",
      type: "text" as const,
      label: "Mind",
      icon: MindIcon,
      hotkey: "3",
      ariaLabel: "Create mind note"
    }
  ];

  // 键盘事件处理
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case KeyboardKeys.ESCAPE:
        event.preventDefault();
        setIsExpanded(false);
        announce('Menu closed');
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
        className="fixed bottom-6 z-50"
        style={{ left: '50vw', transform: 'translateX(-50%)' }}
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
                      className="w-full text-[15px] font-semibold text-gray-800 hover:bg-gray-200/60 active:bg-gray-300/50 px-3 hover:px-4 py-1.5 rounded-full select-none transition-all duration-100 ease-out flex items-center justify-between gap-2 scale-effect focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none"
                      style={{ outline: 'none', boxShadow: 'none' }}
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
                        aria-label={`Shortcut ${item.hotkey}`}
                      >
                        {item.hotkey}
                      </kbd>
                    </motion.button>
                  ))}
                  
                  {/* 布局切换按钮 */}
                  {onLayoutToggle && (
                    <>
                      <motion.div className="h-[0.5px] bg-gray-200/40 mx-3 my-1" variants={itemVariants} />
                      <motion.button
                        onClick={handleLayoutToggle}
                        className="w-full text-[15px] font-semibold text-gray-800 hover:bg-gray-200/60 active:bg-gray-300/50 px-3 hover:px-4 py-1.5 rounded-full select-none transition-all duration-100 ease-out flex items-center justify-between gap-2 scale-effect focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none"
                        style={{ outline: 'none', boxShadow: 'none' }}
                        variants={itemVariants}
                        role="menuitem"
                        aria-label={`Switch to ${currentLayout === 'grid' ? 'Waterfall' : 'Grid'} layout`}
                        tabIndex={0}
                      >
                        <div className="flex items-center gap-2">
                          {currentLayout === 'grid' ? (
                            <Columns3 className="w-[1em] h-[1em] text-current" />
                          ) : (
                            <Grid3X3 className="w-[1em] h-[1em] text-current" />
                          )}
                          {currentLayout === 'grid' ? 'Waterfall' : 'Grid'}
                        </div>
                        <kbd 
                          className="inline-flex items-center justify-center flex-shrink-0 font-mono font-normal text-xs min-w-[1.75em] h-fit px-2 py-0.5 rounded bg-white/50 text-gray-700 backdrop-blur-sm"
                          aria-label="Shortcut L"
                        >
                          L
                        </kbd>
                      </motion.button>
                    </>
                  )}
                  
                  <motion.div className="h-[0.5px] bg-gray-200/40 mx-3 my-1" variants={itemVariants} />
                </div>
                <button
                  id={menuButtonId}
                  className="w-full flex items-center justify-center gap-2 text-[15px] font-semibold text-gray-800 rounded-full select-none transition-all duration-200 active:scale-95 py-1.5 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none"
                  style={{ outline: 'none', boxShadow: 'none' }}
                  onClick={handleMainButtonClick}
                  role="menuitem"
                  aria-label="Close new note menu"
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
                className="w-[92px] flex items-center justify-center gap-2 text-[15px] font-medium text-gray-800 rounded-3xl select-none transition-all duration-200 px-4 py-2.5 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none"
                style={{
                  ...commonStyles,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75))",
                  outline: 'none',
                  boxShadow: commonStyles.boxShadow
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