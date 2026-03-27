"use client";

import { useState, useEffect } from "react";
import {
   Package,
   Users,
   DollarSign,
   TrendingUp,
   ShoppingCart,
   Warehouse,
   ArrowUpDown,
   AlertTriangle,
   X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      products: number;
      resellers: number;
      totalRevenue: number;
      totalProfit: number;
      totalUnits: number;
      totalStock: number;
      monthlyRevenue: number;
   };
   recentSales: {
      id: string;
      quantity: number;
      soldPrice: number;
      createdAt: string;
      product: { name: string };
      reseller: { name: string };
   }[];
   recentMovements: {
      id: string;
      quantity: number;
      type: string;
      createdAt: string;
      product: { name: string };
      user: { name: string };
      performedBy: { name: string };
   }[];
   lowStock: { product: string; user: string; quantity: number; unit: string | null }[];
   topProducts: { name: string; revenue: number; units: number }[];
   topResellers: { name: string; revenue: number; sales: number }[];
};

const ALERT_DISMISS_DURATION = 1;

export default function AdminDashboard() {
   const [data, setData] = useState<DashboardData | null>(null);
   const [loading, setLoading] = useState(true);
   const [alertsDismissed, setAlertsDismissed] = useState(() => {
      if (typeof window === "undefined") return false;
      const dismissed = localStorage.getItem("lowStockDismissed");
      return !!dismissed && Date.now() - parseInt(dismissed) < ALERT_DISMISS_DURATION;
   });

   useEffect(() => {
      let ignore = false;
      fetch("/api/admin/dashboard")
         .then((r) => r.json())
         .then((d) => { if (!ignore) { setData(d); setLoading(false); } });
      return () => { ignore = true; };
   }, []);

   function dismissAlerts() {
      localStorage.setItem("lowStockDismissed", String(Date.now()));
      setAlertsDismissed(true);
   }

   const formatPrice = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

   const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("en-US", {
         month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      });

   if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
   if (!data) return <div className="p-6 text-muted-foreground">Error loading dashboard</div>;

   return (
      <div>
         <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
         <p className="mt-1 text-muted-foreground">Overview of your distribution network</p>

         <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{formatPrice(data.stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                     {formatPrice(data.stats.monthlyRevenue)} this month
                  </p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{formatPrice(data.stats.totalProfit)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                     {data.stats.totalRevenue > 0
                        ? `${(((data.stats.totalProfit) / data.stats.totalRevenue) * 100).toFixed(1)}% margin`
                        : "No sales yet"}
                  </p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{data.stats.products}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                     {data.stats.totalStock} total in stock
                  </p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resellers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{data.stats.resellers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                     {data.stats.totalUnits} units sold total
                  </p>
               </CardContent>
            </Card>
         </div>

         {data.lowStock.length > 0 && !alertsDismissed && (
            <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
               <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-500">Low Stock Alerts</span>
                  <button
                     onClick={dismissAlerts}
                     className="ml-auto text-yellow-500/60 hover:text-yellow-500 transition-colors"
                  >
                     <X className="h-4 w-4" />
                  </button>
               </div>
               <div className="flex flex-wrap gap-2">
                  {data.lowStock.map((item, i) => (
                     <Badge key={i} variant="outline" className="border-yellow-500/30 text-yellow-500">
                        {item.product} — {item.user} ({item.quantity}{item.unit ? (item.unit.length > 2 ? ` ${item.unit}` : item.unit) : " unit"}{item.quantity !== 1 ? "s" : ""} left)
                     </Badge>
                  ))}
               </div>
            </div>
         )}

         <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
               <h2 className="text-lg font-semibold mb-3">Top Products</h2>
               <div className="rounded-md border border-border/70">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Product</TableHead>
                           <TableHead className="text-right">Units</TableHead>
                           <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {data.topProducts.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-6">No data</TableCell>
                           </TableRow>
                        ) : (
                           data.topProducts.map((p, i) => (
                              <TableRow key={i}>
                                 <TableCell className="font-medium">{p.name}</TableCell>
                                 <TableCell className="text-right">{p.units}</TableCell>
                                 <TableCell className="text-right">{formatPrice(p.revenue)}</TableCell>
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </div>
            </div>

            <div>
               <h2 className="text-lg font-semibold mb-3">Top Resellers</h2>
               <div className="rounded-md border border-border/70">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Reseller</TableHead>
                           <TableHead className="text-right">Sales</TableHead>
                           <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {data.topResellers.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-6">No data</TableCell>
                           </TableRow>
                        ) : (
                           data.topResellers.map((r, i) => (
                              <TableRow key={i}>
                                 <TableCell className="font-medium">{r.name}</TableCell>
                                 <TableCell className="text-right">{r.sales}</TableCell>
                                 <TableCell className="text-right">{formatPrice(r.revenue)}</TableCell>
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </div>
            </div>
         </div>

         <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
               <h2 className="text-lg font-semibold mb-3">Recent Sales</h2>
               <div className="rounded-md border border-border/70">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Product</TableHead>
                           <TableHead>Reseller</TableHead>
                           <TableHead className="text-right">Total</TableHead>
                           <TableHead>Date</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {data.recentSales.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No recent sales</TableCell>
                           </TableRow>
                        ) : (
                           data.recentSales.map((sale) => (
                              <TableRow key={sale.id}>
                                 <TableCell>
                                    <div className="flex items-center gap-2">
                                       <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                                       <span className="font-medium">{sale.product.name}</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="text-muted-foreground">{sale.reseller.name}</TableCell>
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
               <h2 className="text-lg font-semibold mb-3">Recent Stock Movements</h2>
               <div className="rounded-md border border-border/70">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Product</TableHead>
                           <TableHead>User</TableHead>
                           <TableHead>Type</TableHead>
                           <TableHead className="text-right">Qty</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {data.recentMovements.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No recent movements</TableCell>
                           </TableRow>
                        ) : (
                           data.recentMovements.map((m) => (
                              <TableRow key={m.id}>
                                 <TableCell>
                                    <div className="flex items-center gap-2">
                                       <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                                       <span className="font-medium">{m.product.name}</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="text-muted-foreground">{m.user.name}</TableCell>
                                 <TableCell>
                                    <Badge variant={m.type === "IN" ? "default" : m.type === "OUT" ? "secondary" : "outline"}>
                                       {m.type}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="text-right">{m.quantity}</TableCell>
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
