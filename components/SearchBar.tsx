"use client"

import React, { useState, useEffect, KeyboardEvent } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  onSearch: (query: string) => void
  onClear: () => void
  isLoading?: boolean
  placeholder?: string
  shouldClear?: boolean
}

export default function SearchBar({ 
  onSearch, 
  onClear, 
  isLoading = false, 
  placeholder = "搜索笔记...",
  shouldClear = false
}: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  // 响应外部清空请求
  useEffect(() => {
    if (shouldClear) {
      setQuery("")
      setHasSearched(false)
    }
  }, [shouldClear])

  const handleSearch = () => {
    if (query.trim()) {
      setHasSearched(true)
      onSearch(query.trim())
    }
  }

  const handleClear = () => {
    setQuery("")
    setHasSearched(false)
    onClear()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    
    // 如果用户清空了搜索框且之前有搜索过，自动清空搜索
    if (newQuery.trim() === "" && hasSearched) {
      setHasSearched(false)
      onClear()
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="fixed top-4 z-50 w-full max-w-md px-4" style={{ left: '50vw', transform: 'translateX(-50%)' }}>
      <div className="relative">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg overflow-hidden">
          <div className="flex items-center">
            <Input
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 text-[#1C1917] placeholder:text-[#A3A3A3]"
              disabled={isLoading}
            />
            <div className="px-3">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-[#A3A3A3] animate-spin" />
              ) : hasSearched && query ? (
                <Button
                  onClick={handleClear}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto hover:bg-gray-100/50 rounded-full"
                >
                  <X className="h-5 w-5 text-[#A3A3A3] hover:text-[#1C1917]" />
                </Button>
              ) : (
                <Button
                  onClick={handleSearch}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto hover:bg-gray-100/50 rounded-full"
                  disabled={!query.trim() || isLoading}
                >
                  <Search className="h-5 w-5 text-[#A3A3A3] hover:text-[#1C1917]" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}