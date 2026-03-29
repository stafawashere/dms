"use client";

import { formatPrice, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import type { ResellerDetail } from "@/types/models";

type ResellerDetailDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   detail: ResellerDetail | null;
};

export function ResellerDetailDialog({ open, onOpenChange, detail }: ResellerDetailDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
               <DialogTitle>{detail?.name}</DialogTitle>
            </DialogHeader>
            {detail && (
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 text-sm">
                     <span className="text-muted-foreground">{detail.email}</span>
                     <Badge variant={detail.active ? "default" : "secondary"}>
                        {detail.active ? "Active" : "Inactive"}
                     </Badge>
                  </div>

                  <div>
                     <h3 className="text-sm font-medium mb-2">Inventory ({detail.inventory.length})</h3>
                     {detail.inventory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No inventory assigned</p>
                     ) : (
                        <div className="rounded-md border border-border/70">
                           <Table>
                              <TableHeader>
                                 <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {detail.inventory.map((inv) => (
                                    <TableRow key={inv.id}>
                                       <TableCell>{inv.product.name}</TableCell>
                                       <TableCell className="text-right">
                                          {inv.quantity} {inv.product.unit ? `${inv.product.unit}(s)` : ""}
                                       </TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                           </Table>
                        </div>
                     )}
                  </div>

                  <div>
                     <h3 className="text-sm font-medium mb-2">Recent Sales ({detail.sales.length})</h3>
                     {detail.sales.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No sales recorded</p>
                     ) : (
                        <div className="rounded-md border border-border/70">
                           <Table>
                              <TableHeader>
                                 <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Date</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {detail.sales.map((sale) => (
                                    <TableRow key={sale.id}>
                                       <TableCell>{sale.product.name}</TableCell>
                                       <TableCell>{sale.quantity}</TableCell>
                                       <TableCell>{formatPrice(sale.soldPrice)}</TableCell>
                                       <TableCell className="text-muted-foreground">{formatDate(sale.createdAt, false, true)}</TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                           </Table>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
}
