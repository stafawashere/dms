"use client";

import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogClose,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   title: string;
   description: string | React.ReactNode;
   confirmLabel?: string;
   variant?: "default" | "destructive";
   onConfirm: () => void;
};

export function ConfirmDialog({
   open,
   onOpenChange,
   title,
   description,
   confirmLabel = "Confirm",
   variant = "destructive",
   onConfirm,
}: ConfirmDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-sm">
            <DialogHeader>
               <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{description}</p>
            <DialogFooter>
               <DialogClose render={<Button variant="outline" />}>
                  Cancel
               </DialogClose>
               <Button variant={variant} onClick={onConfirm}>
                  {confirmLabel}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}