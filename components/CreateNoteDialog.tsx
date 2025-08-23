"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogOverlay, DialogPortal, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [isTransitioning, setIsTransitioning] = useState(false)
  
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
    setActiveTab(initialTab)
  }

  // 平滑切换标签 - 使用对称快速模糊过渡
  const handleTabChange = (value: string) => {
    const newTab = value as "link" | "text"
    if (newTab === activeTab || isTransitioning) return
    
    setIsTransitioning(true)
    
    // 模糊阶段 (80ms) - 在此期间切换内容
    setTimeout(() => {
      setActiveTab(newTab)
    }, 40) // 在模糊的中间时刻切换内容
    
    // 清晰化完成后结束过渡 (80ms + 80ms = 160ms)
    setTimeout(() => {
      setIsTransitioning(false)
    }, 160)
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
        // 使用平滑关闭动画
        handleClose()
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
              className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md sm:max-w-[min(680px,95vw)] mx-auto"
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
              
              <div 
                className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-t-3xl shadow-2xl ring-1 ring-gray-200/50 ring-inset relative overflow-hidden max-h-[90vh] flex flex-col"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 -25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                {/* 光泽效果 */}
                <div className="absolute inset-0 rounded-t-3xl bg-gradient-to-t from-transparent via-white/10 to-white/30 pointer-events-none" />
                
                <div className="relative p-4 sm:p-6 overflow-y-auto flex-1">
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="relative mb-4 sm:mb-6">
              <TabsList className="grid w-full grid-cols-2 h-12 sm:h-14 p-2 bg-gray-100/80 rounded-2xl shadow-inner border border-gray-200/50 backdrop-blur-sm">
                <TabsTrigger 
                  value="link" 
                  className="flex items-center gap-2 sm:gap-3 h-8 sm:h-10 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 hover:scale-[0.98] active:scale-95 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200/30 data-[state=active]:text-blue-700 data-[state=active]:border data-[state=active]:border-blue-200/50"
                >
                  <div className="p-1 sm:p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 data-[state=active]:from-blue-100 data-[state=active]:to-blue-200">
                    <Link className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  </div>
                  链接笔记
                </TabsTrigger>
                <TabsTrigger 
                  value="text" 
                  className="flex items-center gap-2 sm:gap-3 h-8 sm:h-10 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 hover:scale-[0.98] active:scale-95 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-200/30 data-[state=active]:text-green-700 data-[state=active]:border data-[state=active]:border-green-200/50"
                >
                  <div className="p-1 sm:p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-100 data-[state=active]:from-green-100 data-[state=active]:to-green-200">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                  文本笔记
                </TabsTrigger>
              </TabsList>
            </div>

            <form onSubmit={handleSubmit} className={cn(
              "space-y-4 sm:space-y-6 overflow-hidden",
              isTransitioning && activeTab === "text" && "form-to-text",
              isTransitioning && activeTab === "link" && "form-to-link"
            )}>
              {/* 主内容区域 - 根据标签动态切换 */}
              <div className={cn(
                "space-y-3",
                isTransitioning && "content-blur-out",
                !isTransitioning && "content-clear-in"
              )}>
                {activeTab === "link" ? (
                  <>
                    <Label htmlFor="url" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      链接地址
                    </Label>
                    <div className="relative group">
                      <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10">
                        <div className="p-1 sm:p-1.5 rounded-lg bg-blue-50 group-focus-within:bg-blue-100 transition-colors">
                          <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                      </div>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="pl-12 sm:pl-14 pr-10 sm:pr-12 h-10 sm:h-12 text-xs sm:text-sm md:text-base rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-inner hover:border-blue-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 w-full focus-visible:outline-none focus-visible:ring-offset-0 focus-visible:ring-0"
                        style={{ 
                          textOverflow: 'ellipsis',
                          fontSize: 'clamp(12px, 2.5vw, 15px)',
                          minWidth: 0
                        }}
                        required
                      />
                      {isExtractingMetadata && (
                        <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                          <div className="p-1 sm:p-1.5 rounded-lg bg-gray-50">
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-gray-600" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {metadata && (
                      <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/50 to-white/80 backdrop-blur-sm overflow-hidden shadow-inner">
                        <div className="p-4 sm:p-6">
                          <div className="flex gap-3 sm:gap-4 min-w-0 overflow-hidden">
                            {metadata.image && (
                              <div className="flex-shrink-0">
                                <div className="relative">
                                  <img
                                    src={getProxiedImageUrl(metadata.image) || metadata.image}
                                    alt="预览"
                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shadow-sm ring-1 ring-black/5"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl"></div>
                                </div>
                              </div>
                            )}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-2 mb-2 min-w-0 max-w-full">
                                {metadata.favicon && (
                                  <div className="p-1 rounded-md bg-white shadow-sm flex-shrink-0">
                                    <img src={getProxiedImageUrl(metadata.favicon) || metadata.favicon} alt="" className="w-4 h-4" />
                                  </div>
                                )}
                                <span className="text-sm font-medium text-blue-600 truncate flex-1 min-w-0 max-w-[200px]">{metadata.domain}</span>
                              </div>
                              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base leading-tight" 
                                  style={{ 
                                    display: '-webkit-box', 
                                    WebkitLineClamp: 2, 
                                    WebkitBoxOrient: 'vertical', 
                                    overflow: 'hidden',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word'
                                  }}>
                                {metadata.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed" 
                                 style={{ 
                                   display: '-webkit-box', 
                                   WebkitLineClamp: 3, 
                                   WebkitBoxOrient: 'vertical', 
                                   overflow: 'hidden',
                                   wordBreak: 'break-word',
                                   overflowWrap: 'break-word'
                                 }}>
                                {metadata.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Label htmlFor="content" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      笔记内容
                    </Label>
                    <div className="relative group">
                      <Textarea
                        id="content"
                        placeholder="开始写下你的想法... 支持 Markdown 格式、数学公式 ($\\LaTeX$) 和代码高亮"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[120px] sm:min-h-[140px] p-3 sm:p-4 text-sm sm:text-base rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-inner hover:border-green-300 focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-200 resize-none leading-relaxed focus-visible:outline-none focus-visible:ring-offset-0 focus-visible:ring-0"
                        required
                      />
                      <div className="absolute top-3 right-3 opacity-20 group-focus-within:opacity-40 transition-opacity">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 通用字段 */}
              <div className="space-y-4 pt-3 border-t border-gray-200">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    标题（可选）
                  </Label>
                  <Input
                    id="title"
                    placeholder={activeTab === "link" ? "自定义标题，留空使用网页标题" : "为你的笔记添加标题"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm md:text-base rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-inner hover:border-purple-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-offset-0 focus-visible:ring-0 w-full"
                    style={{ 
                      textOverflow: 'ellipsis',
                      fontSize: 'clamp(12px, 2.5vw, 15px)',
                      minWidth: 0
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    描述（可选）
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={activeTab === "link" ? "自定义描述，留空使用网页描述" : "添加一些描述信息"}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[70px] sm:min-h-[80px] p-3 sm:p-4 text-sm sm:text-base rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-inner hover:border-orange-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-200 resize-none leading-relaxed focus-visible:outline-none focus-visible:ring-offset-0 focus-visible:ring-0"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tags" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <Tag className="h-4 w-4 text-pink-600" />
                    标签（可选）
                  </Label>
                  <Input
                    id="tags"
                    placeholder="用逗号、中文逗号或空格分隔多个标签，如：工作,学习,想法 或 工作，学习 想法"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm md:text-base rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm shadow-inner hover:border-pink-300 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-offset-0 focus-visible:ring-0 w-full"
                    style={{ 
                      textOverflow: 'ellipsis',
                      fontSize: 'clamp(12px, 2.5vw, 15px)',
                      minWidth: 0
                    }}
                  />
                  {tags && (
                    <div className="flex flex-wrap gap-2 mt-3 max-w-full overflow-hidden">
                      {tags.split(/[,，\\s]+/).filter(tag => tag.trim()).slice(0, 10).map((tag, index) => (
                        <div key={index} className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 text-xs sm:text-sm font-medium shadow-sm ring-1 ring-pink-200/50 max-w-[120px] sm:max-w-[160px]">
                          <span className="truncate">{tag.trim()}</span>
                        </div>
                      ))}
                      {tags.split(/[,，\\s]+/).filter(tag => tag.trim()).length > 10 && (
                        <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gray-100 text-gray-500 text-xs sm:text-sm font-medium">
                          +{tags.split(/[,，\\s]+/).filter(tag => tag.trim()).length - 10}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200 pb-2 sm:pb-0">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 sm:w-auto px-4 sm:px-6 py-3 h-10 sm:h-12 rounded-xl border-2 border-gray-300 bg-white/80 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm sm:text-base order-1"
                  >
                    取消
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading || (activeTab === "link" && !url) || (activeTab === "text" && !content)}
                    className="flex-1 sm:w-auto min-w-[120px] px-4 sm:px-6 py-3 h-10 sm:h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200/50 border-0 transition-all duration-200 font-semibold text-sm sm:text-base order-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      <>
                        <div className="mr-2 p-1 rounded-md bg-white/20">
                          <FileText className="h-4 w-4" />
                        </div>
                        创建笔记
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </form>
          </Tabs>
                </div>
              </div>
            </motion.div>
          </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  )
}