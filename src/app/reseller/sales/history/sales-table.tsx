"use client";

import { ShoppingCart } from "lucide-react";
import { formatPrice, unitLabel, formatDate } from "@/lib/formatters";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ResellerSale } from "@/types/models";

type SalesTableProps = {
   rows: ResellerSale[];
   emptyMessage: string;
   onViewNote: (note: string) => void;
};

export function SalesTable({ rows, emptyMessage, onViewNote }: SalesTableProps) {
   return (
      <div className="rounded-md border border-border/70">
         <Table className="table-fixed">
            <TableHeader>
               <TableRow>
                  <TableHead className="w-[30%]">Date</TableHead>
                  <TableHead className="w-[25%]">Product</TableHead>
                  <TableHead className="w-[10%] text-right">Qty</TableHead>
                  <TableHead className="w-[15%] text-right">Price</TableHead>
                  <TableHead className="w-[10%] text-right">Total</TableHead>
                  <TableHead className="w-[10%]">Notes</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {rows.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {emptyMessage}
                     </TableCell>
                  </TableRow>
               ) : (
                  rows.map((sale) => (
                     <TableRow key={sale.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                           {formatDate(sale.createdAt, true, true)}
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{sale.product.name}</span>
                           </div>
                        </TableCell>
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
                     </TableRow>
                  ))
               )}
            </TableBody>
         </Table>
      </div>
   );
}
