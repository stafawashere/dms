"use client";

import { useState, useEffect } from "react";
import {
   BarChart,
   Bar,
   LineChart,
   Line,
   PieChart,
   Pie,
   Cell,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   Legend,
} from "recharts";
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

type ReportsData = {
   dailySales: { date: string; revenue: number; profit: number; units: number }[];
   categoryBreakdown: { category: string; revenue: number; units: number }[];
   productProfitability: {
      name: string;
      category: string;
      revenue: number;
      cost: number;
      profit: number;
      markup: number;
      units: number;
   }[];
   resellerPerformance: { name: string; revenue: number; units: number; sales: number }[];
   inventoryValue: number;
   inventorySellValue: number;
};

const COLORS = ["#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#d4d4d8", "#e4e4e7"];

export default function ReportsPage() {
   const [data, setData] = useState<ReportsData | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      let ignore = false;
      fetch("/api/admin/reports")
         .then((r) => r.json())
         .then((d) => { if (!ignore) { setData(d); setLoading(false); } });
      return () => { ignore = true; };
   }, []);

   const formatPrice = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

   const formatShortDate = (d: string) => {
      const date = new Date(d);
      return `${date.getMonth() + 1}/${date.getDate()}`;
   };

   if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
   if (!data) return <div className="p-6 text-muted-foreground">Error loading reports</div>;

   const totalRevenue = data.productProfitability.reduce((s, p) => s + p.revenue, 0);
   const totalProfit = data.productProfitability.reduce((s, p) => s + p.profit, 0);
   const totalCost = data.productProfitability.reduce((s, p) => s + p.cost, 0);

   return (
      <div>
         <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
         <p className="mt-1 text-muted-foreground">Analytics and performance data</p>

         <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{formatPrice(totalProfit)}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Inventory (Cost)</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{formatPrice(data.inventoryValue)}</p>
               </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Inventory (Sell)</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-2xl font-bold">{formatPrice(data.inventorySellValue)}</p>
               </CardContent>
            </Card>
         </div>

         {data.dailySales.length > 0 && (
            <Card className="mt-6">
               <CardHeader>
                  <CardTitle>Revenue & Profit Over Time</CardTitle>
               </CardHeader>
               <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                     <LineChart data={data.dailySales}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" tickFormatter={formatShortDate} stroke="#71717a" fontSize={12} />
                        <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                           contentStyle={{ backgroundColor: "#27272a", border: "1px solid #3f3f46", borderRadius: "8px" }}
                           labelStyle={{ color: "#a1a1aa" }}
                           formatter={(value) => formatPrice(Number(value))}
                           labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#d4d4d8" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="profit" stroke="#a1a1aa" strokeWidth={2} dot={false} />
                     </LineChart>
                  </ResponsiveContainer>
               </CardContent>
            </Card>
         )}

         <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {data.categoryBreakdown.length > 0 && (
               <Card>
                  <CardHeader>
                     <CardTitle>Revenue by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                           <Pie
                              data={data.categoryBreakdown}
                              dataKey="revenue"
                              nameKey="category"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                           >
                              {data.categoryBreakdown.map((_, i) => (
                                 <Cell key={i} fill={COLORS[i % COLORS.length]} />
                              ))}
                           </Pie>
                           <Tooltip
                              contentStyle={{ backgroundColor: "#27272a", border: "1px solid #3f3f46", borderRadius: "8px" }}
                              formatter={(value) => formatPrice(Number(value))}
                           />
                        </PieChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>
            )}

            {data.resellerPerformance.length > 0 && (
               <Card>
                  <CardHeader>
                     <CardTitle>Reseller Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data.resellerPerformance}>
                           <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                           <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                           <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${v}`} />
                           <Tooltip
                              contentStyle={{ backgroundColor: "#27272a", border: "1px solid #3f3f46", borderRadius: "8px" }}
                              formatter={(value) => formatPrice(Number(value))}
                           />
                           <Bar dataKey="revenue" fill="#a1a1aa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </CardContent>
               </Card>
            )}
         </div>

         <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Product Profitability</h2>
               <div className="rounded-md border border-border/70">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Product</TableHead>
                           <TableHead>Category</TableHead>
                           <TableHead className="text-right">Units</TableHead>
                           <TableHead className="text-right">Revenue</TableHead>
                           <TableHead className="text-right">Cost</TableHead>
                           <TableHead className="text-right">Profit</TableHead>
                           <TableHead className="text-right">Markup</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {data.productProfitability.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-6">No data</TableCell>
                           </TableRow>
                        ) : (
                           data.productProfitability.map((p, i) => (
                              <TableRow key={i}>
                                 <TableCell className="font-medium">{p.name}</TableCell>
                                 <TableCell>
                                    <Badge variant="outline">{p.category}</Badge>
                                 </TableCell>
                                 <TableCell className="text-right">{p.units}</TableCell>
                                 <TableCell className="text-right">{formatPrice(p.revenue)}</TableCell>
                                 <TableCell className="text-right text-muted-foreground">{formatPrice(p.cost)}</TableCell>
                                 <TableCell className="text-right font-medium">{formatPrice(p.profit)}</TableCell>
                                 <TableCell className="text-right">
                                    <Badge variant={p.markup > 50 ? "default" : p.markup > 0 ? "secondary" : "outline"}>
                                       {p.markup.toFixed(1)}%
                                    </Badge>
                                 </TableCell>
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </div>
         </div>

         <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Reseller Breakdown</h2>
               <div className="rounded-md border border-border/70">
                  <Table>
                     <TableHeader>
                        <TableRow>
                           <TableHead>Reseller</TableHead>
                           <TableHead className="text-right">Sales</TableHead>
                           <TableHead className="text-right">Units</TableHead>
                           <TableHead className="text-right">Revenue</TableHead>
                           <TableHead className="text-right">Avg per Sale</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {data.resellerPerformance.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No data</TableCell>
                           </TableRow>
                        ) : (
                           data.resellerPerformance.map((r, i) => (
                              <TableRow key={i}>
                                 <TableCell className="font-medium">{r.name}</TableCell>
                                 <TableCell className="text-right">{r.sales}</TableCell>
                                 <TableCell className="text-right">{r.units}</TableCell>
                                 <TableCell className="text-right">{formatPrice(r.revenue)}</TableCell>
                                 <TableCell className="text-right text-muted-foreground">
                                    {formatPrice(r.sales > 0 ? r.revenue / r.sales : 0)}
                                 </TableCell>
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </div>
         </div>
      </div>
   );
}
