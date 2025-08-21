"use client"

import type React from "react"

import { useState } from "react"
import NoteCard from "./NoteCard"

interface Note {
  id: string
  type: "link" | "text"
  url?: string
  title?: string
  description?: string
  image?: string
  favicon?: string
  domain?: string
  content?: string
}

// Mock function to simulate URL parsing
const parseLink = (url: string): Omit<Note, "id" | "type"> => {
  const domain = new URL(url).hostname

  // Mock data based on different domains
  const mockData: Record<string, any> = {
    "sspai.com": {
      title: "少数派：一个关于阅读、笔记与思考的分享",
      description: "在这里，我们讨论如何更有效地阅读，如何做笔记，以及如何将思考融入日常。探索数字时代的知识管理方法。",
      image: "/modern-workspace.png",
      favicon: "/sspai-favicon.png",
      domain: "sspai.com",
    },
    "github.com": {
      title: "GitHub - The world's leading software development platform",
      description:
        "GitHub is where over 100 million developers shape the future of software, together. Contribute to the open source community, manage Git repositories.",
      image: "/github-code-repository.png",
      favicon: "/github-favicon.png",
      domain: "github.com",
    },
    "medium.com": {
      title: "Medium - Where good ideas find you",
      description:
        "Medium is an open platform where readers find dynamic thinking, and where expert and undiscovered voices can share their writing on any topic.",
      image: "/article-writing-platform.png",
      favicon: "/medium-favicon.png",
      domain: "medium.com",
    },
  }

  return (
    mockData[domain] || {
      title: `Content from ${domain}`,
      description:
        "This is a preview of the linked content. The actual implementation would fetch real metadata from the URL.",
      image: "/webpage-preview.png",
      favicon: "/website-favicon.png",
      domain,
    }
  )
}

const isValidUrl = (string: string): boolean => {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

export default function NoteDashboard() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      type: "link",
      url: "https://sspai.com/post/96150",
      title: "少数派：一个关于阅读、笔记与思考的分享",
      description: "在这里，我们讨论如何更有效地阅读，如何做笔记，以及如何将思考融入日常。探索数字时代的知识管理方法。",
      image: "/modern-workspace.png",
      favicon: "/sspai-favicon.png",
      domain: "sspai.com",
    },
    {
      id: "2",
      type: "text",
      content:
        "# My First Thought\n\nThis is a standard text note using **Markdown**. I can include:\n\n- Lists like this one\n- `Code snippets`\n- And other formatting\n\nThe typography should be clean and readable.",
    },
    {
      id: "3",
      type: "link",
      url: "https://github.com/vercel/next.js",
      title: "GitHub - The world's leading software development platform",
      description:
        "GitHub is where over 100 million developers shape the future of software, together. Contribute to the open source community, manage Git repositories.",
      image: "/github-code-repository.png",
      favicon: "/github-favicon.png",
      domain: "github.com",
    },
    {
      id: "4",
      type: "text",
      content:
        "## Quick Note\n\nJust a simple reminder about the meeting tomorrow at 2 PM. Don't forget to bring the documents.",
    },
  ])

  const [inputValue, setInputValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const newNote: Note = {
      id: Date.now().toString(),
      type: isValidUrl(inputValue) ? "link" : "text",
    }

    if (newNote.type === "link") {
      const linkData = parseLink(inputValue)
      Object.assign(newNote, { url: inputValue, ...linkData })
    } else {
      newNote.content = inputValue
    }

    setNotes((prev) => [newNote, ...prev])
    setInputValue("")
  }

  return (
    <div className="min-h-screen bg-[#F6F4F0] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with input */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1C1917] mb-6">MTr</h1>
          <form onSubmit={handleSubmit} className="max-w-2xl">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste a link or start writing a note..."
              className="w-full px-4 py-3 rounded-xl border border-black/5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A3A3A3] focus:border-transparent text-[#1C1917] placeholder-[#A3A3A3]"
            />
          </form>
        </div>

        {/* Masonry layout */}
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="break-inside-avoid">
              <NoteCard note={note} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
