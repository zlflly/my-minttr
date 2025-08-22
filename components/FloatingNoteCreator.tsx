"use client"

import React, { useState, useEffect, useRef } from "react"
import CreateNoteDialog from "./CreateNoteDialog"
import type { Note } from "@/lib/api"

interface FloatingNoteCreatorProps {
  onNoteCreated: (note: Note) => void
}

export default function FloatingNoteCreator({ onNoteCreated }: FloatingNoteCreatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const noteTypes = [
    {
      id: "link",
      label: "Link",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-[1em] h-[1em] text-current">
          <rect width="256" height="256" fill="none"></rect>
          <path d="M141.38,64.68l11-11a46.62,46.62,0,0,1,65.94,0h0a46.62,46.62,0,0,1,0,65.94L193.94,144,183.6,154.34a46.63,46.63,0,0,1-66-.05h0A46.48,46.48,0,0,1,104,120.06" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
          <path d="M114.62,191.32l-11,11a46.63,46.63,0,0,1-66-.05h0a46.63,46.63,0,0,1,.06-65.89L72.4,101.66a46.62,46.62,0,0,1,65.94,0h0A46.45,46.45,0,0,1,152,135.94" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
        </svg>
      ),
      hotkey: "2", 
      description: "保存链接笔记"
    },
    {
      id: "mind",
      label: "Mind",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-[1em] h-[1em] text-current">
          <rect width="256" height="256" fill="none"></rect>
          <path d="M63.81,192.19c-47.89-79.81,16-159.62,151.64-151.64C223.43,176.23,143.62,240.08,63.81,192.19Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
          <line x1="160" y1="96" x2="40" y2="216" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
        </svg>
      ),
      hotkey: "1",
      description: "思维导图笔记"
    }
  ]

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isExpanded) return
      
      if (e.key === '1') {
        handleNoteTypeClick("mind")
      } else if (e.key === '2') {
        handleNoteTypeClick("link")
      } else if (e.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsExpanded(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false)
    }, 300) // 300ms延迟，避免误触
  }

  const handleNoteTypeClick = (type: string) => {
    if (type === "link") {
      setActiveDialog("link")
    } else if (type === "mind") {
      setActiveDialog("text")
    }
    setIsExpanded(false)
  }

  const handleDialogClose = () => {
    setActiveDialog(null)
    setIsExpanded(false)
  }

  const handleNoteCreated = (note: Note) => {
    onNoteCreated(note)
    handleDialogClose()
  }

  const handleMainButtonClick = () => {
    if (isExpanded) {
      setIsExpanded(false)
    }
  }

  return (
    <>
      <div 
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="relative rounded-3xl border-[0.5px] border-white/20 backdrop-blur-3xl overflow-hidden"
          style={{
            padding: isExpanded ? "0.5rem 1rem" : "0",
            width: isExpanded ? "320px" : "auto",
            minWidth: isExpanded ? "320px" : "auto",
            backgroundColor: "rgb(241,240,239)",
            backdropFilter: "blur(32px) saturate(200%) contrast(120%)",
            WebkitBackdropFilter: "blur(32px) saturate(200%) contrast(120%)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* 展开的菜单内容 */}
          {isExpanded && (
            <div 
              className="relative z-10 py-1"
              style={{
                animation: "fadeInUp 0.3s ease-out forwards"
              }}
            >
              <div 
                className="text-gray-500 text-xs font-medium px-3 mb-1.5 uppercase tracking-wider"
                style={{
                  opacity: 0,
                  animation: "fadeInUp 0.25s ease-out 0.05s forwards"
                }}
              >
                NEW
              </div>
              
              {noteTypes.map((noteType, index) => (
                <div 
                  key={noteType.id}
                  style={{
                    opacity: 0,
                    animation: `fadeInUp 0.25s ease-out ${0.1 + index * 0.06}s forwards`
                  }}
                >
                  <button
                    className="w-full text-[15px] font-medium text-gray-800 px-3 py-1.5 rounded-lg select-none flex items-center justify-between gap-2 transition-colors duration-200 hover:bg-black/5"
                    onClick={() => handleNoteTypeClick(noteType.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="opacity-70">
                        {noteType.icon}
                      </span>
                      <span>{noteType.label}</span>
                    </div>
                    <kbd className="bg-gray-200/60 text-gray-600 text-xs px-1.5 py-0.5 rounded font-mono">
                      {noteType.hotkey}
                    </kbd>
                  </button>
                </div>
              ))}
              
              {/* 更细的分隔线，间距更小 */}
              <div className="h-[0.5px] bg-gray-200/40 mx-3 my-1" />
            </div>
          )}
          
          {/* 主按钮 */}
          <button
            className={`w-full flex items-center justify-center gap-2 text-[15px] font-medium text-gray-800 rounded-full select-none transition-all duration-200 ${!isExpanded ? 'px-4 py-2.5 hover:bg-black/5' : 'py-1.5 hover:bg-black/5 cursor-pointer'}`}
            style={{
              backgroundColor: 'transparent',
            }}
            onClick={handleMainButtonClick}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 256 256" 
              className="w-5 h-5 text-gray-800 transition-transform duration-300"
              style={{
                transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)",
              }}
            >
              <rect width="256" height="256" fill="none"></rect>
              <line 
                x1="40" y1="128" x2="216" y2="128" 
                fill="none" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="24"
              />
              <line 
                x1="128" y1="40" x2="128" y2="216" 
                fill="none" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="24"
              />
            </svg>
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Dialogs */}
      {activeDialog && (
        <CreateNoteDialog 
          onNoteCreated={handleNoteCreated}
          initialTab={activeDialog as "link" | "text"}
          open={true}
          onOpenChange={handleDialogClose}
        >
          <div />
        </CreateNoteDialog>
      )}
    </>
  )
}