import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteNoteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteNoteDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteNoteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-100 border border-control rounded-md shadow-lg p-0 sm:max-w-[400px] gap-0">
        <DialogHeader className="bg-surface-200/50 px-5 py-4 border-b border-control space-y-0 text-left">
          <DialogTitle className="text-sm font-medium text">Delete Note</DialogTitle>
          <DialogDescription className="text-xs text-light mt-1.5">
            Are you sure you want to delete this note? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-surface-200/50 px-5 py-3 border-t border-control sm:justify-end gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="h-[28px] text-xs px-3 rounded-md bg-transparent border-control hover:bg-surface-300 text"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-[28px] text-xs px-3 rounded-md"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
