"use client";

import { formatPrice } from "@/lib/formatters";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Pencil, Trash2, ImageIcon } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types/models";

export type SortKey = "name" | "costPrice" | "sellPrice" | "markup" | null;
export type SortDir = "asc" | "desc";

type ProductTableProps = {
   products: Product[];
   categories: Category[];
   loading: boolean;
   search: string;
   sortKey: SortKey;
   sortDir: SortDir;
   toggleSort: (key: SortKey) => void;
   categoryFilter: Set<string>;
   toggleCategoryFilter: (id: string) => void;
   clearCategoryFilter: () => void;
   getMarkup: (p: Product) => number;
   onEdit: (product: Product) => void;
   onDelete: (id: string) => void;
   onViewTiers: (product: Product) => void;
};

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
   if (sortKey !== col) return <ArrowUpDown className="size-[11px] text-muted-foreground" />;
   return sortDir === "asc"
      ? <ArrowUp className="size-[11px] text-primary" />
      : <ArrowDown className="size-[11px] text-primary" />;
}

export function ProductTable({
   products,
   categories,
   loading,
   search,
   sortKey,
   sortDir,
   toggleSort,
   categoryFilter,
   toggleCategoryFilter,
   clearCategoryFilter,
   getMarkup,
   onEdit,
   onDelete,
   onViewTiers,
}: ProductTableProps) {
   return (
      <div className="mt-4 rounded-lg border border-border/70">
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>
                     <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                        Name <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                     </button>
                  </TableHead>
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
                              <Filter className={cn("size-[11px]", categoryFilter.size > 0 ? "text-primary" : "text-muted-foreground")} />
                           </PopoverTrigger>
                           <PopoverContent align="start" className="w-48">
                              <div className="flex flex-col gap-2">
                                 <p className="text-xs font-medium text-muted-foreground">Filter by category</p>
                                 {categories.map((cat) => (
                                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm">
                                       <Checkbox
                                          checked={categoryFilter.has(cat.id)}
                                          onCheckedChange={() => toggleCategoryFilter(cat.id)}
                                       />
                                       {cat.name}
                                    </label>
                                 ))}
                                 {categoryFilter.size > 0 && (
                                    <Button
                                       variant="ghost"
                                       size="sm"
                                       className="mt-1 h-7 text-xs"
                                       onClick={clearCategoryFilter}
                                    >
                                       Clear filter
                                    </Button>
                                 )}
                              </div>
                           </PopoverContent>
                        </Popover>
                     </div>
                  </TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">
                     <button className="ml-auto flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("costPrice")}>
                        Cost <SortIcon col="costPrice" sortKey={sortKey} sortDir={sortDir} />
                     </button>
                  </TableHead>
                  <TableHead className="text-right">
                     <button className="ml-auto flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("sellPrice")}>
                        Sell <SortIcon col="sellPrice" sortKey={sortKey} sortDir={sortDir} />
                     </button>
                  </TableHead>
                  <TableHead className="text-right">
                     <button className="ml-auto flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("markup")}>
                        Markup <SortIcon col="markup" sortKey={sortKey} sortDir={sortDir} />
                     </button>
                  </TableHead>
                  <TableHead className="text-center">Bulk</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {loading ? (
                  <TableRow>
                     <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Loading...
                     </TableCell>
                  </TableRow>
               ) : products.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={8} className="text-center text-muted-foreground">
                        {search ? "No products match your search" : "No products yet"}
                     </TableCell>
                  </TableRow>
               ) : (
                  products.map((product) => {
                     const margin = getMarkup(product).toFixed(1);
                     return (
                        <TableRow key={product.id}>
                           <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                 {product.thumbnail ? (
                                    <img
                                       src={product.thumbnail}
                                       alt={product.name}
                                       className="h-8 w-8 rounded object-cover"
                                    />
                                 ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                                       <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                 )}
                                 {product.name}
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge variant="secondary">{product.category.name}</Badge>
                           </TableCell>
                           <TableCell className="text-muted-foreground">
                              {product.unit ?? "unit"}
                           </TableCell>
                           <TableCell className="text-right">
                              {formatPrice(product.costPrice)}/{product.unit ?? "unit"}
                           </TableCell>
                           <TableCell className="text-right">
                              {formatPrice(product.sellPrice)}/{product.unit ?? "unit"}
                           </TableCell>
                           <TableCell className="text-right text-muted-foreground">{margin}%</TableCell>
                           <TableCell className="text-center">
                              {product.priceTiers.length > 0 ? (
                                 <Badge
                                    variant="outline"
                                    className="cursor-pointer hover:bg-accent"
                                    onClick={() => onViewTiers(product)}
                                 >
                                    {product.priceTiers.length} tier(s)
                                 </Badge>
                              ) : (
                                 <span className="text-muted-foreground">-</span>
                              )}
                           </TableCell>
                           <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                 <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                                    <Pencil className="h-4 w-4" />
                                 </Button>
                                 <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                 </Button>
                              </div>
                           </TableCell>
                        </TableRow>
                     );
                  })
               )}
            </TableBody>
         </Table>
      </div>
   );
}
