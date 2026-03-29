"use client";

import { formatPrice, unitLabel, formatDate } from "@/lib/formatters";
import { ShoppingCart, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Sale } from "@/types/models";

type SaleRowProps = {
   sale: Sale;
   onViewNote: (note: string) => void;
   onDelete: (id: string) => void;
   onApprove?: (id: string) => void;
};

export function SaleRow({ sale, onViewNote, onDelete, onApprove }: SaleRowProps) {
   return (
      <TableRow>
         <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(sale.createdAt, true, true)}
         </TableCell>
         <TableCell>
            <div className="flex items-center gap-2">
               <ShoppingCart className="h-4 w-4 text-muted-foreground" />
               <span className="font-medium">{sale.product.name}</span>
            </div>
         </TableCell>
         <TableCell>{sale.reseller.name}</TableCell>
         <TableCell className="text-right">
            {sale.quantity} {unitLabel(sale.product.unit)}
         </TableCell>
         <TableCell className="text-right">
            {formatPrice(Number(sale.soldPrice))}/{unitLabel(sale.product.unit)}
         </TableCell>
         <TableCell className="text-right font-medium">
            {formatPrice(Number(sale.soldPrice) * sale.quantity)}
         </TableCell>
         <TableCell
            className={cn(
               "text-sm text-muted-foreground truncate",
               sale.notes && "cursor-pointer hover:text-foreground"
            )}
            onClick={() => sale.notes && onViewNote(sale.notes)}
         >
            {sale.notes || "-"}
         </TableCell>
         <TableCell className="text-right">
            {onApprove ? (
               <div className="flex items-center justify-end gap-1">
                  <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                     onClick={() => onApprove(sale.id)}
                  >
                     <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(sale.id)}>
                     <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
               </div>
            ) : (
               <Button variant="ghost" size="icon" onClick={() => onDelete(sale.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
               </Button>
            )}
         </TableCell>
      </TableRow>
   );
}
