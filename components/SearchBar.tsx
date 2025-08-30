"use client"

import React, { useState, useEffect, KeyboardEvent } from "react"
import { Search, X, Loader2, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRecentSearches } from "@/lib/hooks/use-local-storage"

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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { searches, addSearch, removeSearch } = useRecentSearches()

  // 响应外部清空请求
  useEffect(() => {
    if (shouldClear) {
      setQuery("")
      setHasSearched(false)
    }
  }, [shouldClear])

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query.trim()
    if (finalQuery) {
      setHasSearched(true)
      setShowSuggestions(false)
      addSearch(finalQuery)
      onSearch(finalQuery)
      if (searchQuery) {
        setQuery(searchQuery)
      }
    }
  }

  const handleClear = () => {
    setQuery("")
    setHasSearched(false)
    setShowSuggestions(false)
    onClear()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    
    // 显示搜索建议
    setShowSuggestions(newQuery.trim().length > 0 && searches.length > 0)
    
    // 如果用户清空了搜索框且之前有搜索过，自动清空搜索
    if (newQuery.trim() === "" && hasSearched) {
      setHasSearched(false)
      setShowSuggestions(false)
      onClear()
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const filteredSuggestions = searches.filter(search => 
    search.toLowerCase().includes(query.toLowerCase()) && search !== query
  ).slice(0, 5)

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
              onFocus={() => setShowSuggestions(query.trim().length > 0 && searches.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={placeholder}
              className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 text-[#1C1917] placeholder:text-[#A3A3A3]"
              disabled={isLoading}
            />
            <div className="px-3">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-[#A3A3A7] animate-spin" />
              ) : hasSearched ? (
                // 只要搜索过，就显示X按钮，不管搜索框是否有内容
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
                  onClick={() => handleSearch()}
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
        
        {/* 搜索建议下拉框 */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg overflow-hidden">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center px-4 py-2 hover:bg-gray-50/80 cursor-pointer transition-colors"
                onClick={() => handleSearch(suggestion)}
              >
                <Clock className="h-4 w-4 text-[#A3A3A3] mr-3" />
                <span className="text-[#1C1917] text-sm flex-1">{suggestion}</span>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSearch(suggestion)
                  }}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto hover:bg-gray-100/50 rounded-full opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3 text-[#A3A3A3]" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}