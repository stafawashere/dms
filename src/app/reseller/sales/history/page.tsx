"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ShoppingCart, Plus, Clock, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Sale = {
   id: string;
   quantity: number;
   soldPrice: number;
   notes: string | null;
   status: "PENDING" | "APPROVED";
   createdAt: string;
   product: { name: string; unit: string | null };
};

type InventoryItem = {
   id: string;
   quantity: number;
   product: {
      id: string;
      name: string;
      unit: string | null;
      sellPrice: number;
      priceTiers: { qty: number; sellPrice: number }[];
   };
};

type PricingMode = "auto" | "custom-per-unit" | "flat-total";

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
   const [productId, setProductId] = useState("");
   const [quantity, setQuantity] = useState("");
   const [soldPrice, setSoldPrice] = useState("");
   const [flatTotal, setFlatTotal] = useState("");
   const [pricingMode, setPricingMode] = useState<PricingMode>("auto");
   const [notes, setNotes] = useState("");
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState("");

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

   function resetForm() {
      setProductId("");
      setQuantity("");
      setSoldPrice("");
      setFlatTotal("");
      setPricingMode("auto");
      setNotes("");
      setError("");
   }

   const selected = inventory.find((i) => i.product.id === productId);
   const unitLabel = (unit: string | null) => unit ? `${unit}(s)` : "unit(s)";
   const formatPrice = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
   const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("en-US", {
         month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
      });

   function getApplicablePrice(item: InventoryItem, qty: number): number {
      const tiers = item.product.priceTiers;
      if (!tiers || tiers.length === 0) return Number(item.product.sellPrice);
      const match = tiers.find((t) => t.qty === qty);
      if (match) return Number(match.sellPrice) / qty;
      return Number(item.product.sellPrice);
   }

   function handleProductChange(id: string | null) {
      if (!id) return;
      setProductId(id);
      const item = inventory.find((i) => i.product.id === id);
      if (item && quantity && pricingMode === "auto") {
         setSoldPrice(String(getApplicablePrice(item, parseInt(quantity) || 1)));
      }
   }

   function handleQuantityChange(value: string) {
      setQuantity(value);
      if (selected && value && pricingMode === "auto") {
         setSoldPrice(String(getApplicablePrice(selected, parseInt(value))));
      }
   }

   function switchPricingMode(mode: PricingMode) {
      setPricingMode(mode);
      if (mode === "auto" && selected && quantity) {
         setSoldPrice(String(getApplicablePrice(selected, parseInt(quantity) || 1)));
         setFlatTotal("");
      } else if (mode === "flat-total") {
         setFlatTotal("");
      }
   }

   function getFinalSoldPrice(): number {
      if (pricingMode === "flat-total" && flatTotal && quantity) {
         return parseFloat(flatTotal) / parseInt(quantity);
      }
      return parseFloat(soldPrice);
   }

   function getFinalTotal(): number {
      if (pricingMode === "flat-total" && flatTotal) return parseFloat(flatTotal);
      if (soldPrice && quantity) return parseFloat(soldPrice) * parseInt(quantity);
      return 0;
   }

   async function handleSubmit() {
      const isFlat = pricingMode === "flat-total";
      if (!productId || !quantity || (isFlat ? !flatTotal : !soldPrice)) return;
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/reseller/sales", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            productId,
            quantity: parseInt(quantity),
            soldPrice: getFinalSoldPrice(),
            notes: notes.trim() || null,
         }),
      });

      if (!res.ok) {
         const data = await res.json();
         setError(data.error || "Failed to record sale");
         setSubmitting(false);
         return;
      }

      const newSale = await res.json();
      setSales((prev) => [newSale, ...prev]);
      const item = inventory.find((i) => i.product.id === productId);
      if (item) {
         setInventory((prev) =>
            prev.map((i) =>
               i.product.id === productId
                  ? { ...i, quantity: i.quantity - parseInt(quantity) }
                  : i
            ).filter((i) => i.quantity > 0)
         );
      }
      resetForm();
      setSubmitting(false);
      setDialogOpen(false);
   }

   const filtered = sales.filter((s) =>
      s.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()))
   );

   const pendingSales = filtered.filter((s) => s.status === "PENDING");
   const approvedSales = filtered.filter((s) => s.status === "APPROVED");

   const totalRevenue = approvedSales.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);
   const totalUnits = approvedSales.reduce((sum, s) => sum + s.quantity, 0);

   if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

   function SalesTable({ rows, emptyMessage }: { rows: Sale[]; emptyMessage: string }) {
      return (
         <div className="rounded-md border border-border/70">
            <Table className="table-fixed">
               <TableHeader>
                  <TableRow>
                     <TableHead className="w-[30%]">Date</TableHead>
                     <TableHead className="w-[25%]">Product</TableHead>
                     <TableHead className="w-[10%] text-right">Qty</TableHead>
                     <TableHead className="w-[15%] text-right">Price</TableHead>
                     <TableHead className="w-[10%] text-right">Total</TableHead>
                     <TableHead className="w-[10%]">Notes</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {rows.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                           {emptyMessage}
                        </TableCell>
                     </TableRow>
                  ) : (
                     rows.map((sale) => (
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
                           <TableCell
                              className={cn(
                                 "text-sm text-muted-foreground truncate",
                                 sale.notes && "cursor-pointer hover:text-foreground"
                              )}
                              onClick={() => sale.notes && setViewingNote(sale.notes)}
                           >
                              {sale.notes || "-"}
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </div>
      );
   }

   return (
      <div>
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
               <p className="mt-1 text-muted-foreground">
                  Track your sales and payment status
               </p>
            </div>
            <Button onClick={openNewSaleDialog}>
               <Plus className="h-4 w-4 mr-2" />
               New Sale
            </Button>
         </div>

         <div className="mt-4 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
               placeholder="Search by product or notes..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9"
            />
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
               <SalesTable rows={pendingSales} emptyMessage="No pending sales" />
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
            <SalesTable rows={approvedSales} emptyMessage={search ? "No sales match your search" : "No approved sales yet"} />
         </div>

         <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogContent className="max-w-md">
               <DialogHeader>
                  <DialogTitle>New Sale</DialogTitle>
               </DialogHeader>
               {invLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading inventory...</div>
               ) : (
                  <div className="flex flex-col gap-4">
                     <div className="flex flex-col gap-2">
                        <Label>Product</Label>
                        <Select value={productId} onValueChange={handleProductChange}>
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select product">
                                 {selected?.product.name ?? "Select product"}
                              </SelectValue>
                           </SelectTrigger>
                           <SelectContent>
                              {inventory.map((inv) => (
                                 <SelectItem key={inv.product.id} value={inv.product.id}>
                                    {inv.product.name} ({inv.quantity} in stock)
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     {selected && (
                        <div className="rounded-md bg-accent/50 px-3 py-2 text-sm">
                           <span className="text-muted-foreground">Available: </span>
                           <span className="font-medium">{selected.quantity} {unitLabel(selected.product.unit)}</span>
                        </div>
                     )}

                     <div className="flex flex-col gap-2">
                        <Label>Pricing</Label>
                        <div className="rounded-lg border border-border/70 bg-accent/30 p-3 flex flex-col gap-3">
                           <div className="grid grid-cols-2 gap-3">
                              <Button
                                 variant={pricingMode !== "flat-total" ? "default" : "outline"}
                                 size="sm"
                                 className="text-xs h-7"
                                 onClick={() => switchPricingMode(pricingMode === "flat-total" ? "auto" : pricingMode)}
                              >
                                 Per Unit
                              </Button>
                              <Button
                                 variant={pricingMode === "flat-total" ? "default" : "outline"}
                                 size="sm"
                                 className="text-xs h-7"
                                 onClick={() => switchPricingMode("flat-total")}
                              >
                                 Flat
                              </Button>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1.5">
                                 <span className="text-xs text-muted-foreground">Quantity</span>
                                 <Input
                                    type="number"
                                    min="1"
                                    max={selected?.quantity}
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    placeholder="0"
                                 />
                              </div>
                              {pricingMode === "flat-total" ? (
                                 <div className="flex flex-col gap-1.5">
                                    <span className="text-xs text-muted-foreground">Flat</span>
                                    <Input
                                       type="number"
                                       step="0.01"
                                       min="0"
                                       value={flatTotal}
                                       onChange={(e) => setFlatTotal(e.target.value)}
                                       placeholder="50.00"
                                       className="border-blue-500/50"
                                    />
                                 </div>
                              ) : (
                                 <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                       <span className="text-xs text-muted-foreground">Rate Price</span>
                                       <Button
                                          variant="ghost"
                                          size="sm"
                                          className={cn(
                                             "h-4 px-1 text-[10px] rounded",
                                             pricingMode === "auto"
                                                ? "text-muted-foreground"
                                                : "text-yellow-500"
                                          )}
                                          onClick={() => switchPricingMode(pricingMode === "auto" ? "custom-per-unit" : "auto")}
                                       >
                                          {pricingMode === "auto" ? "Auto" : "Custom"}
                                       </Button>
                                    </div>
                                    <div className="relative">
                                       <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={soldPrice}
                                          onChange={(e) => {
                                             if (pricingMode === "auto") setPricingMode("custom-per-unit");
                                             setSoldPrice(e.target.value);
                                          }}
                                          placeholder="0.00"
                                          className={cn(
                                             "pr-16",
                                             pricingMode === "custom-per-unit" && "border-yellow-500/50"
                                          )}
                                       />
                                       {selected && (
                                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                             /{unitLabel(selected.product.unit)}
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     {pricingMode === "flat-total" && flatTotal && quantity && (
                        <div className="rounded-md bg-blue-500/10 px-3 py-2 text-sm">
                           <div className="flex justify-between">
                              <span className="text-blue-400">Rate per {unitLabel(selected?.product.unit ?? null)}</span>
                              <span className="text-blue-400 font-medium">
                                 {formatPrice(parseFloat(flatTotal) / parseInt(quantity))}
                              </span>
                           </div>
                        </div>
                     )}

                     {selected && quantity && getFinalTotal() > 0 && (
                        <div className="rounded-md bg-accent/50 p-3 text-sm">
                           <div className="flex justify-between">
                              <span className="text-muted-foreground">Total</span>
                              <span className="text-lg font-bold">{formatPrice(getFinalTotal())}</span>
                           </div>
                        </div>
                     )}

                     <div className="flex flex-col gap-2">
                        <Label>Notes (optional)</Label>
                        <textarea
                           value={notes}
                           onChange={(e) => setNotes(e.target.value)}
                           placeholder="Sale notes..."
                           rows={2}
                           className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden"
                           onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
                        />
                     </div>

                     {error && <p className="text-sm text-destructive">{error}</p>}

                     <Button
                        onClick={handleSubmit}
                        disabled={submitting || !productId || !quantity}
                        className="w-full"
                     >
                        {submitting ? "Recording..." : "Record Sale"}
                     </Button>
                  </div>
               )}
            </DialogContent>
         </Dialog>

         <Dialog open={viewingNote !== null} onOpenChange={(open) => { if (!open) setViewingNote(null); }}>
            <DialogContent className="max-w-md">
               <DialogHeader>
                  <DialogTitle>Note</DialogTitle>
               </DialogHeader>
               <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingNote}</p>
            </DialogContent>
         </Dialog>
      </div>
   );
}
