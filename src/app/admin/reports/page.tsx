"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { formatPrice } from "@/lib/formatters";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";

const ReportsCharts = dynamic(() => import("./reports-charts"), { ssr: false });

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

type Preset = "7d" | "30d" | "90d" | "all" | "custom";

function daysAgo(n: number) {
   const d = new Date();
   d.setDate(d.getDate() - n);
   return d.toISOString().split("T")[0];
}

function today() {
   return new Date().toISOString().split("T")[0];
}

export default function ReportsPage() {
   const [data, setData] = useState<ReportsData | null>(null);
   const [loading, setLoading] = useState(true);
   const [preset, setPreset] = useState<Preset>("30d");
   const [fromDate, setFromDate] = useState(daysAgo(30));
   const [toDate, setToDate] = useState(today());

   const fetchData = useCallback((from?: string, to?: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString();
      fetch(`/api/admin/reports${qs ? `?${qs}` : ""}`)
         .then((r) => r.json())
         .then((d) => { setData(d); setLoading(false); })
         .catch(() => setLoading(false));
   }, []);

   function selectPreset(value: Preset) {
      setPreset(value);
      if (value === "all") {
         fetchData();
      } else if (value === "custom") {
         fetchData(fromDate, toDate);
      } else {
         const days = value === "7d" ? 7 : value === "90d" ? 90 : 30;
         const from = daysAgo(days);
         const to = today();
         setFromDate(from);
         setToDate(to);
         fetchData(from, to);
      }
   }

   useEffect(() => {
      const params = new URLSearchParams();
      params.set("from", fromDate);
      params.set("to", toDate);
      fetch(`/api/admin/reports?${params}`)
         .then((r) => r.json())
         .then((d) => { setData(d); setLoading(false); })
         .catch(() => setLoading(false));
   }, []);

   function applyCustomRange() {
      fetchData(fromDate, toDate);
   }

   const presets: { label: string; value: Preset }[] = [
      { label: "7 Days", value: "7d" },
      { label: "30 Days", value: "30d" },
      { label: "90 Days", value: "90d" },
      { label: "All Time", value: "all" },
      { label: "Custom", value: "custom" },
   ];

   return (
      <div>
         <PageHeader title="Reports" description="Analytics and performance data" />

         <div className="mt-6 flex flex-wrap items-end gap-3">
            <div className="flex gap-1 rounded-lg border border-border/70 p-1">
               {presets.map((p) => (
                  <button
                     key={p.value}
                     onClick={() => selectPreset(p.value)}
                     className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        preset === p.value
                           ? "bg-primary text-primary-foreground"
                           : "text-muted-foreground hover:text-foreground hover:bg-muted"
                     }`}
                  >
                     {p.label}
                  </button>
               ))}
            </div>
            {preset === "custom" && (
               <div className="flex items-end gap-2">
                  <div className="relative">
                     <label className="absolute -top-5 left-0 text-xs text-muted-foreground">From</label>
                     <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-[150px] h-9"
                     />
                  </div>
                  <div className="relative">
                     <label className="absolute -top-5 left-0 text-xs text-muted-foreground">To</label>
                     <Input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-[150px] h-9"
                     />
                  </div>
                  <Button size="sm" className="h-9" onClick={applyCustomRange}>Apply</Button>
               </div>
            )}
         </div>

         {loading ? (
            <div className="mt-10 text-center text-muted-foreground">Loading...</div>
         ) : !data ? (
            <div className="mt-10 text-center text-muted-foreground">Error loading reports</div>
         ) : (
            <>
               <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                     <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <p className="text-2xl font-bold">
                           {formatPrice(data.productProfitability.reduce((s, p) => s + p.revenue, 0))}
                        </p>
                     </CardContent>
                  </Card>
                  <Card>
                     <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <p className="text-2xl font-bold">
                           {formatPrice(data.productProfitability.reduce((s, p) => s + p.profit, 0))}
                        </p>
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

               <ReportsCharts
                  dailySales={data.dailySales}
                  categoryBreakdown={data.categoryBreakdown}
                  resellerPerformance={data.resellerPerformance}
               />

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
            </>
         )}
      </div>
   );
}
