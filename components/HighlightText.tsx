"use client"

import React from "react"

interface HighlightTextProps {
  text: string
  searchTerm: string
  className?: string
}

export default function HighlightText({ text, searchTerm, className = "" }: HighlightTextProps) {
  if (!text || !searchTerm.trim()) {
    return <span className={className}>{text}</span>
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200/80 text-[#1C1917] rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  )
}