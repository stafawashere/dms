"use client";

import { useState, useEffect } from "react";
import { formatPrice, unitLabel, formatDate } from "@/lib/formatters";
import { Plus, Trash2, ShoppingCart, User as UserIcon, Clock, CheckCircle, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchBar } from "@/components/search-bar";
import { NoteDialog } from "@/components/note-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import { cn } from "@/lib/utils";
import type { SaleProduct as Product, Sale } from "@/types/models";
import { SaleStatus } from "@/generated/prisma/enums";
import { NewSaleDialog } from "./new-sale-dialog";
import { SaleRow } from "./sale-row";

export default function SalesPage() {
   const [sales, setSales] = useState<Sale[]>([]);
   const [products, setProducts] = useState<Product[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [viewingNote, setViewingNote] = useState<string | null>(null);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [resellerFilter, setResellerFilter] = useState<string>("all");
   const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

   useEffect(() => {
      let ignore = false;
      Promise.all([
         fetch("/api/sales").then((r) => r.json()),
         fetch("/api/products").then((r) => r.json()),
      ]).then(([salesData, productsData]) => {
         if (!ignore) {
            setSales(salesData);
            setProducts(productsData);
            setLoading(false);
         }
      });
      return () => { ignore = true; };
   }, []);

   const fetchSales = async () => {
      const res = await fetch("/api/sales");
      setSales(await res.json());
   };

   async function handleDelete(id: string) {
      await fetch(`/api/sales/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      fetchSales();
   }

   async function handleApprove(id: string) {
      const res = await fetch(`/api/sales/${id}/approve`, { method: "PATCH" });
      if (res.ok) {
         setSales((prev) => prev.map((s) => s.id === id ? { ...s, status: SaleStatus.APPROVED } : s));
      }
   }

   async function handleApproveAll() {
      const pending = filtered.filter((s) => s.status === SaleStatus.PENDING);
      await Promise.all(
         pending.map((s) => fetch(`/api/sales/${s.id}/approve`, { method: "PATCH" }))
      );
      setSales((prev) =>
         prev.map((s) => pending.find((p) => p.id === s.id) ? { ...s, status: SaleStatus.APPROVED } : s)
      );
   }

   const filtered = sales.filter((sale) => {
      const matchesSearch =
         sale.product.name.toLowerCase().includes(search.toLowerCase()) ||
         sale.reseller.name.toLowerCase().includes(search.toLowerCase()) ||
         (sale.notes && sale.notes.toLowerCase().includes(search.toLowerCase()));
      const matchesReseller = resellerFilter === "all" || sale.resellerId === resellerFilter;
      return matchesSearch && matchesReseller;
   });

   const resellers = Array.from(
      new Map(sales.map((s) => [s.resellerId, s.reseller])).values()
   );

   const pendingSales = filtered.filter((s) => s.status === SaleStatus.PENDING);
   const approvedSales = filtered.filter((s) => s.status === SaleStatus.APPROVED);

   const totalRevenue = approvedSales.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);
   const totalUnits = approvedSales.reduce((sum, s) => sum + s.quantity, 0);
   const pendingRevenue = pendingSales.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);

   return (
      <div>
         <PageHeader
            title="Sales"
            description={`${totalUnits} unit(s) sold — ${formatPrice(totalRevenue)} revenue`}
         >
            <Button onClick={() => setDialogOpen(true)}>
               <Plus className="mr-2 h-4 w-4" />
               New Sale
            </Button>
         </PageHeader>

         {resellers.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
               {resellers.map((reseller) => {
                  const resellerSales = sales.filter((s) => s.resellerId === reseller.id && s.status === SaleStatus.APPROVED);
                  const revenue = resellerSales.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);
                  const units = resellerSales.reduce((sum, s) => sum + s.quantity, 0);
                  return (
                     <div
                        key={reseller.id}
                        className={cn(
                           "rounded-lg border border-border/70 p-4 cursor-pointer transition-colors",
                           resellerFilter === reseller.id
                              ? "bg-accent border-primary/30"
                              : "hover:bg-accent/50"
                        )}
                        onClick={() =>
                           setResellerFilter(resellerFilter === reseller.id ? "all" : reseller.id)
                        }
                     >
                        <div className="flex items-center gap-2">
                           <UserIcon className="h-4 w-4 text-muted-foreground" />
                           <span className="text-sm font-medium">{reseller.name}</span>
                           <Badge variant="outline" className="ml-auto text-xs">
                              {resellerSales.length} sale(s)
                           </Badge>
                        </div>
                        <div className="mt-2 flex items-baseline gap-3">
                           <span className="text-2xl font-bold">{formatPrice(revenue)}</span>
                           <span className="text-xs text-muted-foreground">
                              {units} unit(s)
                           </span>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}

         <div className="mt-6 flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by product, reseller, or notes..." />
            {resellerFilter !== "all" && (
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResellerFilter("all")}
                  className="text-xs"
               >
                  Clear filter
               </Button>
            )}
         </div>

         {pendingSales.length > 0 && (
            <div className="mt-6">
               <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                     <Clock className="h-4 w-4 text-yellow-500" />
                     <h2 className="text-lg font-semibold">Pending Approval</h2>
                     <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40" variant="outline">
                        {pendingSales.length}
                     </Badge>
                     <span className="text-sm text-muted-foreground ml-2">
                        {formatPrice(pendingRevenue)} pending
                     </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleApproveAll} className="text-xs">
                     <Check className="h-3 w-3 mr-1" />
                     Approve All
                  </Button>
               </div>
               <div className="rounded-lg border border-yellow-500/30">
                  <Table className="table-fixed">
                     <TableHeader>
                        <TableRow>
                           <TableHead className="w-[18%]">Date</TableHead>
                           <TableHead className="w-[18%]">Product</TableHead>
                           <TableHead className="w-[14%]">Reseller</TableHead>
                           <TableHead className="w-[8%] text-right">Qty</TableHead>
                           <TableHead className="w-[14%] text-right">Price</TableHead>
                           <TableHead className="w-[10%] text-right">Total</TableHead>
                           <TableHead className="w-[12%]">Notes</TableHead>
                           <TableHead className="w-[6%] text-right">Actions</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {pendingSales.map((sale) => (
                           <SaleRow
                              key={sale.id}
                              sale={sale}
                              onViewNote={setViewingNote}
                              onDelete={setConfirmDelete}
                              onApprove={handleApprove}
                           />
                        ))}
                     </TableBody>
                  </Table>
               </div>
            </div>
         )}

         <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
               <CheckCircle className="h-4 w-4 text-emerald-500" />
               <h2 className="text-lg font-semibold">Approved Sales</h2>
               {approvedSales.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                     {totalUnits} unit(s) — {formatPrice(totalRevenue)} revenue
                  </span>
               )}
            </div>
            <div className="rounded-lg border border-border/70">
               <Table className="table-fixed">
                  <TableHeader>
                     <TableRow>
                        <TableHead className="w-[18%]">Date</TableHead>
                        <TableHead className="w-[18%]">Product</TableHead>
                        <TableHead className="w-[14%]">Reseller</TableHead>
                        <TableHead className="w-[8%] text-right">Qty</TableHead>
                        <TableHead className="w-[14%] text-right">Price</TableHead>
                        <TableHead className="w-[10%] text-right">Total</TableHead>
                        <TableHead className="w-[12%]">Notes</TableHead>
                        <TableHead className="w-[6%] text-right">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {loading ? (
                        <TableRow>
                           <TableCell colSpan={8} className="text-center text-muted-foreground">
                              Loading...
                           </TableCell>
                        </TableRow>
                     ) : approvedSales.length === 0 ? (
                        <TableRow>
                           <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              {search || resellerFilter !== "all"
                                 ? "No sales match your filter"
                                 : "No approved sales yet"}
                           </TableCell>
                        </TableRow>
                     ) : (
                        approvedSales.map((sale) => (
                           <SaleRow
                              key={sale.id}
                              sale={sale}
                              onViewNote={setViewingNote}
                              onDelete={setConfirmDelete}
                           />
                        ))
                     )}
                  </TableBody>
               </Table>
            </div>
         </div>

         <NewSaleDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            products={products}
            onSaleCreated={fetchSales}
         />

         <ConfirmDialog
            open={!!confirmDelete}
            onOpenChange={() => setConfirmDelete(null)}
            title="Delete Sale"
            description="This will delete the sale and restore the stock to the reseller's inventory."
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
         />

         <NoteDialog note={viewingNote} onClose={() => setViewingNote(null)} />
      </div>
   );
}
