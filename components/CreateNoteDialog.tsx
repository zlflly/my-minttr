"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogOverlay, DialogPortal, DialogTrigger } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Link, FileText, Globe, Image, Palette, X } from "lucide-react"
import { createNote, extractMetadata, isValidUrl } from "@/lib/api"
import type { Note } from "@/lib/api"
import { cn } from "@/lib/utils"

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
  const ref = React.useRef<HTMLDivElement>(null)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const [isLoading, setIsLoading] = useState(false)
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false)
  
  // 表单状态
  const [url, setUrl] = useState("")
  const [content, setContent] = useState("")
  
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
    setContent("")
    setMetadata(null)
    setActiveTab(initialTab)
  }

  // 自动提取链接元数据
  useEffect(() => {
    if (activeTab === "link" && url && isValidUrl(url)) {
      const timer = setTimeout(async () => {
        setIsExtractingMetadata(true)
        try {
          const response = await extractMetadata(url)
          if (response.success && response.data) {
            setMetadata(response.data)
          }
        } catch (error) {
          console.error("提取元数据失败:", error)
        } finally {
          setIsExtractingMetadata(false)
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [url, activeTab])

  // 提交表单
  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const noteData = {
        type: activeTab.toUpperCase() as "LINK" | "TEXT",
        title: metadata?.title || undefined,
        description: metadata?.description || undefined,
        content: content.trim() || undefined,
        url: activeTab === "link" ? url.trim() : undefined,
        domain: metadata?.domain,
        faviconUrl: metadata?.favicon,
        imageUrl: metadata?.image,
        tags: ""
      }

      const response = await createNote(noteData)
      
      if (response.success && response.data) {
        onNoteCreated(response.data)
        setOpen(false)
        resetForm()
      } else {
        console.error("创建笔记失败:", response.error)
      }
    } catch (error) {
      console.error("创建笔记时出错:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = () => {
    if (activeTab === "link") {
      return url.trim() !== ""
    } else {
      return content.trim() !== ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-md fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-[50%] bottom-0 z-50 grid w-full max-w-2xl translate-x-[-50%] rounded-t-xl max-h-[90vh] overflow-hidden duration-500 ease-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-bottom-56 data-[state=open]:slide-in-from-bottom-56",
            "sm:max-w-2xl sm:bottom-0 sm:rounded-t-xl sm:rounded-b-xl"
          )}
          style={{ backgroundColor: 'var(--sand-1)' }}
        >
          {activeTab === "text" ? (
            // 文本笔记界面 - 基于新增笔记卡片.html
            <div className="flex flex-col max-h-full overflow-hidden flex-1 justify-between">
              <div className="flex flex-col gap-2 flex-1 min-h-16 overflow-auto px-4 my-2 mt-4">
                <div className="font-snpro" style={{ minHeight: '70px' }}>
                  <div className="relative">
                    <textarea
                      placeholder="What's on your mind?"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full min-h-16 bg-transparent border-none outline-none resize-none text-[15px] text-sand-12 placeholder:text-sand-9 font-snpro prose prose-zinc markdown-card subpixel-antialiased"
                      style={{ fontFamily: 'SN Pro, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif' }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between w-full px-2 items-center pb-2">
                <div className="transition-all duration-700 ease-in-out opacity-100 scale-100">
                  <button
                    onClick={() => setActiveTab("link")}
                    className="p-2 rounded-lg hover:bg-sand-3 transition-colors ml-0 -mt-1"
                  >
                    <Link className="w-[15px] h-[15px] text-sand-11" />
                  </button>
                </div>
                
                <div className="flex gap-2 items-center transition-all duration-700 ease-in-out opacity-100 scale-100">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !isFormValid()}
                    className="rt-reset rt-BaseButton rt-r-size-2 rt-variant-outline rt-Button shadow-none border border-sand-a8 hover:bg-sand-a2 active:bg-sand-a3 text-sand-a11 px-3 py-1 rounded-full text-sm font-medium"
                    data-accent-color="gray"
                    data-radius="full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Done"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // 链接笔记界面 - 基于新增链接卡片.html
            <div className="flex flex-col gap-2 max-h-full overflow-hidden flex-1 justify-between">
              <div className="flex flex-col flex-1 overflow-auto pt-2 shadow-border rounded-xl">
                <div className="px-3">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="Paste a link"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full p-3 bg-sand-a3 border-none outline-none text-[15px] text-sand-12 placeholder:text-sand-9 rounded-lg"
                      spellCheck={false}
                    />
                    {isExtractingMetadata && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-sand-9" />
                    )}
                  </div>
                </div>
                
                {/* 分隔线 */}
                <div 
                  className="h-[0.5px] mx-3 my-2"
                  style={{
                    backgroundImage: 'linear-gradient(to right, var(--sand-a6) 50%, transparent 50%)',
                    backgroundSize: '12px 12px',
                    backgroundRepeat: 'repeat-x'
                  }} 
                />
                
                {/* 笔记编辑区域 */}
                <div className="bg-mi-amber-2 rounded-b-xl px-3 py-2 mx-3">
                  <div className="font-snpro" style={{ minHeight: '70px' }}>
                    <textarea
                      placeholder="Write a note"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full min-h-16 bg-transparent border-none outline-none resize-none text-[15px] text-sand-12 placeholder:text-sand-9 prose prose-zinc markdown-card subpixel-antialiased"
                      style={{ fontFamily: 'SN Pro, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif' }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end items-center w-full px-2 pb-2">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !isFormValid()}
                  className="rt-reset rt-BaseButton rt-r-size-2 rt-variant-outline rt-Button shadow-none border border-sand-a8 hover:bg-sand-a2 active:bg-sand-a3 text-sand-a11 px-3 py-1 rounded-full text-sm font-medium"
                  data-accent-color="gray"
                  data-radius="full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Done"
                  )}
                </button>
              </div>
            </div>
          )}
          
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4 text-sand-11" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}