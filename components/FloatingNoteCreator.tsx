"use client"

import React, { useState } from "react"
import CreateNoteDialog from "./CreateNoteDialog"
import type { Note } from "@/lib/api"

interface FloatingNoteCreatorProps {
  onNoteCreated: (note: Note) => void
}

export default function FloatingNoteCreator({ onNoteCreated }: FloatingNoteCreatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

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

  const handleNoteTypeClick = (type: string) => {
    if (type === "link") {
      setActiveDialog("link")
    } else if (type === "mind") {
      setActiveDialog("text")
    }
  }

  const handleDialogClose = () => {
    setActiveDialog(null)
    setIsExpanded(false)
  }

  const handleNoteCreated = (note: Note) => {
    onNoteCreated(note)
    handleDialogClose()
  }

  return (
    <>
      <div 
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out transform-gpu"
      >
        <div 
          className="rounded-3xl w-auto border-[0.5px] border-white/20 shadow-3 backdrop-blur-3xl overflow-hidden pointer-events-auto max-w-[96%] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu"
          style={{
            padding: "0.5rem 1rem",
            width: isExpanded ? "374px" : "auto",
            minWidth: isExpanded ? "374px" : "auto",
            background: "linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2), rgba(255,255,255,0.1))",
            backdropFilter: "blur(32px) saturate(200%) contrast(120%)",
            WebkitBackdropFilter: "blur(32px) saturate(200%) contrast(120%)",
            boxShadow: "0 16px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.2)"
          }}
        >
          <div style={{ opacity: 1, height: "auto", filter: "blur(0px)", overflow: "hidden" }}>
            {isExpanded && (
              <div 
                className="flex flex-col gap-1 py-2" 
                style={{ 
                  opacity: 1,
                  animation: "expandIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards"
                }}
              >
                <div className="text-white/90 text-xs font-medium px-3 transform translate-y-0 opacity-100 transition-all duration-500 ease-out" style={{ animationDelay: "0.1s" }}>NEW</div>
                
                {noteTypes.map((noteType, index) => (
                  <div 
                    key={noteType.id} 
                    className="transform translate-y-0 opacity-100" 
                    style={{ 
                      animation: `slideInUp 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards`,
                      animationDelay: `${0.2 + index * 0.1}s`,
                      opacity: 0,
                      transform: "translateY(20px)"
                    }}
                  >
                    <div 
                      className="text-[15px] font-medium text-white/90 hover:bg-white/10 active:bg-white/20 active:scale-95 px-3 hover:px-4 py-1.5 rounded-full select-none transition-all duration-300 ease-out flex items-center justify-between gap-2 cursor-pointer transform-gpu"
                      onClick={() => handleNoteTypeClick(noteType.id)}
                    >
                      <div className="flex items-center gap-2">
                        {noteType.icon}
                        {noteType.label}
                      </div>
                      <kbd className="rt-reset rt-Kbd bg-white/20 hover:bg-white/30 active:scale-95 text-white/90 inline-flex align-center justify-center flex-shrink-0 font-normal text-top whitespace-nowrap select-none relative font-size-[.75em] min-w-[1.75em] line-height-[1.7em] box-border px-[.5em] pb-[.05em] word-spacing-[-.1em] border-radius-[calc(var(--radius-factor) * .35em)] height-fit-content transition-all duration-300 ease-out transform-gpu">
                        {noteType.hotkey}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-1 py-1 justify-center z-10 relative">
              <button 
                className="cursor-default w-full active:scale-95 transition-all duration-300 ease-out transform-gpu"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <div className="text-[15px] font-medium text-white/90 hover:bg-white/10 active:bg-white/20 active:scale-95 px-3 py-1.5 rounded-full select-none transition-all duration-300 ease-out flex items-center gap-2 w-full justify-center cursor-pointer transform-gpu">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 256 256" 
                    className="w-[1em] h-[1em] text-current"
                    style={{
                      transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)",
                      transformOrigin: "50% 50%",
                      transition: "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)"
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
                  <span className="sm:inline hidden">New</span>
                </div>
              </button>
            </div>
          </div>
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