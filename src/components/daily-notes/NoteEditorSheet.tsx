import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface NoteEditorSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: string
  initialContent?: string
  onSave: (date: string, content: string) => void
}

export function NoteEditorSheet({
  isOpen,
  onOpenChange,
  initialDate = new Date().toISOString().split("T")[0],
  initialContent = "",
  onSave,
}: NoteEditorSheetProps) {
  const [date, setDate] = React.useState(initialDate)
  const [content, setContent] = React.useState(initialContent)

  // Reset state when opening with new props
  React.useEffect(() => {
    if (isOpen) {
      setDate(initialDate)
      setContent(initialContent)
    }
  }, [isOpen, initialDate, initialContent])

  const handleSave = () => {
    onSave(date, content)
    onOpenChange(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] sm:h-[100vh] sm:max-w-md sm:side-right font-sans rounded-t-xl sm:rounded-none flex flex-col gap-4 p-0 bg-surface-100 border-control !w-[450px]"
      >
        <SheetHeader className="bg-surface-200/50 px-5 py-4 border-b border-control text-left space-y-1">
          <SheetTitle className="text-sm font-medium text-foreground">
            {initialContent ? "Edit Daily Note" : "New Daily Note"}
          </SheetTitle>
          <SheetDescription className="text-xs text-light">
            Capture your daily progress, blockers, and plans.
          </SheetDescription>
        </SheetHeader>
        
        <div className="bg-surface-100 px-5 py-4 flex-1 overflow-y-auto space-y-5">
          <div className="space-y-1.5 flex flex-col">
            <Label htmlFor="note-date" className="text-[13px] font-medium text-light">
              Date
            </Label>
            <Input
              id="note-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-[28px] text-xs bg-bg border-control text-foreground transition-colors focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand font-mono"
            />
          </div>
          
          <div className="space-y-1.5 flex flex-col h-full min-h-[200px]">
            <Label htmlFor="note-content" className="text-[13px] font-medium text-light">
              Content
            </Label>
            <textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you work on today?"
              className="flex-1 w-full p-2.5 text-xs text-light bg-surface-100 rounded-md border border-control transition-colors focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand placeholder:text-light resize-none font-mono"
            />
          </div>
        </div>

        <SheetFooter className="bg-surface-200/50 px-5 py-3 border-t border-control mt-auto sm:justify-end flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none h-[28px] text-xs px-3 rounded-md font-medium border-control hover:bg-surface-200 focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="flex-1 sm:flex-none h-[28px] text-xs px-3 rounded-md font-medium bg-brand text-brand-foreground hover:bg-brand/90 focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand"
          >
            Save Note
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
