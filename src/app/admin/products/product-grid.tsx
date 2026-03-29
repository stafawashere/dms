"use client";

import { Fragment } from "react";
import { formatPrice } from "@/lib/formatters";
import { Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/models";

type ProductGridProps = {
   products: Product[];
   loading: boolean;
   search: string;
   onEdit: (product: Product) => void;
   onDelete: (id: string) => void;
   onViewTiers: (product: Product) => void;
};

export function ProductGrid({
   products,
   loading,
   search,
   onEdit,
   onDelete,
   onViewTiers,
}: ProductGridProps) {
   return (
      <div className="mt-4 flex flex-col gap-6">
         {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
         ) : products.length === 0 ? (
            <div className="text-center text-muted-foreground">
               {search ? "No products match your search" : "No products yet"}
            </div>
         ) : (() => {
            const catMap = new Map<string, Product[]>();
            for (const p of products) {
               const existing = catMap.get(p.category.name);
               if (existing) existing.push(p);
               else catMap.set(p.category.name, [p]);
            }
            const groups = Array.from(catMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
            return groups.map(([catName, prods]) => (
               <div key={catName} className="rounded-lg border border-border/70 p-4">
                  <div className="flex items-center gap-2 mb-4">
                     <h3 className="text-lg font-semibold">{catName}</h3>
                     <Badge variant="outline" className="text-xs font-normal">{prods.length}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {prods.map((product) => {
                        const hasTiers = product.priceTiers.length > 0;
                        return (
                           <div
                              key={product.id}
                              className="group flex flex-col rounded-lg border border-border/70 bg-card overflow-hidden transition-colors hover:border-border/80 cursor-pointer"
                              onClick={() => onViewTiers(product)}
                           >
                              <div className="relative aspect-square w-full bg-muted/30 flex items-center justify-center">
                                 {product.thumbnail ? (
                                    <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                                 ) : (
                                    <Package className="h-10 w-10 text-muted-foreground/40" />
                                 )}
                                 <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                       variant="secondary"
                                       size="icon"
                                       className="h-7 w-7"
                                       onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                                    >
                                       <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                       variant="secondary"
                                       size="icon"
                                       className="h-7 w-7"
                                       onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
                                    >
                                       <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                 </div>
                              </div>
                              <div className="flex flex-col gap-1.5 p-3">
                                 <p className="font-medium text-sm leading-tight truncate" title={product.name}>
                                    {product.name}
                                 </p>
                                 {product.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                                 )}
                                 <div className="flex items-baseline justify-between gap-1 mt-1.5">
                                    <span className="text-sm font-semibold">{formatPrice(product.sellPrice)}</span>
                                    <span className="text-[11px] text-muted-foreground">/{product.unit ?? "unit"}</span>
                                 </div>
                                 {hasTiers && (
                                    <div className="mt-1 border-t border-border/30 pt-1.5">
                                       <div className="flex items-center justify-between mb-1">
                                          <p className="text-[10px] text-muted-foreground">Pricing</p>
                                          <Badge variant="secondary" className="text-[9px] leading-none px-1 py-0">
                                             {product.priceTiers.length}
                                          </Badge>
                                       </div>
                                       <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
                                          {product.priceTiers
                                             .sort((a, b) => a.qty - b.qty)
                                             .map((tier, i) => (
                                                <Fragment key={i}>
                                                   <span className="text-muted-foreground whitespace-nowrap">
                                                      {((u: string | null) => { const unit = u ?? "unit"; return unit.length > 2 ? `${tier.qty} ${unit}` : `${tier.qty}${unit}`; })(product.unit)}{tier.qty !== 1 && <span className="text-[9px] text-muted-foreground/40">(s)</span>}
                                                   </span>
                                                   <span className="text-muted-foreground/50 whitespace-nowrap">
                                                      ({formatPrice(tier.sellPrice / tier.qty)}/{product.unit ?? "unit"})
                                                   </span>
                                                   <span className="font-medium text-right">{formatPrice(tier.sellPrice)}</span>
                                                </Fragment>
                                             ))}
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            ));
         })()}
      </div>
   );
}
