// Delete Paper Dialog Component
// Confirmation dialog for deleting papers

'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Paper } from '@/lib/firebase/schema';

interface DeletePaperDialogProps {
  paper: Paper | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: (paperId: string) => Promise<void>;
}

export function DeletePaperDialog({
  paper,
  open,
  onOpenChange,
  onConfirmDelete,
}: DeletePaperDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!paper) return;

    setIsDeleting(true);
    try {
      await onConfirmDelete(paper.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete paper:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!paper) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-lg">Delete Paper?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground space-y-2">
            <p>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{paper.title}"</span>?
            </p>
            <p>
              This will permanently delete the paper and all associated data including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Extracted text and sections</li>
              <li>Figures and tables</li>
              <li>References and citations</li>
              <li>Chat history</li>
              <li>Notes and annotations</li>
            </ul>
            <p className="font-medium text-foreground">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Paper'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
