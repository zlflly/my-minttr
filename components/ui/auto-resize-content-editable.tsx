"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface AutoResizeContentEditableProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  minHeight?: number
  maxHeight?: number
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

const AutoResizeContentEditable = React.forwardRef<HTMLDivElement, AutoResizeContentEditableProps>(
  ({ 
    className, 
    minHeight = 70, 
    maxHeight = 200, 
    placeholder = "",
    value = "",
    onChange,
    style,
    ...props 
  }, ref) => {
    const divRef = React.useRef<HTMLDivElement>(null)
    const combinedRef = React.useCallback((element: HTMLDivElement) => {
      if (typeof ref === 'function') {
        ref(element)
      } else if (ref) {
        ref.current = element
      }
      divRef.current = element
    }, [ref])

    const adjustHeight = React.useCallback(() => {
      const div = divRef.current
      if (!div) return

      // 重置高度以获取真实的 scrollHeight
      div.style.height = 'auto'
      
      // 计算新高度
      const scrollHeight = div.scrollHeight
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      
      // 设置新高度
      div.style.height = `${newHeight}px`
      
      // 如果内容超过最大高度，显示滚动条
      if (scrollHeight > maxHeight) {
        div.style.overflowY = 'auto'
      } else {
        div.style.overflowY = 'hidden'
      }
    }, [minHeight, maxHeight])

    // 处理输入事件
    const handleInput = React.useCallback((e: React.FormEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement
      const newValue = target.textContent || ''
      onChange?.(newValue)
      adjustHeight()
    }, [onChange, adjustHeight])

    // 设置初始值和调整高度
    React.useEffect(() => {
      const div = divRef.current
      if (!div) return

      // 设置内容
      if (div.textContent !== value) {
        div.textContent = value
      }
      
      adjustHeight()
    }, [value, adjustHeight])

    // 处理占位符显示
    const showPlaceholder = !value || value.trim() === ''

    return (
      <div className="relative">
        <div
          ref={combinedRef}
          contentEditable
          suppressContentEditableWarning
          className={cn(
            "w-full transition-all duration-200 ease-in-out outline-none focus:outline-none",
            className
          )}
          style={{
            minHeight: `${minHeight}px`,
            height: `${minHeight}px`,
            overflowY: 'hidden',
            ...style
          }}
          onInput={handleInput}
          {...props}
        />
        {showPlaceholder && (
          <div 
            className="absolute top-0 left-0 pointer-events-none text-gray-400 select-none"
            style={{ 
              minHeight: `${minHeight}px`,
              lineHeight: style?.lineHeight || 'inherit',
              fontSize: style?.fontSize || 'inherit',
              padding: style?.padding || '0',
              display: 'flex',
              alignItems: 'flex-start',
              paddingTop: '2px' // 微调以匹配文本位置
            }}
          >
            {placeholder}
          </div>
        )}
      </div>
    )
  }
)
AutoResizeContentEditable.displayName = "AutoResizeContentEditable"

export { AutoResizeContentEditable }