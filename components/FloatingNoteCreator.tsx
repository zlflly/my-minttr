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
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out"
        style={{
          transform: `translate(-50%, ${isExpanded ? '0.5rem' : '0'})`,
          opacity: 1
        }}
      >
        <div 
          className="rounded-3xl w-auto border-[0.5px] border-white/45 shadow-3 backdrop-blur-xl bg-sand-3 overflow-hidden pointer-events-auto max-w-[96%]"
          style={{
            padding: "0.5rem 1rem",
            width: isExpanded ? "374px" : "auto",
            minWidth: isExpanded ? "374px" : "auto"
          }}
        >
          <div style={{ opacity: 1, height: "auto", filter: "blur(0px)" }}>
            {isExpanded && (
              <div className="flex flex-col gap-1 py-2" style={{ opacity: 1 }}>
                <div className="text-sand-12 text-xs font-medium px-3">NEW</div>
                
                {noteTypes.map((noteType, index) => (
                  <div key={noteType.id} style={{ opacity: 1, transform: "none" }}>
                    <div 
                      className="text-[15px] font-medium text-sand-12 hover:bg-sand-a4 px-3 hover:px-4 py-1.5 rounded-full select-none transition-all duration-100 ease-out flex items-center justify-between gap-2 scale-effect cursor-pointer"
                      onClick={() => handleNoteTypeClick(noteType.id)}
                    >
                      <div className="flex items-center gap-2">
                        {noteType.icon}
                        {noteType.label}
                      </div>
                      <kbd className="rt-reset rt-Kbd bg-sand-a2 text-sand-12 inline-flex align-center justify-center flex-shrink-0 font-normal text-top whitespace-nowrap select-none relative font-size-[.75em] min-w-[1.75em] line-height-[1.7em] box-border px-[.5em] pb-[.05em] word-spacing-[-.1em] border-radius-[calc(var(--radius-factor) * .35em)] height-fit-content color-gray-12 bg-gray-1 box-shadow-[var(--kbd-box-shadow)] transition-[box-shadow .12s, background-color .12s]">
                        {noteType.hotkey}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-1 py-1 justify-center z-10 relative">
              <button 
                className="cursor-default w-full"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <div className="text-[15px] font-medium text-sand-12 hover:bg-sand-a4 px-3 py-1.5 rounded-full select-none transition duration-100 ease-out flex items-center gap-2 scale-effect w-full justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 256 256" 
                    className="w-[1em] h-[1em] text-current"
                    style={{
                      transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)",
                      transformOrigin: "50% 50%",
                      transition: "transform 0.2s ease-out"
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