"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Warehouse, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";

type DashboardData = {
   stats: {
      totalSales: number;
      totalRevenue: number;
      totalStock: number;
      productCount: number;
   };
   recentSales: {
      id: string;
      quantity: number;
      soldPrice: number;
      createdAt: string;
      product: { name: string; unit: string | null };
   }[];
   inventory: {
      id: string;
      quantity: number;
      product: { name: string; unit: string | null };
   }[];
};

export default function ResellerDashboard() {
   const [data, setData] = useState<DashboardData | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      let ignore = false;
      fetch("/api/reseller/dashboard")
         .then((r) => r.json())
         .then((d) => { if (!ignore) { setData(d); setLoading(false); } });
      return () => { ignore = true; };
   }, []);

   const formatPrice = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

   const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

   const unitLabel = (unit: string | null) => unit ? `${unit}(s)` : "unit(s)";

   if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
   if (!data) return <div className="p-6 text-muted-foreground">Error loading dashboard</div>;

   return (
      <div>
         <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
         <p className="mt-1 text-muted-foreground">Your sales and inventory overview</p>

         <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{data.stats.totalSales}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{formatPrice(data.stats.totalRevenue)}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{data.stats.totalStock}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{data.stats.productCount}</p>
               </CardContent>
            </Card>
         </div>

         <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
               <h2 className="text-lg font-semibold mb-3">Recent Sales</h2>
               <div className="rounded-md border border-border/40">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Product</TableHead>
                           <TableHead className="text-right">Qty</TableHead>
                           <TableHead className="text-right">Total</TableHead>
                           <TableHead>Date</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {data.recentSales.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                 No sales yet
                              </TableCell>
                           </TableRow>
                        ) : (
                           data.recentSales.map((sale) => (
                              <TableRow key={sale.id}>
                                 <TableCell className="font-medium">{sale.product.name}</TableCell>
                                 <TableCell className="text-right">{sale.quantity} {unitLabel(sale.product.unit)}</TableCell>
                                 <TableCell className="text-right">{formatPrice(Number(sale.soldPrice) * sale.quantity)}</TableCell>
                                 <TableCell className="text-muted-foreground">{formatDate(sale.createdAt)}</TableCell>
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </div>
            </div>

            <div>
               <h2 className="text-lg font-semibold mb-3">My Inventory</h2>
               <div className="rounded-md border border-border/40">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Product</TableHead>
                           <TableHead className="text-right">Stock</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {data.inventory.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                                 No inventory assigned
                              </TableCell>
                           </TableRow>
                        ) : (
                           data.inventory.map((inv) => (
                              <TableRow key={inv.id}>
                                 <TableCell className="font-medium">{inv.product.name}</TableCell>
                                 <TableCell className="text-right">{inv.quantity} {unitLabel(inv.product.unit)}</TableCell>
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </div>
            </div>
         </div>
      </div>
   );
}
