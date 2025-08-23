import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"
import rehypeHighlight from "rehype-highlight"
import { type Note, updateNote } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ExternalLink } from "lucide-react"
import NoteContextMenu from "./ContextMenu"
import EditNoteDialog from "./EditNoteDialog"
import PhotoCard from "./PhotoCard"
import { useState, useEffect, useCallback, useMemo } from "react"
import { getProxiedImageUrl } from "@/lib/image-proxy"
import LazyImage from "./LazyImage"
import { PhotoNote } from "@/lib/photo-types"
import { 
  useAccessibility, 
  AriaLabels, 
  KeyboardKeys, 
  createAriaProps 
} from "@/lib/accessibility"

interface NoteCardProps {
  note: Note
  onDelete?: (noteId: string) => void
  onNoteUpdate?: (updatedNote: Note) => void
}

export default function NoteCard({ note, onDelete, onNoteUpdate }: NoteCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  // 本地状态用于即时响应
  const [localColor, setLocalColor] = useState(note.color)
  const [localIsHidden, setLocalIsHidden] = useState(note.isHidden)
  
  // 使用 useMemo 缓存 note 对象，避免不必要的重新渲染
  const memoizedNote = useMemo(() => ({
    ...note,
    color: localColor,
    isHidden: localIsHidden
  }), [note, localColor, localIsHidden])
  
  // 同步本地状态与props状态
  useEffect(() => {
    setLocalColor(note.color)
    setLocalIsHidden(note.isHidden)
  }, [note.color, note.isHidden])
  
  // 获取卡片颜色样式
  const getCardColorStyle = (color?: string) => {
    switch (color) {
      case 'pink':
        return { 
          backgroundColor: 'rgb(253 218 230)', 
          borderColor: 'rgb(251 207 232)' 
        }
      case 'blue':
        return { 
          backgroundColor: 'rgb(201 230 253)', 
          borderColor: 'rgb(147 197 253)' 
        }
      case 'green':
        return { 
          backgroundColor: 'rgb(210 244 215)', 
          borderColor: 'rgb(187 247 208)' 
        }
      default:
        return { 
          backgroundColor: 'rgb(255 255 255)', 
          borderColor: 'rgba(0, 0, 0, 0.05)' 
        }
    }
  }
  
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
    return note.tags.split(/\s+/).filter(tag => tag.trim()).map(tag => tag.trim())
  }

  // 使用 useCallback 缓存事件处理函数
  const handleEdit = useCallback(() => {
    setShowEditDialog(true)
  }, [])

  const handleHide = useCallback(async () => {
    // 立即更新本地状态实现即时响应
    const newHiddenState = !localIsHidden
    setLocalIsHidden(newHiddenState)
    
    try {
      const result = await updateNote(note.id, { isHidden: newHiddenState })
      if (result.success && result.data) {
        onNoteUpdate?.(result.data)
      }
    } catch (error) {
      console.error('Failed to update note visibility:', error)
      // 如果后端更新失败，回滚本地状态
      setLocalIsHidden(!newHiddenState)
    }
  }, [localIsHidden, note.id, onNoteUpdate])
  
  const handleColorChange = useCallback(async (color: "default" | "pink" | "blue" | "green") => {
    // 立即更新本地状态实现即时响应
    setLocalColor(color)
    
    try {
      const result = await updateNote(note.id, { color })
      if (result.success && result.data) {
        onNoteUpdate?.(result.data)
      }
    } catch (error) {
      console.error('Failed to update note color:', error)
      // 如果后端更新失败，回滚本地状态
      setLocalColor(note.color)
    }
  }, [localColor, note.color, note.id, onNoteUpdate])

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    setIsDeleting(true)
    // 立即调用删除函数，保持加载状态直到组件被销毁
    onDelete?.(note.id)
  }, [note.id, onDelete])

  const handleCancelDelete = useCallback(() => {
    setIsClosing(true)
    // 等待渐隐动画完成后关闭
    setTimeout(() => {
      setShowDeleteConfirm(false)
      setIsClosing(false)
    }, 200)
  }, [])

  const handleNoteUpdated = useCallback((updatedNote: Note) => {
    // 更新本地状态
    setLocalColor(updatedNote.color)
    setLocalIsHidden(updatedNote.isHidden)
    // 通知父组件
    onNoteUpdate?.(updatedNote)
  }, [onNoteUpdate])

  // 如果是图片笔记，使用PhotoCard组件
  if (note.type === "IMAGE") {
    const photoNote: PhotoNote = {
      id: note.id,
      imageUrl: note.imageUrl || '',
      imageAlt: note.title,
      note: note.content || '',
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt)
    };

    return (
      <PhotoCard 
        photoNote={photoNote}
        note={note}
        onEdit={(photoNote) => {
          setShowEditDialog(true);
        }}
        onDelete={(id) => {
          onDelete?.(id);
        }}
        onHide={handleHide}
        onColorChange={handleColorChange}
        onNoteUpdated={handleNoteUpdated}
      />
    );
  }


  if (note.type === "LINK") {
    return (
      <>
        <NoteContextMenu note={memoizedNote} onHide={handleHide} onEdit={handleEdit} onDelete={handleDelete} onColorChange={handleColorChange}>
        <div 
          className={`relative rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden mb-4 group cursor-pointer ${localIsHidden ? 'blur-sm opacity-70' : ''}`}
          style={getCardColorStyle(localColor)}
        >
          {note.imageUrl && (
            <div className="aspect-video w-full overflow-hidden">
              <LazyImage 
                src={note.imageUrl} 
                alt={note.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}
          <div className="p-4">
            {note.title && (
              <h3 className="font-semibold text-[#1C1917] text-lg mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                {note.title}
              </h3>
            )}
            
            {note.description && (
              <p className="text-[#57534E] text-sm leading-relaxed mb-3 line-clamp-3">
                {note.description}
              </p>
            )}

            {/* 标签 */}
            {getTags().length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {getTags().map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                {note.faviconUrl && (
                  <img src={getProxiedImageUrl(note.faviconUrl) || "/placeholder.svg"} alt="" className="w-4 h-4 rounded-sm" />
                )}
                <span>{note.domain}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(note.createdAt)}</span>
                {note.url && (
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* 删除确认覆盖层 */}
          {showDeleteConfirm && (
            <div 
              className={`absolute inset-0 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 transition-all duration-200 ${
                isClosing 
                  ? 'animate-out fade-out-0 zoom-out-95' 
                  : 'animate-in fade-in-0 zoom-in-95'
              } ${
                isDeleting 
                  ? 'bg-[rgb(246,244,240)]/80' 
                  : 'bg-white/80'
              }`}
            >
              {isDeleting ? (
                // 删除中状态：显示加载环
                <div className="flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              ) : (
                // 确认状态：显示确认对话框
                <div 
                  className={`flex flex-col items-center gap-3 p-4 transition-opacity duration-150 ${
                    isClosing ? 'opacity-0' : 'opacity-100'
                  }`}
                >
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
                      onClick={handleCancelDelete}
                      className="min-w-[70px] h-8 text-xs"
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleConfirmDelete}
                      className="min-w-[90px] h-8 text-xs bg-red-500 hover:bg-red-600 text-white"
                      disabled={isDeleting}
                    >
                      Confirm delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </NoteContextMenu>
      
      {/* 编辑对话框 */}
      <EditNoteDialog
        note={note}
        onNoteUpdated={handleNoteUpdated}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
    )
  }

  return (
    <>
      <NoteContextMenu note={memoizedNote} onHide={handleHide} onEdit={handleEdit} onDelete={handleDelete} onColorChange={handleColorChange}>
      <div 
        className={`relative rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200 p-4 mb-4 cursor-pointer ${localIsHidden ? 'blur-sm opacity-70' : ''}`}
        style={getCardColorStyle(localColor)}
      >
        {note.title && (
          <h3 className="font-semibold text-[#1C1917] text-lg mb-3">
            {note.title}
          </h3>
        )}

        <div className="prose prose-sm prose-zinc max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
            components={{
              h1: ({ children }) => <h1 className="text-xl font-bold text-[#1C1917] mb-3 mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold text-[#1C1917] mb-2 mt-4">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-medium text-[#1C1917] mb-2 mt-3">{children}</h3>,
              p: ({ children }) => <p className="text-[#57534E] leading-relaxed mb-3">{children}</p>,
              ul: ({ children }) => <ul className="text-[#57534E] mb-3 pl-4">{children}</ul>,
              ol: ({ children }) => <ol className="text-[#57534E] mb-3 pl-4 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="mb-1 list-disc">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-[#57534E]">
                  {children}
                </blockquote>
              ),
              code: ({ children, className, ...props }) => {
                const match = /language-(\w+)/.exec(className || '')
                return !match ? (
                  <code className="bg-[#F5F5F4] text-[#DC2626] px-1 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => (
                <pre className="bg-[#F8F9FA] border border-gray-200 rounded-lg p-4 overflow-x-auto mb-4 text-sm">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full divide-y divide-gray-200">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
              th: ({ children }) => (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{children}</td>,
              strong: ({ children }) => <strong className="font-semibold text-[#1C1917]">{children}</strong>,
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
              hr: () => <hr className="my-6 border-gray-200" />,
            }}
          >
            {note.content}
          </ReactMarkdown>
        </div>

        {/* 标签和日期 */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {getTags().map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-[#A3A3A3]">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(note.createdAt)}</span>
          </div>
        </div>
        
        {/* 删除确认覆盖层 */}
        {showDeleteConfirm && (
          <div 
            className={`absolute inset-0 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 transition-all duration-200 ${
              isClosing 
                ? 'animate-out fade-out-0 zoom-out-95' 
                : 'animate-in fade-in-0 zoom-in-95'
            } ${
              isDeleting 
                ? 'bg-[rgb(246,244,240)]/80' 
                : 'bg-white/80'
            }`}
          >
            {isDeleting ? (
              // 删除中状态：显示加载环
              <div className="flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            ) : (
              // 确认状态：显示确认对话框
              <div 
                className={`flex flex-col items-center gap-3 p-4 transition-opacity duration-150 ${
                  isClosing ? 'opacity-0' : 'opacity-100'
                }`}
              >
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
                    onClick={handleCancelDelete}
                    className="min-w-[70px] h-8 text-xs"
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleConfirmDelete}
                    className="min-w-[90px] h-8 text-xs bg-red-500 hover:bg-red-600 text-white"
                    disabled={isDeleting}
                  >
                    Confirm delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </NoteContextMenu>
    
    {/* 编辑对话框 */}
    <EditNoteDialog
      note={note}
      onNoteUpdated={handleNoteUpdated}
      open={showEditDialog}
      onOpenChange={setShowEditDialog}
    />
  </>
  )
}
