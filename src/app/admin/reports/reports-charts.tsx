"use client";

import { formatPrice } from "@/lib/formatters";
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

const COLORS = ["#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#d4d4d8", "#e4e4e7"];

type ReportsChartsProps = {
   dailySales: { date: string; revenue: number; profit: number; units: number }[];
   categoryBreakdown: { category: string; revenue: number; units: number }[];
   resellerPerformance: { name: string; revenue: number; units: number; sales: number }[];
};

const formatShortDate = (d: string) => {
   const date = new Date(d);
   return `${date.getMonth() + 1}/${date.getDate()}`;
};

export default function ReportsCharts({ dailySales, categoryBreakdown, resellerPerformance }: ReportsChartsProps) {
   return (
      <>
         {dailySales.length > 0 && (
            <Card className="mt-6">
               <CardHeader>
                  <CardTitle>Revenue & Profit Over Time</CardTitle>
               </CardHeader>
               <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                     <LineChart data={dailySales}>
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
            {categoryBreakdown.length > 0 && (
               <Card>
                  <CardHeader>
                     <CardTitle>Revenue by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                           <Pie
                              data={categoryBreakdown}
                              dataKey="revenue"
                              nameKey="category"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                           >
                              {categoryBreakdown.map((_, i) => (
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

            {resellerPerformance.length > 0 && (
               <Card>
                  <CardHeader>
                     <CardTitle>Reseller Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={resellerPerformance}>
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
      </>
   );
}
