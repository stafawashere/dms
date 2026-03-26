"use client";

import { useState, useEffect } from "react";
import { Search, Warehouse, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";

type InventoryItem = {
   id: string;
   quantity: number;
   product: {
      id: string;
      name: string;
      unit: string | null;
      sellPrice: number;
      category: { name: string };
   };
};

export default function ResellerInventoryPage() {
   const [inventory, setInventory] = useState<InventoryItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());

   useEffect(() => {
      let ignore = false;
      fetch("/api/reseller/inventory")
         .then((r) => r.json())
         .then((data) => { if (!ignore) { setInventory(data); setLoading(false); } });
      return () => { ignore = true; };
   }, []);

   const unitLabel = (unit: string | null) => unit ? `${unit}(s)` : "unit(s)";

   const formatPrice = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

   const categories = Array.from(
      new Map(inventory.map((inv) => [inv.product.category.name, inv.product.category.name])).values()
   );

   function toggleCategoryFilter(cat: string) {
      setCategoryFilter((prev) => {
         const next = new Set(prev);
         if (next.has(cat)) next.delete(cat);
         else next.add(cat);
         return next;
      });
   }

   const filtered = inventory.filter((inv) => {
      const matchesSearch = inv.product.name.toLowerCase().includes(search.toLowerCase()) ||
         inv.product.category.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter.size === 0 || categoryFilter.has(inv.product.category.name);
      return matchesSearch && matchesCategory;
   });

   const totalStock = filtered.reduce((sum, i) => sum + i.quantity, 0);

   if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

   return (
      <div>
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold tracking-tight">My Inventory</h1>
               <p className="mt-1 text-muted-foreground">
                  {inventory.length} product(s) — {totalStock} total unit(s)
               </p>
            </div>
         </div>

         <div className="mt-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
               placeholder="Search by product or category..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="max-w-sm"
            />
         </div>

         <div className="mt-4 rounded-md border border-border/40">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Product</TableHead>
                     <TableHead>
                        <div className="flex items-center gap-1">
                           Category
                           <Popover>
                              <PopoverTrigger
                                 render={
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       className="h-6 w-6"
                                    />
                                 }
                              >
                                 <Filter className={cn("size-[11px]", categoryFilter.size > 0 && "text-primary")} />
                              </PopoverTrigger>
                              <PopoverContent align="start" className="w-48">
                                 <div className="flex flex-col gap-2">
                                    <p className="text-xs font-medium text-muted-foreground">Filter by category</p>
                                    {categories.map((cat) => (
                                       <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
                                          <Checkbox
                                             checked={categoryFilter.has(cat)}
                                             onCheckedChange={() => toggleCategoryFilter(cat)}
                                          />
                                          {cat}
                                       </label>
                                    ))}
                                    {categoryFilter.size > 0 && (
                                       <Button
                                          variant="ghost"
                                          size="sm"
                                          className="mt-1 h-7 text-xs"
                                          onClick={() => setCategoryFilter(new Set())}
                                       >
                                          Clear filter
                                       </Button>
                                    )}
                                 </div>
                              </PopoverContent>
                           </Popover>
                        </div>
                     </TableHead>
                     <TableHead className="text-right">Sell Price</TableHead>
                     <TableHead className="text-right">Stock</TableHead>
                     <TableHead className="text-right">Value</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filtered.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                           {search ? "No products match your search" : "No inventory assigned yet"}
                        </TableCell>
                     </TableRow>
                  ) : (
                     filtered.map((inv) => (
                        <TableRow key={inv.id}>
                           <TableCell>
                              <div className="flex items-center gap-2">
                                 <Warehouse className="h-4 w-4 text-muted-foreground" />
                                 <span className="font-medium">{inv.product.name}</span>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge variant="outline">{inv.product.category.name}</Badge>
                           </TableCell>
                           <TableCell className="text-right">
                              {formatPrice(Number(inv.product.sellPrice))}/{unitLabel(inv.product.unit)}
                           </TableCell>
                           <TableCell className="text-right">
                              {inv.quantity} {unitLabel(inv.product.unit)}
                           </TableCell>
                           <TableCell className="text-right font-medium">
                              {formatPrice(Number(inv.product.sellPrice) * inv.quantity)}
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </div>
      </div>
   );
}
