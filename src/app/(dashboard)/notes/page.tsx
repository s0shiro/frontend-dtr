"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MonthList } from "@/components/daily-notes/MonthList"
import { NoteEditorSheet } from "@/components/daily-notes/NoteEditorSheet"
import { DeleteNoteDialog } from "@/components/daily-notes/DeleteNoteDialog"
import { Button } from "@/components/ui/button"
import { DailyNote } from "@/types/daily-note"
import {
  listDailyNotes,
  createDailyNote,
  updateDailyNote,
  deleteDailyNote,
  dailyNotesQueryKey,
} from "@/lib/api/daily-notes"
import { Plus } from "lucide-react"

export default function NotesPage() {
  const queryClient = useQueryClient()

  // Use YYYY-[M]M format for the query
  const [currentMonth, setCurrentMonth] = React.useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [isEditorOpen, setIsEditorOpen] = React.useState(false)
  const [selectedNote, setSelectedNote] = React.useState<DailyNote | null>(null)
  const [noteToDelete, setNoteToDelete] = React.useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: dailyNotesQueryKey(currentMonth),
    queryFn: () => listDailyNotes(currentMonth),
  })

  const notes = data?.notes || []

  const createMutation = useMutation({
    mutationFn: createDailyNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNotesQueryKey(currentMonth) })
      setIsEditorOpen(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: { content: string } }) =>
      updateDailyNote(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNotesQueryKey(currentMonth) })
      setIsEditorOpen(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDailyNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNotesQueryKey(currentMonth) })
      setNoteToDelete(null)
    }
  })

  const handleEdit = (note: DailyNote) => {
    setSelectedNote(note)
    setIsEditorOpen(true)
  }

  const handleDelete = (id: string) => {
    setNoteToDelete(id)
  }

  const handleConfirmDelete = () => {
    if (noteToDelete) {
      deleteMutation.mutate(noteToDelete)
    }
  }

  const handleSave = (date: string, content: string) => {
    if (selectedNote) {
      updateMutation.mutate({
        id: selectedNote.id,
        payload: { content }
      })
    } else {
      createMutation.mutate({ date, content })
    }
  }

  const handleOpenNew = () => {
    setSelectedNote(null)
    setIsEditorOpen(true)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setCurrentMonth(e.target.value)
    }
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8 max-w-[1200px] mx-auto space-y-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-2xl font-normal tracking-tight text-foreground whitespace-nowrap shrink-0">Daily Notes</h1>
              <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded outline outline-1 outline-border bg-surface-200 text-light uppercase whitespace-nowrap shrink-0">Daily Log</span>
            </div>
            <p className="text-xs text-light">Capture your daily progress, blockers, and plans.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="month"
              value={currentMonth}
              onChange={handleMonthChange}
              suppressHydrationWarning
              className="h-[28px] w-[140px] text-xs rounded-md bg-surface-100 border border-control text-foreground px-2.5 focus-visible:outline-none focus-visible:border-brand font-sans"
              aria-label="Select Month"
            />
            <Button
              onClick={handleOpenNew}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Note
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 border border-dashed border-control rounded-md bg-surface-100/50 text-xs text-light">
            Loading notes...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 border border-dashed border-destructive/30 bg-destructive/5 rounded-md text-xs text-destructive">
            Failed to load notes.
          </div>
        ) : (
          <MonthList
            notes={notes}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <NoteEditorSheet
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        initialDate={selectedNote ? new Date(selectedNote.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
        initialContent={selectedNote?.content || ""}
        onSave={handleSave}
      />

      <DeleteNoteDialog
        isOpen={!!noteToDelete}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
