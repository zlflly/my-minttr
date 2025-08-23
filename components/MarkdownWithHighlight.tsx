"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"
import rehypeHighlight from "rehype-highlight"

interface MarkdownWithHighlightProps {
  content: string
  searchTerm: string
  className?: string
}

export default function MarkdownWithHighlight({ 
  content, 
  searchTerm, 
  className = "" 
}: MarkdownWithHighlightProps) {
  
  // 高亮文本的辅助函数
  const highlightText = (text: string): React.ReactNode[] => {
    if (!searchTerm.trim() || typeof text !== 'string') {
      return [text]
    }

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200/80 text-[#1C1917] rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-[#1C1917] mb-3 mt-0">{highlightText(children?.toString() || '')}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-[#1C1917] mb-2 mt-4">{highlightText(children?.toString() || '')}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium text-[#1C1917] mb-2 mt-3">{highlightText(children?.toString() || '')}</h3>,
          p: ({ children }) => <p className="text-[#57534E] leading-relaxed mb-3">{highlightText(children?.toString() || '')}</p>,
          ul: ({ children }) => <ul className="text-[#57534E] mb-3 pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="text-[#57534E] mb-3 pl-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="mb-1 list-disc">{highlightText(children?.toString() || '')}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-200 pl-4 py-2 my-4 bg-blue-50/50 italic text-[#57534E]">
              {highlightText(children?.toString() || '')}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return <code className="bg-gray-100 text-[#1C1917] px-1 py-0.5 rounded text-sm font-mono">{highlightText(children?.toString() || '')}</code>
            }
            return <code className={className}>{children}</code>
          },
          pre: ({ children }) => (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm">
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
              {highlightText(children?.toString() || '')}
            </th>
          ),
          td: ({ children }) => <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{highlightText(children?.toString() || '')}</td>,
          strong: ({ children }) => <strong className="font-semibold text-[#1C1917]">{highlightText(children?.toString() || '')}</strong>,
          em: ({ children }) => <em className="italic">{highlightText(children?.toString() || '')}</em>,
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {highlightText(children?.toString() || '')}
            </a>
          ),
          hr: () => <hr className="my-6 border-gray-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}