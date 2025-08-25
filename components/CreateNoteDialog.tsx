"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogOverlay, DialogPortal, DialogTrigger, DialogTitle } from "@/components/ui/dialog"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link, FileText, Globe, Image, Tag, X } from "lucide-react"
import { createNote, extractMetadata, isValidUrl } from "@/lib/api"
import type { Note } from "@/lib/api"
import { cn } from "@/lib/utils"
import { getProxiedImageUrl } from "@/lib/image-proxy"
import { motion, AnimatePresence } from "framer-motion"

interface CreateNoteDialogProps {
  onNoteCreated: (note: Note) => void
  children: React.ReactNode
  initialTab?: "link" | "text"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function CreateNoteDialog({ 
  onNoteCreated, 
  children, 
  initialTab = "link",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: CreateNoteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"link" | "text">(initialTab)

  // 当 initialTab 变化时更新 activeTab 并清空表单
  useEffect(() => {
    setActiveTab(initialTab)
    // 当切换笔记类型时，清空表单数据
    resetForm()
  }, [initialTab])
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const [isLoading, setIsLoading] = useState(false)
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false)
  
  // 表单状态
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  
  // 元数据预览
  const [metadata, setMetadata] = useState<{
    title?: string
    description?: string
    image?: string
    favicon?: string
    domain?: string
  } | null>(null)

  // 重置表单
  const resetForm = () => {
    setUrl("")
    setTitle("")
    setDescription("")
    setContent("")
    setTags("")
    setMetadata(null)
  }

  // 添加状态跟踪是否成功创建
  const [wasSuccessfullyCreated, setWasSuccessfullyCreated] = useState(false)

  // 监听对话框关闭，清空表单（除非是成功创建后的关闭）
  useEffect(() => {
    if (!open) {
      // 如果不是成功创建后的关闭，则清空表单
      if (!wasSuccessfullyCreated) {
        resetForm()
      }
      // 重置成功创建标记
      setWasSuccessfullyCreated(false)
    }
  }, [open, wasSuccessfullyCreated])

  // 当对话框打开时，设置 contentEditable 的内容
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const editableDiv = document.querySelector('[contenteditable="true"][data-placeholder=" Add description (optional)"]') as HTMLDivElement
        if (editableDiv) {
          // 只有当 description 不为空时才设置内容，否则保持空状态以显示占位符
          if (description.trim()) {
            editableDiv.textContent = description
          } else {
            editableDiv.textContent = ""
          }
        }
      }, 100)
    }
  }, [open]) // 只在 open 状态变化时触发，不监听 description

  // 自动提取链接元数据
  useEffect(() => {
    if (activeTab === "link" && url && isValidUrl(url)) {
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
  }, [url, activeTab, title, description])

  // 平滑关闭动画处理
  const handleClose = () => {
    setOpen(false)
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const noteData = {
        type: activeTab.toUpperCase() as "LINK" | "TEXT",
        title: title.trim() || metadata?.title || undefined,
        description: description.trim() || metadata?.description || undefined,
        content: activeTab === "text" ? content.trim() : undefined,
        url: activeTab === "link" ? url.trim() : undefined,
        domain: metadata?.domain,
        faviconUrl: metadata?.favicon,
        imageUrl: metadata?.image,
        tags: tags.trim()
      }

      const response = await createNote(noteData)
      
      if (response.success && response.data) {
        onNoteCreated(response.data)
        // 标记为成功创建
        setWasSuccessfullyCreated(true)
        // 先重置表单，再关闭对话框
        resetForm()
        handleClose()
      } else {
        console.error("创建笔记失败:", response.error)
      }
    } catch (error) {
      console.error("创建笔记时出错:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
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
                创建笔记 - {activeTab === "link" ? "链接笔记" : "文本笔记"}
              </DialogTitle>
              
              <div className="bg-sand-1 rounded-t-xl shadow-border flex-1 max-h-[90vh] overflow-hidden flex flex-col mb-0">
                <div className="flex flex-col gap-2 max-h-full overflow-hidden flex-1 justify-between">
                  <div className="flex flex-col flex-1 overflow-hidden shadow-border rounded-xl">
          


                    {/* 主内容输入区域 */}
                    <form id="create-note-form" onSubmit={handleSubmit}>
                      {activeTab === "link" ? (
                        <>
                          {/* URL 输入区域 */}
                          <div className="bg-sand-2 px-3 py-2">
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
                          {metadata && (
                            <>
                              <div className="bg-sand-2 px-3 py-3">
                                <div className="flex gap-3 items-start">
                                  {metadata.image && (
                                    <img
                                      src={getProxiedImageUrl(metadata.image) || metadata.image}
                                      alt="预览"
                                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      {metadata.favicon && (
                                        <img src={getProxiedImageUrl(metadata.favicon) || metadata.favicon} alt="" className="w-4 h-4" />
                                      )}
                                      <span className="text-sm text-sand-11 truncate">{metadata.domain}</span>
                                    </div>
                                    <h4 className="font-medium text-sand-12 text-sm mb-1 line-clamp-2">
                                      {metadata.title}
                                    </h4>
                                    <p className="text-xs text-sand-11 line-clamp-2">
                                      {metadata.description}
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
                            data-placeholder=" Add description (optional)"
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
                          placeholder=" Add tags (separated by spaces)"
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
                      form="create-note-form"
                      disabled={isLoading || (activeTab === "link" && !url) || (activeTab === "text" && !content)}
                      className="px-4 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
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