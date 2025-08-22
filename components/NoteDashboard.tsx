"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Loader2 } from "lucide-react"
import NoteCard from "./NoteCard"
import CreateNoteDialog from "./CreateNoteDialog"
import { Button } from "@/components/ui/button"
import { fetchNotes, type Note } from "@/lib/api"

export default function NoteDashboard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取笔记列表
  const loadNotes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchNotes()
      if (response.success && response.data) {
        setNotes(response.data)
      } else {
        setError(response.error?.message || "获取笔记失败")
      }
    } catch (error) {
      console.error("获取笔记失败:", error)
      setError("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时加载笔记
  useEffect(() => {
    loadNotes()
  }, [])

  // 处理新笔记创建
  const handleNoteCreated = (newNote: Note) => {
    setNotes((prev) => [newNote, ...prev])
  }

  return (
    <div className="min-h-screen bg-[#F6F4F0] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#1C1917]">MTr</h1>
            <CreateNoteDialog onNoteCreated={handleNoteCreated}>
              <Button className="flex items-center gap-2 bg-[#1C1917] hover:bg-[#1C1917]/90">
                <Plus className="h-4 w-4" />
                新建笔记
              </Button>
            </CreateNoteDialog>
          </div>
          
          <p className="text-[#A3A3A3] text-lg">
            收集想法，保存链接，记录思考
          </p>
        </div>

        {/* 内容区域 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-[#A3A3A3]">
              <Loader2 className="h-5 w-5 animate-spin" />
              加载中...
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button 
              onClick={loadNotes}
              variant="outline"
              className="text-[#1C1917] border-[#1C1917]"
            >
              重试
            </Button>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-xl font-medium text-[#1C1917] mb-2">
                还没有笔记
              </h3>
              <p className="text-[#A3A3A3] mb-6">
                点击上方按钮创建你的第一个笔记
              </p>
              <CreateNoteDialog onNoteCreated={handleNoteCreated}>
                <Button className="bg-[#1C1917] hover:bg-[#1C1917]/90">
                  <Plus className="mr-2 h-4 w-4" />
                  创建笔记
                </Button>
              </CreateNoteDialog>
            </div>
          </div>
        ) : (
          /* Masonry layout */
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="break-inside-avoid">
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
