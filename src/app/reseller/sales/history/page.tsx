"use client";

import { useState, useEffect, Suspense } from "react";
import { formatPrice } from "@/lib/formatters";
import { useSearchParams } from "next/navigation";
import { Plus, Clock, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchBar } from "@/components/search-bar";
import { NoteDialog } from "@/components/note-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesTable } from "./sales-table";
import { NewSaleDialog } from "./new-sale-dialog";
import { SaleStatus } from "@/generated/prisma/enums";
import type { ResellerSale as Sale, InventoryItem } from "@/types/models";

export default function SalesHistoryPage() {
   return (
      <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
         <SalesHistoryContent />
      </Suspense>
   );
}

function SalesHistoryContent() {
   const searchParams = useSearchParams();
   const [sales, setSales] = useState<Sale[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [viewingNote, setViewingNote] = useState<string | null>(null);

   const [dialogOpen, setDialogOpen] = useState(false);
   const [inventory, setInventory] = useState<InventoryItem[]>([]);
   const [invLoading, setInvLoading] = useState(false);

   useEffect(() => {
      let ignore = false;
      fetch("/api/reseller/sales")
         .then((r) => r.json())
         .then((data) => { if (!ignore) { setSales(data); setLoading(false); } });
      return () => { ignore = true; };
   }, []);

   useEffect(() => {
      if (searchParams.get("new") === "true") {
         openNewSaleDialog();
      }
   }, [searchParams]);

   function openNewSaleDialog() {
      setDialogOpen(true);
      if (inventory.length === 0) {
         setInvLoading(true);
         fetch("/api/reseller/inventory")
            .then((r) => r.json())
            .then((data) => {
               setInventory(data.filter((i: InventoryItem) => i.quantity > 0));
               setInvLoading(false);
            });
      }
   }

   function handleSaleCreated(newSale: Sale) {
      setSales((prev) => [newSale, ...prev]);
   }

   function handleInventoryUpdate(productId: string, quantitySold: number) {
      setInventory((prev) =>
         prev.map((i) =>
            i.product.id === productId
               ? { ...i, quantity: i.quantity - quantitySold }
               : i
         ).filter((i) => i.quantity > 0)
      );
   }

   const filtered = sales.filter((s) =>
      s.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()))
   );

   const pendingSales = filtered.filter((s) => s.status === SaleStatus.PENDING);
   const approvedSales = filtered.filter((s) => s.status === SaleStatus.APPROVED);

   const totalRevenue = approvedSales.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);
   const totalUnits = approvedSales.reduce((sum, s) => sum + s.quantity, 0);

   if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

   return (
      <div>
         <PageHeader title="Sales" description="Track your sales and payment status">
            <Button onClick={openNewSaleDialog}>
               <Plus className="h-4 w-4 mr-2" />
               New Sale
            </Button>
         </PageHeader>

         <div className="mt-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by product or notes..." />
         </div>

         {pendingSales.length > 0 && (
            <div className="mt-6">
               <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <h2 className="text-lg font-semibold">Pending Approval</h2>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40" variant="outline">
                     {pendingSales.length}
                  </Badge>
               </div>
               <SalesTable rows={pendingSales} emptyMessage="No pending sales" onViewNote={setViewingNote} />
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
            <SalesTable rows={approvedSales} emptyMessage={search ? "No sales match your search" : "No approved sales yet"} onViewNote={setViewingNote} />
         </div>

         <NewSaleDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            inventory={inventory}
            invLoading={invLoading}
            onSaleCreated={handleSaleCreated}
            onInventoryUpdate={handleInventoryUpdate}
         />

         <NoteDialog note={viewingNote} onClose={() => setViewingNote(null)} />
      </div>
   );
}
