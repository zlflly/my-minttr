"use client"

import React, { useState, useEffect, useCallback } from "react"
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { updateNote } from "@/lib/api"
import type { Note } from "@/lib/api"
import type { PhotoNote } from "@/lib/photo-types"

interface PhotoEditDialogProps {
  note: Note
  photoNote: PhotoNote
  onNoteUpdated?: (note: Note) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PhotoEditDialog({ 
  note, 
  photoNote,
  onNoteUpdated, 
  open, 
  onOpenChange 
}: PhotoEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState(photoNote.note || "")
  const [tags, setTags] = useState(note.tags || "")

  // 当对话框打开时重置表单
  useEffect(() => {
    if (open) {
      setContent(photoNote.note || "")
      setTags(note.tags || "")
    }
  }, [open, photoNote.note, note.tags])

  // 平滑关闭动画处理
  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // 提交表单
  const handleSubmit = useCallback(async () => {
    setIsLoading(true)

    try {
      const updateData: Partial<Note> = {
        content: content.trim() || undefined,
        title: content.trim() ? (content.trim().slice(0, 50) + (content.trim().length > 50 ? '...' : '')) : note.title,
        tags: tags.trim()
      }

      const response = await updateNote(note.id, updateData)
      
      if (response.success && response.data) {
        onNoteUpdated?.(response.data)
        handleClose()
      } else {
        console.error("更新图片笔记失败:", response.error)
      }
    } catch (error) {
      console.error("更新图片笔记时出错:", error)
    } finally {
      setIsLoading(false)
    }
  }, [content, tags, note.id, note.title, onNoteUpdated, handleClose])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      // Reset form when closing
      setContent(photoNote.note || "")
      setTags(note.tags || "")
    }
    onOpenChange(open)
  }, [onOpenChange, photoNote.note, note.tags])

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
                {/* DialogTitle for accessibility */}
                <Dialog.Title className="sr-only">
                  编辑图片笔记
                </Dialog.Title>
                
                <div className="bg-sand-1 rounded-t-xl shadow-border flex-1 max-h-[90vh] overflow-hidden flex flex-col mb-0">
                  <div className="flex flex-col gap-2 max-h-full overflow-hidden flex-1 justify-between">
                    <div className="flex flex-col flex-1 overflow-hidden shadow-border rounded-xl">
                      {/* Image display area */}
                      <div className="w-full min-h-[312px] flex items-center justify-center flex-col gap-2 overflow-hidden relative border-dashed border-2 border-sand-6">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img 
                            src={photoNote.imageUrl} 
                            alt={photoNote.imageAlt || "图片"} 
                            className="max-w-full max-h-[280px] object-contain rounded-lg"
                          />
                        </div>
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
                              const target = e.target as HTMLDivElement
                              setContent(target.textContent || '')
                            }}
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{ __html: content }}
                            data-placeholder="Edit note for this image"
                          />
                        </div>
                      </div>
                      
                      {/* 细细的分隔线 */}
                      <div className="h-[1px] bg-gray-200"></div>
                      
                      {/* 浅蓝色标签编辑区域 */}
                      <div className="bg-blue-50 px-3 py-2 rounded-b-xl" style={{ height: '35px' }}>
                        <input
                          type="text"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          placeholder="Edit tags (separated by spaces)"
                          className="w-full text-[13px] bg-transparent text-gray-600 placeholder-gray-400 focus:outline-none"
                          autoFocus={false}
                          tabIndex={-1}
                        />
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 justify-end items-center w-full px-2 mt-2 pb-2">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-sand-11 hover:text-sand-12 hover:bg-sand-a3 rounded-full transition"
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium bg-sand-9 text-sand-1 hover:bg-sand-10 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition"
                      >
                        {isLoading ? 'Updating...' : 'Done'}
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
  )
}