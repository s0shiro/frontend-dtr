import * as React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DailyNote } from "@/types/daily-note"
import { Edit2, Trash } from "lucide-react"

interface MonthListProps {
  notes: DailyNote[]
  onEdit: (note: DailyNote) => void
  onDelete: (id: string) => void
}

export function MonthList({ notes, onEdit, onDelete }: MonthListProps) {
  if (notes.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-light font-sans border border-dashed border-control rounded-md bg-surface-100/30">
        No notes found for this month.
      </div>
    )
  }

  return (
    <div className="rounded-md border border-control bg-surface-100 shadow-sm overflow-hidden font-sans">
      <ScrollArea className="h-full max-h-[600px]">
        <div className="divide-y divide-control">
          {notes.map((note) => {
            const dateObj = new Date(note.date)
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
            const dayNum = dateObj.getDate()
            
            return (
              <div 
                key={note.id} 
                className="group flex flex-col sm:flex-row p-3 gap-3 transition-colors hover:bg-surface-200"
              >
                {/* Date Badge */}
                <div className="flex sm:flex-col items-center justify-start sm:justify-center sm:w-14 shrink-0 gap-2 sm:gap-0">
                  <span className="text-[10px] font-mono tracking-wider text-light uppercase">{dayName}</span>
                  <span className="text-sm font-mono text tracking-tight leading-none mt-1">{dayNum}</span>
                </div>

                {/* Content Preview */}
                <div className="flex-1 min-w-0 flex items-center">
                  <p className="text-xs text line-clamp-3 leading-relaxed whitespace-pre-wrap break-words overflow-hidden font-sans">
                    {note.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col justify-end sm:justify-center gap-1.5 pt-2 sm:pt-0 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-[28px] w-[28px] rounded-sm text-light hover:text hover:bg-surface-200 border border-transparent hover:border-control"
                    onClick={() => onEdit(note)}
                    title="Edit Note"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-[28px] w-[28px] rounded-sm text-destructive hover:text-destructive hover:bg-surface-200 border border-transparent hover:border-control"
                    onClick={() => onDelete(note.id)}
                    title="Delete Note"
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
