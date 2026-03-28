"use client";

import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";

type NoteDialogProps = {
   note: string | null;
   onClose: () => void;
};

export function NoteDialog({ note, onClose }: NoteDialogProps) {
   return (
      <Dialog open={note !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
         <DialogContent className="max-w-md">
            <DialogHeader>
               <DialogTitle>Note</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note}</p>
         </DialogContent>
      </Dialog>
   );
}
