import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"
import rehypeHighlight from "rehype-highlight"
import { type Note } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink } from "lucide-react"
import NoteContextMenu from "./ContextMenu"
import { useState } from "react"

interface NoteCardProps {
  note: Note
  onDelete?: (noteId: string) => void
  onHide?: (noteId: string) => void
}

// 删除确认覆盖层组件
function DeleteConfirmOverlay({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex flex-col items-center gap-3 p-4">
        <div className="flex items-center gap-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 256 256" 
            className="w-5 h-5 text-red-500"
          >
            <rect width="256" height="256" fill="none"></rect>
            <line 
              x1="216" y1="56" x2="40" y2="56" 
              fill="none" 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="16"
            ></line>
            <line 
              x1="104" y1="104" x2="104" y2="168" 
              fill="none" 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="16"
            ></line>
            <line 
              x1="152" y1="104" x2="152" y2="168" 
              fill="none" 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="16"
            ></line>
            <path 
              d="M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56" 
              fill="none" 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="16"
            ></path>
            <path 
              d="M168,56V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V56" 
              fill="none" 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="16"
            ></path>
          </svg>
          <span className="text-sm font-medium text-gray-900">
            Delete this card?
          </span>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="min-w-[70px] h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            className="min-w-[90px] h-8 text-xs bg-red-500 hover:bg-red-600 text-white"
          >
            Confirm delete
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NoteCard({ note, onDelete, onHide }: NoteCardProps) {
  const [isHidden, setIsHidden] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTags = () => {
    if (!note.tags) return []
    return note.tags.split(',').filter(tag => tag.trim()).map(tag => tag.trim())
  }

  const handleHide = () => {
    setIsHidden(true)
    onHide?.(note.id)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    onDelete?.(note.id)
    setShowDeleteConfirm(false)
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  // 如果笔记被隐藏，不渲染
  if (isHidden) {
    return null
  }

  if (note.type === "LINK") {
    return (
      <NoteContextMenu onHide={handleHide} onDelete={handleDelete}>
        <div className="rounded-xl shadow-border bg-sand-1 relative flex flex-col overflow-hidden mb-4 group cursor-pointer">
          {/* 左侧蓝色标记 */}
          <div className="w-[1.5px] h-4 bg-blue-9 absolute top-[19px] -left-[0.7px]"></div>
          
          <div>
            <div className="flex flex-col gap-4 pb-4">
              {/* 头部信息 */}
              <div className="text-xs sm:text-mi-sm flex gap-1 items-center text-sand-11 justify-between pt-4 px-4">
                <div className="flex items-center gap-1">
                  {/* 链接图标 */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M240,88.23a54.43,54.43,0,0,1-16,37L189.25,160a54.27,54.27,0,0,1-38.63,16h-.05A54.63,54.63,0,0,1,96,119.84a8,8,0,0,1,16,.45A38.62,38.62,0,0,0,150.58,160h0a38.39,38.39,0,0,0,27.31-11.31l34.75-34.75a38.63,38.63,0,0,0-54.63-54.63l-11,11A8,8,0,0,1,135.7,59l11-11A54.65,54.65,0,0,1,224,48,54.86,54.86,0,0,1,240,88.23ZM109,185.66l-11,11A38.41,38.41,0,0,1,70.6,208h0a38.63,38.63,0,0,1-27.29-65.94L78,107.31A38.63,38.63,0,0,1,144,135.71a8,8,0,0,0,16,.45A54.86,54.86,0,0,0,144,96a54.65,54.65,0,0,0-77.27,0L32,130.75A54.62,54.62,0,0,0,70.56,224h0a54.28,54.28,0,0,0,38.64-16l11-11A8,8,0,0,0,109,185.66Z"></path>
                  </svg> 
                  <span className="truncate">{note.domain || 'Unknown domain'}</span>
                </div>
                {note.url && (
                  <a href={note.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="text-sand-12">
                      <path d="M117.18,188.74a12,12,0,0,1,0,17l-5.12,5.12A58.26,58.26,0,0,1,70.6,228h0A58.62,58.62,0,0,1,29.14,127.92L63.89,93.17a58.64,58.64,0,0,1,98.56,28.11,12,12,0,1,1-23.37,5.44,34.65,34.65,0,0,0-58.22-16.58L46.11,144.89A34.62,34.62,0,0,0,70.57,204h0a34.41,34.41,0,0,0,24.49-10.14l5.11-5.12A12,12,0,0,1,117.18,188.74ZM226.83,45.17a58.65,58.65,0,0,0-82.93,0l-5.11,5.11a12,12,0,0,0,17,17l5.12-5.12a34.63,34.63,0,1,1,49,49L175.1,145.86A34.39,34.39,0,0,1,150.61,156h0a34.63,34.63,0,0,1-33.69-26.72,12,12,0,0,0-23.38,5.44A58.64,58.64,0,0,0,150.56,180h.05a58.28,58.28,0,0,0,41.47-17.17l34.75-34.75a58.62,58.62,0,0,0,0-82.91Z"></path>
                    </svg>
                  </a>
                )}
              </div>
              
              {/* 图片 */}
              {note.imageUrl && (
                <div className="relative w-full rounded-lg overflow-hidden">
                  <img 
                    className="aspect-[1200/675] w-full object-cover object-center" 
                    alt="" 
                    referrerPolicy="no-referrer" 
                    src={note.imageUrl}
                  />
                  <div className="absolute inset-0 box-border border-[0.5px] border-black/5 mix-blend-luminosity"></div>
                </div>
              )}
              
              {/* 标题 */}
              {note.title && (
                <div className="text-xs sm:text-mi-base font-medium text-sand-12 leading-4 line-clamp-2 subpixel-antialiased px-4">
                  {note.title}
                </div>
              )}
              
              {/* 描述 */}
              {note.description && (
                <div className="text-xs sm:text-mi-base text-sand-11 leading-4 line-clamp-3 subpixel-antialiased px-4">
                  {note.description}
                </div>
              )}
            </div>
          </div>
          
          {/* 分隔线 */}
          {note.content && (
            <div 
              className="h-[0.5px] bg-repeat-x"
              style={{
                backgroundImage: 'linear-gradient(to right, var(--sand-a7) 50%, transparent 50%)',
                backgroundSize: '12px 12px'
              }}
            />
          )}
          
          {/* 笔记内容区域 */}
          {note.content && (
            <div className="bg-mi-amber-2 p-3 overflow-hidden rounded-lg my-[5px] mx-[5px] shadow-border-amber">
              <div className="prose prose-zinc markdown-card text-xs sm:text-mi-sm line-clamp-12 sm:line-clamp-16 prose-li:marker:text-sand-11 subpixel-antialiased prose-headings:antialiased">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                >
                  {note.content}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          {/* 删除确认覆盖层 */}
          {showDeleteConfirm && (
            <DeleteConfirmOverlay 
              onCancel={handleCancelDelete}
              onConfirm={handleConfirmDelete}
            />
          )}
        </div>
      </NoteContextMenu>
    )
  }

  return (
    <NoteContextMenu onHide={handleHide} onDelete={handleDelete}>
      <div className="rounded-xl shadow-border bg-sand-1 relative flex flex-col overflow-hidden mb-4 group cursor-pointer">
        {/* 左侧蓝色标记 */}
        <div className="w-[1.5px] h-4 bg-blue-9 absolute top-[19px] -left-[0.7px]"></div>
        
        <div>
          <div className="flex flex-col gap-4 pb-4">
            {/* 标题 */}
            {note.title && (
              <div className="text-xs sm:text-mi-base font-medium text-sand-12 leading-4 line-clamp-2 subpixel-antialiased px-4 pt-4">
                {note.title}
              </div>
            )}
          </div>
        </div>
        
        {/* 分隔线 */}
        {note.content && (
          <div 
            className="h-[0.5px] bg-repeat-x"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--sand-a7) 50%, transparent 50%)',
              backgroundSize: '12px 12px'
            }}
          />
        )}
        
        {/* 笔记内容区域 */}
        {note.content && (
          <div className="bg-mi-amber-2 p-3 overflow-hidden rounded-lg my-[5px] mx-[5px] shadow-border-amber relative">
            <div className="prose prose-zinc markdown-card text-xs sm:text-mi-sm line-clamp-12 sm:line-clamp-16 prose-li:marker:text-sand-11 subpixel-antialiased prose-headings:antialiased">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={{
                  h1: ({ children }) => <h1 className="text-sand-12 font-bold text-lg mb-2 mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sand-12 font-semibold text-base mb-2 mt-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sand-12 font-medium text-sm mb-1 mt-2">{children}</h3>,
                  p: ({ children }) => <p className="text-sand-12 leading-relaxed mb-2">{children}</p>,
                  ul: ({ children }) => <ul className="text-sand-12 mb-2 pl-4">{children}</ul>,
                  ol: ({ children }) => <ol className="text-sand-12 mb-2 pl-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="mb-1 list-disc">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-sand-7 pl-4 my-2 italic text-sand-11">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children, className, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return !match ? (
                      <code className="bg-sand-3 text-sand-12 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  strong: ({ children }) => <strong className="font-semibold text-sand-12">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {note.content}
              </ReactMarkdown>
            </div>
            
            {/* 右下角时间日期 */}
            <div className="absolute bottom-2 right-2 text-[10px] text-sand-11 opacity-60">
              {formatDate(note.createdAt)}
            </div>
          </div>
        )}
        
        {/* 删除确认覆盖层 */}
        {showDeleteConfirm && (
          <DeleteConfirmOverlay 
            onCancel={handleCancelDelete}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </NoteContextMenu>
  )
}
