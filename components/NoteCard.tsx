import ReactMarkdown from "react-markdown"

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

interface NoteCardProps {
  note: Note
}

export default function NoteCard({ note }: NoteCardProps) {
  if (note.type === "link") {
    return (
      <div className="bg-white rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden mb-4">
        {note.image && (
          <div className="aspect-video w-full overflow-hidden">
            <img src={note.image || "/placeholder.svg"} alt={note.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-[#1C1917] text-lg mb-2 leading-tight">{note.title}</h3>
          <p className="text-[#57534E] text-sm leading-relaxed mb-3 line-clamp-3">{note.description}</p>
          <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
            {note.favicon && <img src={note.favicon || "/placeholder.svg"} alt="" className="w-4 h-4 rounded-sm" />}
            <span>{note.domain}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 mb-4">
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
    </div>
  )
}
