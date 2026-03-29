"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogClose,
} from "@/components/ui/dialog";

type WipeDialogProps = {
   target: { id: string; name: string } | null;
   onClose: () => void;
   onWipe: (options: { sales: boolean; inventory: boolean; movements: boolean }) => void;
   wiping: boolean;
};

export function WipeDialog({ target, onClose, onWipe, wiping }: WipeDialogProps) {
   const [wipeOptions, setWipeOptions] = useState({ sales: false, inventory: false, movements: false });

   useEffect(() => {
      if (target) {
         setWipeOptions({ sales: false, inventory: false, movements: false });
      }
   }, [target]);

   const allSelected = wipeOptions.sales && wipeOptions.inventory && wipeOptions.movements;
   const noneSelected = !wipeOptions.sales && !wipeOptions.inventory && !wipeOptions.movements;

   return (
      <Dialog open={!!target} onOpenChange={() => onClose()}>
         <DialogContent className="sm:max-w-sm">
            <DialogHeader>
               <DialogTitle>Wipe Data &mdash; {target?.name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
               Select data to wipe for this reseller. This cannot be undone.
            </p>
            <div className="flex flex-col gap-3 py-2">
               <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <Checkbox
                     checked={allSelected}
                     onCheckedChange={(checked) =>
                        setWipeOptions({ sales: !!checked, inventory: !!checked, movements: !!checked })
                     }
                  />
                  Select All
               </label>
               <div className="ml-6 flex flex-col gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                     <Checkbox
                        checked={wipeOptions.sales}
                        onCheckedChange={(checked) => setWipeOptions({ ...wipeOptions, sales: !!checked })}
                     />
                     Sales History
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                     <Checkbox
                        checked={wipeOptions.inventory}
                        onCheckedChange={(checked) => setWipeOptions({ ...wipeOptions, inventory: !!checked })}
                     />
                     Inventory
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                     <Checkbox
                        checked={wipeOptions.movements}
                        onCheckedChange={(checked) => setWipeOptions({ ...wipeOptions, movements: !!checked })}
                     />
                     Stock Movements
                  </label>
               </div>
            </div>
            <DialogFooter>
               <DialogClose render={<Button variant="outline" />}>
                  Cancel
               </DialogClose>
               <Button
                  variant="destructive"
                  onClick={() => onWipe(wipeOptions)}
                  disabled={wiping || noneSelected}
               >
                  {wiping ? "Wiping..." : "Wipe Selected Data"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
