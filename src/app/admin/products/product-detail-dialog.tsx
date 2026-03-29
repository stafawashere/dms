"use client";

import { formatPrice } from "@/lib/formatters";
import { Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
   DialogFooter,
   DialogClose,
} from "@/components/ui/dialog";
import type { Product } from "@/types/models";

type ProductDetailDialogProps = {
   product: Product | null;
   onClose: () => void;
   onEdit: (product: Product) => void;
   onDelete: (id: string) => void;
};

export function ProductDetailDialog({
   product,
   onClose,
   onEdit,
   onDelete,
}: ProductDetailDialogProps) {
   return (
      <Dialog open={product !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
         <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            {product && (
               <>
                  <DialogHeader>
                     <DialogTitle>{product.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-2">
                     <div className="relative aspect-video w-full rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                        {product.thumbnail ? (
                           <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                           <Package className="h-16 w-16 text-muted-foreground/40" />
                        )}
                     </div>

                     <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold">
                           {formatPrice(product.sellPrice)}
                           <span className="text-base text-muted-foreground">/{product.unit ?? "unit"}</span>
                        </p>
                        <Badge variant="secondary">{product.category.name}</Badge>
                     </div>

                     {product.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                     )}

                     <div className="rounded-lg border border-border/70 p-4">
                        <p className="font-medium mb-3">Base Pricing</p>
                        <div className="grid grid-cols-3 gap-3">
                           <div className="rounded-md bg-muted/30 px-3 py-2 text-center">
                              <p className="text-[10px] text-muted-foreground mb-0.5">Cost</p>
                              <p className="text-sm font-semibold">{formatPrice(product.costPrice)}/{product.unit ?? "unit"}</p>
                           </div>
                           <div className="rounded-md bg-muted/30 px-3 py-2 text-center">
                              <p className="text-[10px] text-muted-foreground mb-0.5">Sell</p>
                              <p className="text-sm font-semibold">{formatPrice(product.sellPrice)}/{product.unit ?? "unit"}</p>
                           </div>
                           <div className="rounded-md bg-muted/30 px-3 py-2 text-center">
                              <p className="text-[10px] text-muted-foreground mb-0.5">Markup</p>
                              <p className="text-sm font-semibold">
                                 {product.costPrice > 0
                                    ? ((product.sellPrice - product.costPrice) / product.costPrice * 100).toFixed(1)
                                    : "0"}%
                              </p>
                           </div>
                        </div>
                     </div>

                     {product.priceTiers.length > 0 && (
                        <div className="rounded-lg border border-border/70 p-4">
                           <div className="flex items-center justify-between mb-3">
                              <p className="font-medium">Price Tiers</p>
                              <Badge variant="secondary" className="text-xs">
                                 {product.priceTiers.length} tier(s)
                              </Badge>
                           </div>
                           <Table>
                              <TableHeader>
                                 <TableRow>
                                    <TableHead>Qty</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">Sell</TableHead>
                                    <TableHead className="text-right">Markup</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {product.priceTiers
                                    .sort((a, b) => a.qty - b.qty)
                                    .map((tier, i) => {
                                       const markup = tier.costPrice > 0
                                          ? ((tier.sellPrice - tier.costPrice) / tier.costPrice * 100).toFixed(1)
                                          : "0";
                                       const perUnit = tier.qty > 0 ? tier.sellPrice / tier.qty : 0;
                                       return (
                                          <TableRow key={i}>
                                             <TableCell className="font-medium">
                                                {((u: string | null) => { const unit = u ?? "unit"; return unit.length > 2 ? `${tier.qty} ${unit}` : `${tier.qty}${unit}`; })(product.unit)}{tier.qty !== 1 && <span className="text-[10px] text-muted-foreground/40">(s)</span>}
                                             </TableCell>
                                             <TableCell className="text-right">
                                                {formatPrice(tier.costPrice)}
                                                <span className="ml-1 text-xs text-muted-foreground">
                                                   ({formatPrice(Number(tier.costPrice) / tier.qty)}/{product.unit ?? "unit"})
                                                </span>
                                             </TableCell>
                                             <TableCell className="text-right">
                                                {formatPrice(tier.sellPrice)}
                                                <span className="ml-1 text-xs text-muted-foreground">
                                                   ({formatPrice(perUnit)}/{product.unit ?? "unit"})
                                                </span>
                                             </TableCell>
                                             <TableCell className="text-right text-muted-foreground">
                                                {markup}%
                                             </TableCell>
                                          </TableRow>
                                       );
                                    })}
                              </TableBody>
                           </Table>
                        </div>
                     )}
                  </div>
                  <DialogFooter className="flex gap-2">
                     <Button variant="destructive" onClick={() => { const id = product.id; onClose(); onDelete(id); }}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                     </Button>
                     <Button onClick={() => { onClose(); onEdit(product); }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                     </Button>
                     <DialogClose render={<Button variant="outline" />}>
                        Close
                     </DialogClose>
                  </DialogFooter>
               </>
            )}
         </DialogContent>
      </Dialog>
   );
}
