"use client";

import { useState, useEffect, Fragment } from "react";
import { Search, Package, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PriceTier = {
   id: string;
   qty: number;
   costPrice: number;
   sellPrice: number;
};

type Product = {
   id: string;
   name: string;
   categoryId: string;
   category: { id: string; name: string };
   costPrice: number;
   sellPrice: number;
   unit: string | null;
   description: string | null;
   thumbnail: string | null;
   priceTiers: PriceTier[];
   active: boolean;
};

type GroupedCategory = {
   name: string;
   products: Product[];
};

export default function ResellerProductsPage() {
   const [products, setProducts] = useState<Product[]>([]);
   const [inStockIds, setInStockIds] = useState<Set<string>>(new Set());
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

   useEffect(() => {
      let ignore = false;
      Promise.all([
         fetch("/api/products").then((r) => r.json()),
         fetch("/api/inventory").then((r) => r.json()),
      ]).then(([prodData, invData]) => {
         if (ignore) return;
         setProducts(prodData.filter((p: Product) => p.active));
         const stocked = new Set<string>();
         for (const inv of invData) {
            if (inv.quantity > 0) stocked.add(inv.productId);
         }
         setInStockIds(stocked);
         setLoading(false);
      });
      return () => { ignore = true; };
   }, []);

   const formatPrice = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

   const unitLabel = (unit: string | null) => unit ? `${unit}(s)` : "unit(s)";
   const qtyUnit = (qty: number, unit: string | null) => {
      const u = unit ?? "unit";
      return u.length > 2 ? `${qty} ${u}(s)` : `${qty}${u}(s)`;
   };
   const qtyUnitShort = (qty: number, unit: string | null) => {
      const u = unit ?? "unit";
      return u.length > 2 ? `${qty} ${u}` : `${qty}${u}`;
   };

   const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.name.toLowerCase().includes(search.toLowerCase())
   );

   const grouped: GroupedCategory[] = [];
   const catMap = new Map<string, Product[]>();
   for (const p of filtered) {
      const existing = catMap.get(p.category.name);
      if (existing) existing.push(p);
      else catMap.set(p.category.name, [p]);
   }
   for (const [name, prods] of catMap) {
      grouped.push({ name, products: prods });
   }
   grouped.sort((a, b) => a.name.localeCompare(b.name));

   if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

   return (
      <div>
         <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="mt-1 text-muted-foreground">
               Browse the catalog
            </p>
         </div>

         <div className="mt-4 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
               placeholder="Search products..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9"
            />
         </div>

         {filtered.length === 0 ? (
            <div className="mt-8 text-center text-muted-foreground">
               {search ? "No products match your search" : "No products available"}
            </div>
         ) : (
            <div className="mt-6 flex flex-col gap-6">
               {grouped.map((group) => (
                  <Card key={group.name} className="border-border/70">
                     <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                           {group.name}
                           <Badge variant="outline" className="text-xs font-normal">
                              {group.products.length}
                           </Badge>
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                           {group.products.map((product) => (
                              <ProductCard
                                 key={product.id}
                                 product={product}
                                 inStock={inStockIds.has(product.id)}
                                 formatPrice={formatPrice}
                                 unitLabel={unitLabel}
                                 qtyUnit={qtyUnit}
                                 onClick={() => setSelectedProduct(product)}
                              />
                           ))}
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         )}

         <Dialog open={selectedProduct !== null} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
               {selectedProduct && (
                  <>
                     <DialogHeader>
                        <DialogTitle>{selectedProduct.name}</DialogTitle>
                     </DialogHeader>
                     <div className="flex flex-col gap-4 py-2">
                        <div className="relative aspect-video w-full rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                           {selectedProduct.thumbnail ? (
                              <img
                                 src={selectedProduct.thumbnail}
                                 alt={selectedProduct.name}
                                 className="h-full w-full object-cover"
                              />
                           ) : (
                              <Package className="h-16 w-16 text-muted-foreground/40" />
                           )}
                           <Badge
                              className={`absolute top-3 right-3 ${
                                 inStockIds.has(selectedProduct.id)
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                    : "bg-red-500/15 text-red-400 border-red-500/30"
                              }`}
                              variant="outline"
                           >
                              {inStockIds.has(selectedProduct.id) ? "In Stock" : "Out of Stock"}
                           </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                           <p className="text-2xl font-bold">
                              {formatPrice(Number(selectedProduct.sellPrice))}
                              <span className="text-base text-muted-foreground">
                                 /{selectedProduct.unit ?? "unit"}
                              </span>
                           </p>
                           <Badge variant="secondary">{selectedProduct.category.name}</Badge>
                        </div>

                        {selectedProduct.description && (
                           <p className="text-sm text-muted-foreground">
                              {selectedProduct.description}
                           </p>
                        )}

                        {selectedProduct.priceTiers.length > 0 && (
                           <div className="rounded-lg border border-border/70 p-4">
                              <div className="flex items-center justify-between mb-3">
                                 <p className="font-medium">Pricing</p>
                                 <Badge variant="secondary" className="text-xs">
                                    {selectedProduct.priceTiers.length} tier(s)
                                 </Badge>
                              </div>
                              <div className="flex flex-col gap-2">
                                 {(() => {
                                    const sorted = [...selectedProduct.priceTiers].sort((a, b) => a.qty - b.qty);
                                    const unit = selectedProduct.unit ?? "unit";
                                    const maxQtyLen = Math.max(...sorted.map(t => {
                                       const label = unit.length > 2 ? `${t.qty} ${unit}` : `${t.qty}${unit}`;
                                       return label.length + (t.qty !== 1 ? 3 : 0);
                                    }));
                                    const qtyWidth = Math.max(maxQtyLen * 7, 40);
                                    const maxRateLen = Math.max(...sorted.map(t => `(${formatPrice(Number(t.sellPrice) / t.qty)}/${unit})`.length));
                                    const rateWidth = Math.max(maxRateLen * 6.5, 60);
                                    return sorted.map((tier) => (
                                       <div key={tier.id} className="flex items-center bg-muted/30 rounded-md px-3 py-2">
                                          <span className="font-medium text-sm whitespace-nowrap" style={{ width: qtyWidth }}>
                                             {unit.length > 2 ? `${tier.qty} ${unit}` : `${tier.qty}${unit}`}{tier.qty !== 1 && <span className="text-[10px] text-muted-foreground/40">(s)</span>}
                                          </span>
                                          <span className="text-xs text-muted-foreground/50 whitespace-nowrap" style={{ width: rateWidth }}>
                                             ({formatPrice(Number(tier.sellPrice) / tier.qty)}/{unit})
                                          </span>
                                          <span className="font-semibold text-sm text-right flex-1">
                                             {formatPrice(Number(tier.sellPrice))}
                                          </span>
                                       </div>
                                    ));
                                 })()}
                              </div>
                           </div>
                        )}
                     </div>
                  </>
               )}
            </DialogContent>
         </Dialog>
      </div>
   );
}

function ProductCard({
   product,
   inStock,
   formatPrice,
   unitLabel,
   qtyUnit,
   onClick,
}: {
   product: Product;
   inStock: boolean;
   formatPrice: (n: number) => string;
   unitLabel: (u: string | null) => string;
   qtyUnit: (qty: number, unit: string | null) => string;
   onClick: () => void;
}) {
   const hasTiers = product.priceTiers.length > 0;

   return (
      <div
         className="group flex flex-col rounded-lg border border-border/70 bg-card overflow-hidden transition-colors hover:border-border/80 cursor-pointer"
         onClick={onClick}
      >
         <div className="relative aspect-square w-full bg-muted/30 flex items-center justify-center">
            {product.thumbnail ? (
               <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="h-full w-full object-cover"
               />
            ) : (
               <Package className="h-10 w-10 text-muted-foreground/40" />
            )}
            <Badge
               className={`absolute top-2 right-2 text-[10px] px-1.5 py-0 ${
                  inStock
                     ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                     : "bg-red-500/15 text-red-400 border-red-500/30"
               }`}
               variant="outline"
            >
               {inStock ? "In Stock" : "Out of Stock"}
            </Badge>
         </div>

         <div className="flex flex-col gap-1.5 p-3">
            <p className="font-medium text-sm leading-tight truncate" title={product.name}>
               {product.name}
            </p>

            {product.description && (
               <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.description}
               </p>
            )}

            <div className="flex items-baseline justify-between gap-1 mt-1.5">
               <span className="text-sm font-semibold">
                  {formatPrice(Number(product.sellPrice))}
               </span>
               <span className="text-[11px] text-muted-foreground">
                  /{product.unit ?? "unit"}
               </span>
            </div>

            {hasTiers && (
               <div className="mt-1 border-t border-border/30 pt-1.5">
                  <div className="flex items-center justify-between mb-1">
                     <p className="text-[10px] text-muted-foreground">Bulk Pricing</p>
                     <Badge variant="secondary" className="text-[9px] leading-none px-1 py-0">
                        {product.priceTiers.length}
                     </Badge>
                  </div>
                  <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
                     {product.priceTiers
                        .sort((a, b) => a.qty - b.qty)
                        .map((tier) => (
                           <Fragment key={tier.id}>
                              <span className="text-muted-foreground whitespace-nowrap">
                                 {((u: string | null) => { const unit = u ?? "unit"; return unit.length > 2 ? `${tier.qty} ${unit}` : `${tier.qty}${unit}`; })(product.unit)}{tier.qty !== 1 && <span className="text-[9px] text-muted-foreground/40">(s)</span>}
                              </span>
                              <span className="text-muted-foreground/50 whitespace-nowrap">
                                 ({formatPrice(Number(tier.sellPrice) / tier.qty)}/{product.unit ?? "unit"})
                              </span>
                              <span className="font-medium text-right">
                                 {formatPrice(Number(tier.sellPrice))}
                              </span>
                           </Fragment>
                        ))}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
