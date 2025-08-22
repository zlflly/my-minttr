"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogOverlay, DialogPortal, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link, FileText, Globe, Image, Tag, X } from "lucide-react"
import { createNote, extractMetadata, isValidUrl } from "@/lib/api"
import type { Note } from "@/lib/api"
import { cn } from "@/lib/utils"
import { getProxiedImageUrl } from "@/lib/image-proxy"

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="bg-black/80 backdrop-blur-md fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-[50%] bottom-0 z-50 grid w-full max-w-[600px] translate-x-[-50%] gap-4 border p-6 shadow-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto duration-500 ease-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-bottom-56 data-[state=open]:slide-in-from-bottom-56",
            "sm:max-w-[600px] sm:bottom-0 sm:rounded-t-3xl"
          )}
          style={{ backgroundColor: 'rgb(241,240,239)' }}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5" />
              创建新笔记
            </DialogTitle>
          </div>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "link" | "text")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                链接笔记
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                文本笔记
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6">
              <TabsContent value="link" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">链接地址</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-10"
                      required
                    />
                    {isExtractingMetadata && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                {metadata && (
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {metadata.image && (
                          <div className="flex-shrink-0">
                            <img
                              src={getProxiedImageUrl(metadata.image) || metadata.image}
                              alt="预览"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {metadata.favicon && (
                              <img src={getProxiedImageUrl(metadata.favicon) || metadata.favicon} alt="" className="w-4 h-4" />
                            )}
                            <span className="text-sm text-muted-foreground">{metadata.domain}</span>
                          </div>
                          <h4 className="font-medium truncate">{metadata.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{metadata.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">笔记内容</Label>
                  <Textarea
                    id="content"
                    placeholder="开始写下你的想法... 支持 Markdown 格式、数学公式 ($\LaTeX$) 和代码高亮"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px] resize-none"
                    required
                  />
                </div>
              </TabsContent>

              {/* 通用字段 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">标题（可选）</Label>
                  <Input
                    id="title"
                    placeholder={activeTab === "link" ? "自定义标题，留空使用网页标题" : "为你的笔记添加标题"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">描述（可选）</Label>
                  <Textarea
                    id="description"
                    placeholder={activeTab === "link" ? "自定义描述，留空使用网页描述" : "添加一些描述信息"}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[60px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    标签（可选）
                  </Label>
                  <Input
                    id="tags"
                    placeholder="用逗号分隔多个标签，如：工作,学习,想法"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  {tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || (activeTab === "link" && !url) || (activeTab === "text" && !content)}
                  className="min-w-[100px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    "创建笔记"
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
          
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}