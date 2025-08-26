"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number
  maxHeight?: number
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, minHeight = 80, maxHeight = 300, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const combinedRef = React.useCallback((element: HTMLTextAreaElement) => {
      if (typeof ref === 'function') {
        ref(element)
      } else if (ref) {
        ref.current = element
      }
      textareaRef.current = element
    }, [ref])

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      // 重置高度以获取真实的 scrollHeight
      textarea.style.height = 'auto'
      
      // 计算新高度
      const scrollHeight = textarea.scrollHeight
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      
      // 设置新高度
      textarea.style.height = `${newHeight}px`
      
      // 如果内容超过最大高度，显示滚动条
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto'
      } else {
        textarea.style.overflowY = 'hidden'
      }
    }, [minHeight, maxHeight])

    // 监听内容变化
    React.useEffect(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      adjustHeight()

      const handleInput = () => adjustHeight()
      textarea.addEventListener('input', handleInput)
      
      return () => {
        textarea.removeEventListener('input', handleInput)
      }
    }, [adjustHeight])

    // 监听值变化（用于外部修改值的情况）
    React.useEffect(() => {
      adjustHeight()
    }, [props.value, adjustHeight])

    return (
      <textarea
        className={cn(
          "w-full resize-none transition-all duration-200 ease-in-out outline-none focus:outline-none",
          className
        )}
        ref={combinedRef}
        style={{
          minHeight: `${minHeight}px`,
          height: `${minHeight}px`,
          overflowY: 'hidden'
        }}
        {...props}
      />
    )
  }
)
AutoResizeTextarea.displayName = "AutoResizeTextarea"

export { AutoResizeTextarea }