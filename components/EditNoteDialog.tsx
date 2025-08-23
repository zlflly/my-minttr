"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link, FileText, Globe, Image, Tag, X } from "lucide-react"
import { updateNote, extractMetadata, isValidUrl } from "@/lib/api"
import type { Note } from "@/lib/api"
import { cn } from "@/lib/utils"
import { getProxiedImageUrl } from "@/lib/image-proxy"
import { motion, AnimatePresence } from 'framer-motion'

interface EditNoteDialogProps {
  note: Note
  onNoteUpdated: (note: Note) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditNoteDialog({ 
  note, 
  onNoteUpdated, 
  open, 
  onOpenChange 
}: EditNoteDialogProps) {
  const [activeTab, setActiveTab] = useState<"link" | "text">(note.type.toLowerCase() as "link" | "text")

  // 当 note 类型变化时更新 activeTab
  useEffect(() => {
    setActiveTab(note.type.toLowerCase() as "link" | "text")
  }, [note.type])
  const [isLoading, setIsLoading] = useState(false)
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false)
  
  // 表单状态
  const [url, setUrl] = useState(note.url || "")
  const [title, setTitle] = useState(note.title || "")
  const [description, setDescription] = useState(note.description || "")
  const [content, setContent] = useState(note.content || "")
  const [tags, setTags] = useState(note.tags || "")
  
  // 元数据预览
  const [metadata, setMetadata] = useState<{
    title?: string
    description?: string
    image?: string
    favicon?: string
    domain?: string
  } | null>(null)

  // 重置表单到初始状态
  const resetForm = useCallback(() => {
    setUrl(note.url || "")
    setTitle(note.title || "")
    setDescription(note.description || "")
    setContent(note.content || "")
    setTags(note.tags || "")
    setMetadata(null)
    setIsLoading(false)
    setIsExtractingMetadata(false)
  }, [note])

  // 统一的关闭处理函数 - 确保完全清理
  const handleClose = useCallback(() => {
    setIsLoading(false)
    setIsExtractingMetadata(false)
    
    // 立即清理可能的样式污染
    document.body.style.pointerEvents = ''
    document.body.style.userSelect = ''
    
    // 确保没有残留的模态层
    const existingBackdrops = document.querySelectorAll('[data-radix-dialog-overlay]')
    existingBackdrops.forEach(backdrop => {
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop)
      }
    })
    
    onOpenChange(false)
  }, [onOpenChange])

  // 监听对话框关闭，确保完全重置状态
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        resetForm()
        // 强制清理任何可能残留的样式和事件监听器
        document.body.style.pointerEvents = ''
        document.body.style.userSelect = ''
      }, 500) // 确保动画完全完成
      return () => clearTimeout(timer)
    } else {
      // 当对话框打开时，设置 contentEditable 的内容
      setTimeout(() => {
        const editableDiv = document.querySelector('[contenteditable="true"][data-placeholder=" Edit description (optional)"]') as HTMLDivElement
        if (editableDiv) {
          // 只有当 description 不为空时才设置内容，否则保持空状态以显示占位符
          if (note.description && note.description.trim()) {
            editableDiv.textContent = note.description
          } else {
            editableDiv.textContent = ""
          }
        }
      }, 100)
    }
  }, [open, resetForm]) // 移除对 note.description 的监听，避免光标重置

  // 当笔记变化时重置表单
  useEffect(() => {
    if (open) {
      resetForm()
      // 当笔记ID变化时，重新初始化 contentEditable 内容
      setTimeout(() => {
        const editableDiv = document.querySelector('[contenteditable="true"][data-placeholder=" Edit description (optional)"]') as HTMLDivElement
        if (editableDiv) {
          if (note.description && note.description.trim()) {
            editableDiv.textContent = note.description
          } else {
            editableDiv.textContent = ""
          }
        }
      }, 150) // 稍微延迟一点，确保 resetForm 完成
    }
  }, [note.id, open, resetForm])



  // 自动提取链接元数据
  useEffect(() => {
    if (activeTab === "link" && url && isValidUrl(url) && url !== note.url) {
      const timer = setTimeout(async () => {
        setIsExtractingMetadata(true)
        try {
          const response = await extractMetadata(url)
          if (response.success && response.data) {
            setMetadata(response.data)
            if (!title) setTitle(response.data.title)
            if (!description) setDescription(response.data.description)
          }
        } catch (error) {
          console.error("提取元数据失败:", error)
        } finally {
          setIsExtractingMetadata(false)
        }
      }, 500) // 延迟500ms避免频繁请求

      return () => clearTimeout(timer)
    }
  }, [url, activeTab, title, description, note.url])

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 准备更新数据
      const updateData: Partial<Note> = {
        type: activeTab.toUpperCase() as "LINK" | "TEXT",
        title: title.trim() || metadata?.title || undefined,
        description: description.trim() || metadata?.description || undefined,
        tags: tags.trim()
      }

      // 根据类型添加特定字段
      if (activeTab === "text") {
        updateData.content = content.trim()
        // 清除链接相关字段
        updateData.url = undefined
        updateData.domain = undefined
        updateData.faviconUrl = undefined
        updateData.imageUrl = undefined
      } else {
        updateData.url = url.trim()
        updateData.domain = metadata?.domain || note.domain
        updateData.faviconUrl = metadata?.favicon || note.faviconUrl
        updateData.imageUrl = metadata?.image || note.imageUrl
        // 清除文本内容
        updateData.content = undefined
      }

      const response = await updateNote(note.id, updateData)
      
      if (response.success && response.data) {
        onNoteUpdated(response.data)
        setIsLoading(false) // 先清理加载状态
        onOpenChange(false) // 再关闭对话框
      } else {
        console.error("更新笔记失败:", response.error)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("更新笔记时出错:", error)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <AnimatePresence>
        {open && (
      <DialogPortal>
            <DialogOverlay asChild>
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
            </DialogOverlay>
            
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
          <DialogTitle className="sr-only">
            编辑笔记 - {activeTab === "link" ? "链接笔记" : "文本笔记"}
          </DialogTitle>
          
          <div className="bg-sand-1 rounded-t-xl shadow-border flex-1 max-h-[90vh] overflow-hidden flex flex-col mb-0">
            <div className="flex flex-col gap-2 max-h-full overflow-hidden flex-1 justify-between">
              <div className="flex flex-col flex-1 overflow-hidden shadow-border rounded-xl">


                {/* 主内容输入区域 */}
                <form id="edit-note-form" onSubmit={handleSubmit}>
                {activeTab === "link" ? (
                  <>
                      {/* URL 输入区域 */}
                      <div className="bg-sand-2 px-3 py-2 relative">
                        <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                          placeholder=" Paste a link"
                          className="w-full text-[15px] bg-transparent text-sand-12 placeholder-sand-9 focus:outline-none"
                        required
                      />
                      {isExtractingMetadata && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-sand-9" />
                        </div>
                      )}
                    </div>
                    
                      {/* Divider */}
                      <div className="dash-sand-a6 bg-dash-6 h-[0.5px] bg-repeat-x"></div>
                      
                      {/* 元数据预览 */}
                    {(metadata || note.imageUrl) && (
                        <>
                          <div className="bg-sand-2 px-3 py-3">
                            <div className="flex gap-3 items-start">
                            {(metadata?.image || note.imageUrl) && (
                                  <img
                                    src={getProxiedImageUrl(metadata?.image || note.imageUrl || '') || metadata?.image || note.imageUrl || ''}
                                    alt="预览"
                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                  />
                            )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                {(metadata?.favicon || note.faviconUrl) && (
                                    <img src={getProxiedImageUrl(metadata?.favicon || note.faviconUrl || '') || metadata?.favicon || note.faviconUrl || ''} alt="" className="w-4 h-4" />
                                )}
                                  <span className="text-sm text-sand-11 truncate">{metadata?.domain || note.domain}</span>
                              </div>
                                <h4 className="font-medium text-sand-12 text-sm mb-1 line-clamp-2">
                                {metadata?.title || note.title}
                              </h4>
                                <p className="text-xs text-sand-11 line-clamp-2">
                                {metadata?.description || note.description}
                              </p>
                            </div>
                          </div>
                        </div>
                          
                          {/* Divider */}
                          <div className="dash-sand-a6 bg-dash-6 h-[0.5px] bg-repeat-x"></div>
                        </>
                    )}
                  </>
                ) : (
                  <>
                      {/* 文本内容输入区域 */}
                      <div className="bg-sand-2 px-3 py-2">
                        <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                          placeholder=" Write your note here..."
                          className="w-full min-h-[120px] text-[15px] bg-transparent text-sand-12 placeholder-sand-9 focus:outline-none resize-none"
                        required
                      />
                      </div>
                      
                      {/* Divider */}
                      <div className="dash-sand-a6 bg-dash-6 h-[0.5px] bg-repeat-x"></div>
                  </>
                )}
                  
                  {/* Note input */}
                  <div className="bg-mi-amber-2 text-sand-11 px-3 py-2">
                    <div className="font-snpro" style={{ minHeight: '70px' }}>
                      <div 
                        contentEditable
                        className="prose text-[15px] max-w-full prose-zinc text-sand-12 focus:outline-none prose-li:marker:text-sand-11 subpixel-antialiased"
                        style={{ minHeight: '70px' }}
                        onInput={(e) => {
                          const target = e.target as HTMLDivElement
                          setDescription(target.textContent || '')
                        }}
                        suppressContentEditableWarning={true}
                        data-placeholder=" Edit description (optional)"
                  />
                </div>
                </div>

                  {/* 细细的分隔线 */}
                  <div className="h-[1px] bg-gray-200"></div>
                  
                  {/* 标签输入区域 */}
                  <div className="bg-blue-50 px-3 py-2" style={{ height: '35px' }}>
                    <input
                      type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                      placeholder=" Edit tags (separated by spaces)"
                      className="w-full text-[13px] bg-transparent text-gray-600 placeholder-gray-400 focus:outline-none"
                      autoFocus={false}
                      tabIndex={-1}
                    />
                        </div>
                </form>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end items-center w-full px-2 mt-2 pb-2">
                <motion.button 
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  type="button"
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
                  type="submit"
                  form="edit-note-form"
                  disabled={isLoading || (activeTab === "link" && !url) || (activeTab === "text" && !content)}
                  className="px-4 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Done'
                  )}
                </motion.button>
              </div>
            </div>
          </div>
            </motion.div>
      </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  )
}