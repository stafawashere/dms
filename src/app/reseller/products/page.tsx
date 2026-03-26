"use client";

import { useState, useEffect } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PriceTier = {
   id: string;
   minQty: number;
   maxQty: number | null;
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
               {products.length} product(s) across {grouped.length} categor{grouped.length === 1 ? "y" : "ies"}
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
                  <Card key={group.name} className="border-border/40">
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
                              />
                           ))}
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         )}
      </div>
   );
}

function ProductCard({
   product,
   inStock,
   formatPrice,
   unitLabel,
}: {
   product: Product;
   inStock: boolean;
   formatPrice: (n: number) => string;
   unitLabel: (u: string | null) => string;
}) {
   const hasTiers = product.priceTiers.length > 0;

   return (
      <div className="group flex flex-col rounded-lg border border-border/40 bg-card overflow-hidden transition-colors hover:border-border/80">
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

            <div className="flex items-baseline justify-between gap-1">
               <span className="text-sm font-semibold">
                  {formatPrice(Number(product.sellPrice))}
               </span>
               <span className="text-[11px] text-muted-foreground">
                  /{unitLabel(product.unit)}
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
                  <div className="flex flex-col gap-0.5">
                     {product.priceTiers
                        .sort((a, b) => a.minQty - b.minQty)
                        .map((tier) => (
                           <div key={tier.id} className="flex justify-between text-[11px]">
                              <span className="text-muted-foreground">
                                 {tier.minQty}{tier.maxQty ? `–${tier.maxQty}` : "+"}
                              </span>
                              <span className="font-medium">
                                 {formatPrice(Number(tier.sellPrice))}
                              </span>
                           </div>
                        ))}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
