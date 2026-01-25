"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { LibraryColoringDTO } from "@/app/types";

// ============================================================================
// Types
// ============================================================================

interface DeleteConfirmDialogProps {
  /** Coloring data to delete */
  coloring: LibraryColoringDTO;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  /** Callback when deletion is cancelled */
  onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Dialog component for confirming deletion of a coloring from library.
 * Shows thumbnail and prompt for user confirmation.
 */
export function DeleteConfirmDialog({
  coloring,
  isOpen,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia>
            {/* Thumbnail */}
            <div className="relative aspect-square w-full max-w-[120px] overflow-hidden rounded-lg">
              <img
                src={coloring.imageUrl}
                alt={coloring.prompt}
                className="h-full w-full object-cover"
              />
            </div>
          </AlertDialogMedia>
          <AlertDialogTitle>Usuń kolorowankę z biblioteki?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta kolorowanka zostanie usunięta z Twojej biblioteki, ale pozostanie
            w galerii publicznej.
          </AlertDialogDescription>
          {/* Prompt preview */}
          <div className="mt-2 rounded-lg bg-muted/30 p-3">
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {coloring.prompt}
            </p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
