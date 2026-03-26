"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";

type Sale = {
   id: string;
   quantity: number;
   soldPrice: number;
   notes: string | null;
   createdAt: string;
   product: { name: string; unit: string | null };
};

export default function SalesHistoryPage() {
   const [sales, setSales] = useState<Sale[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");

   useEffect(() => {
      let ignore = false;
      fetch("/api/reseller/sales")
         .then((r) => r.json())
         .then((data) => { if (!ignore) { setSales(data); setLoading(false); } });
      return () => { ignore = true; };
   }, []);

   const unitLabel = (unit: string | null) => unit ? `${unit}(s)` : "unit(s)";
   const formatPrice = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
   const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("en-US", {
         month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
      });

   const filtered = sales.filter((s) =>
      s.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()))
   );

   const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);
   const totalUnits = filtered.reduce((sum, s) => sum + s.quantity, 0);

   if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

   return (
      <div>
         <div>
            <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
            <p className="mt-1 text-muted-foreground">
               {totalUnits} unit(s) sold — {formatPrice(totalRevenue)} revenue
            </p>
         </div>

         <div className="mt-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
               placeholder="Search by product or notes..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="max-w-sm"
            />
         </div>

         <div className="mt-4 rounded-md border border-border/40">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Date</TableHead>
                     <TableHead>Product</TableHead>
                     <TableHead className="text-right">Qty</TableHead>
                     <TableHead className="text-right">Price</TableHead>
                     <TableHead className="text-right">Total</TableHead>
                     <TableHead>Notes</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filtered.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                           {search ? "No sales match your search" : "No sales recorded yet"}
                        </TableCell>
                     </TableRow>
                  ) : (
                     filtered.map((sale) => (
                        <TableRow key={sale.id}>
                           <TableCell className="text-muted-foreground whitespace-nowrap">
                              {formatDate(sale.createdAt)}
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
                           <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {sale.notes || "-"}
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
