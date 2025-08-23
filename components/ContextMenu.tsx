"use client"

import React, { useState } from "react"
import * as ContextMenu from "@radix-ui/react-context-menu"
import { cn } from "@/lib/utils"
import type { Note } from "@/lib/api"

interface ContextMenuProps {
  children: React.ReactNode
  note: Note
  onHide: () => void
  onDelete: () => void
  onColorChange: (color: "default" | "pink" | "blue" | "green") => void
}

export default function NoteContextMenu({ children, note, onHide, onDelete, onColorChange }: ContextMenuProps) {
  const [showColorMenu, setShowColorMenu] = useState(false)
  
  const colors = [
    { id: "default" as const, name: "Default", style: { backgroundColor: "rgb(243 244 246)" } },
    { id: "pink" as const, name: "Pink", style: { backgroundColor: "rgb(253 218 230)" } },
    { id: "blue" as const, name: "Blue", style: { backgroundColor: "rgb(201 230 253)" } },
    { id: "green" as const, name: "Green", style: { backgroundColor: "rgb(210 244 215)" } },
  ]
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content 
          className={cn(
            "rt-BaseMenuViewport rt-ContextMenuViewport",
            "bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50",
            "min-w-[160px] animate-in fade-in-0 zoom-in-95 duration-200"
          )}
        >
          <ContextMenu.Item
            className={cn(
              "rt-reset rt-BaseMenuItem rt-ContextMenuItem",
              "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
              "hover:bg-gray-100 focus:bg-gray-100 rounded",
              "outline-none select-none transition-colors"
            )}
            onClick={onHide}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="1em" 
              height="1em" 
              fill="currentColor" 
              viewBox="0 0 256 256"
              className="w-4 h-4"
            >
              <path d="M228,175a8,8,0,0,1-10.92-3l-19-33.2A123.23,123.23,0,0,1,162,155.46l5.87,35.22a8,8,0,0,1-6.58,9.21A8.4,8.4,0,0,1,160,200a8,8,0,0,1-7.88-6.69l-5.77-34.58a133.06,133.06,0,0,1-36.68,0l-5.77,34.58A8,8,0,0,1,96,200a8.4,8.4,0,0,1-1.32-.11,8,8,0,0,1-6.58-9.21L94,155.46a123.23,123.23,0,0,1-36.06-16.69L39,172A8,8,0,1,1,25.06,164l20-35a153.47,153.47,0,0,1-19.3-20A8,8,0,1,1,38.22,99c16.6,20.54,45.64,45,89.78,45s73.18-24.49,89.78-45A8,8,0,1,1,230.22,109a153.47,153.47,0,0,1-19.3,20l20,35A8,8,0,0,1,228,175Z"/>
            </svg>
            {note.isHidden ? "Show" : "Hide"}
          </ContextMenu.Item>

          <ContextMenu.Sub>
            <ContextMenu.SubTrigger
              className={cn(
                "rt-reset rt-BaseMenuItem rt-ContextMenuItem",
                "flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer",
                "hover:bg-gray-100 focus:bg-gray-100 rounded",
                "outline-none select-none transition-colors"
              )}
            >
              <div className="flex items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="1em" 
                  height="1em" 
                  fill="currentColor" 
                  viewBox="0 0 256 256"
                  className="w-4 h-4"
                >
                  <path d="M201.54,54.46A104,104,0,0,0,54.46,201.54,104,104,0,0,0,201.54,54.46ZM190.23,65.78a88.15,88.15,0,0,1,0,124.44ZM65.77,65.78,190.23,190.22a88.15,88.15,0,0,1-124.46,0A88.15,88.15,0,0,1,65.77,65.78Z"/>
                </svg>
                Colour
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="1em" 
                height="1em" 
                fill="currentColor" 
                viewBox="0 0 256 256"
                className="w-3 h-3"
              >
                <path d="m181.66,133.66-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>
              </svg>
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent 
                className={cn(
                  "rt-BaseMenuViewport rt-ContextMenuViewport",
                  "bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-50",
                  "min-w-[140px] animate-in fade-in-0 zoom-in-95 duration-200"
                )}
              >
                {colors.map((color) => (
                  <ContextMenu.Item
                    key={color.id}
                    className={cn(
                      "rt-reset rt-BaseMenuItem rt-ContextMenuItem",
                      "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
                      "hover:bg-gray-100 focus:bg-gray-100 rounded",
                      "outline-none select-none transition-colors"
                    )}
                    onClick={() => onColorChange(color.id)}
                  >
                    <div style={color.style} className="w-4 h-4 rounded-full border border-gray-200" />
                    <span>{color.name}</span>
                    {note.color === color.id && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="1em" 
                        height="1em" 
                        fill="currentColor" 
                        viewBox="0 0 256 256"
                        className="w-3 h-3 ml-auto text-green-600"
                      >
                        <path d="m229.66,77.66-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
                      </svg>
                    )}
                  </ContextMenu.Item>
                ))}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          <ContextMenu.Separator 
            className={cn(
              "rt-BaseMenuSeparator rt-ContextMenuSeparator",
              "h-[0.5px] my-1 bg-gray-200"
            )}
          />

          <ContextMenu.Item
            className={cn(
              "rt-reset rt-BaseMenuItem rt-ContextMenuItem",
              "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
              "hover:bg-red-50 focus:bg-red-50 hover:text-red-600 focus:text-red-600 rounded",
              "outline-none select-none transition-colors"
            )}
            onClick={onDelete}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="1em" 
              height="1em" 
              fill="currentColor" 
              viewBox="0 0 256 256"
              className="w-4 h-4"
            >
              <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/>
            </svg>
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}