import ReactMarkdown from "react-markdown"
import { type Note } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Calendar, ExternalLink } from "lucide-react"

interface NoteCardProps {
  note: Note
}

export default function NoteCard({ note }: NoteCardProps) {
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

  if (note.type === "LINK") {
    return (
      <div className="bg-white rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden mb-4 group">
        {note.imageUrl && (
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={note.imageUrl || "/placeholder.svg"} 
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
                <img src={note.faviconUrl || "/placeholder.svg"} alt="" className="w-4 h-4 rounded-sm" />
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
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 mb-4">
      {note.title && (
        <h3 className="font-semibold text-[#1C1917] text-lg mb-3">
          {note.title}
        </h3>
      )}

      <div className="prose prose-sm prose-zinc max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-xl font-bold text-[#1C1917] mb-3 mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold text-[#1C1917] mb-2 mt-4">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-medium text-[#1C1917] mb-2 mt-3">{children}</h3>,
            p: ({ children }) => <p className="text-[#57534E] leading-relaxed mb-3">{children}</p>,
            ul: ({ children }) => <ul className="text-[#57534E] mb-3 pl-4">{children}</ul>,
            li: ({ children }) => <li className="mb-1 list-disc">{children}</li>,
            code: ({ children }) => (
              <code className="bg-[#F5F5F4] text-[#DC2626] px-1 py-0.5 rounded text-sm font-mono">{children}</code>
            ),
            strong: ({ children }) => <strong className="font-semibold text-[#1C1917]">{children}</strong>,
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
    </div>
  )
}
