"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type InventoryItem = {
   id: string;
   quantity: number;
   product: {
      id: string;
      name: string;
      unit: string | null;
      sellPrice: number;
      priceTiers: { minQty: number; maxQty: number | null; sellPrice: number }[];
   };
};

type PricingMode = "auto" | "custom-per-unit" | "flat-total";

export default function NewSalePage() {
   const router = useRouter();
   const [inventory, setInventory] = useState<InventoryItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [productId, setProductId] = useState("");
   const [quantity, setQuantity] = useState("");
   const [soldPrice, setSoldPrice] = useState("");
   const [flatTotal, setFlatTotal] = useState("");
   const [pricingMode, setPricingMode] = useState<PricingMode>("auto");
   const [notes, setNotes] = useState("");
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState("");
   const [success, setSuccess] = useState(false);

   useEffect(() => {
      let ignore = false;
      fetch("/api/reseller/inventory")
         .then((r) => r.json())
         .then((data) => {
            if (!ignore) {
               setInventory(data.filter((i: InventoryItem) => i.quantity > 0));
               setLoading(false);
            }
         });
      return () => { ignore = true; };
   }, []);

   const selected = inventory.find((i) => i.product.id === productId);
   const unitLabel = (unit: string | null) => unit ? `${unit}(s)` : "unit(s)";
   const formatPrice = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

   function getApplicablePrice(item: InventoryItem, qty: number): number {
      const tiers = item.product.priceTiers;
      if (!tiers || tiers.length === 0) return Number(item.product.sellPrice);
      const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
      for (const tier of sorted) {
         if (qty >= tier.minQty && (tier.maxQty === null || qty <= tier.maxQty)) {
            return Number(tier.sellPrice);
         }
      }
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

      setSuccess(true);
      setSubmitting(false);
      setTimeout(() => router.push("/reseller/sales/history"), 1000);
   }

   if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

   return (
      <div className="max-w-lg mx-auto">
         <h1 className="text-2xl font-bold tracking-tight">New Sale</h1>
         <p className="mt-1 text-muted-foreground">Record a product sale</p>

         {success ? (
            <Card className="mt-6">
               <CardContent className="py-8 text-center">
                  <p className="text-lg font-medium text-green-500">Sale recorded</p>
                  <p className="text-sm text-muted-foreground mt-1">Redirecting to history...</p>
               </CardContent>
            </Card>
         ) : (
            <Card className="mt-6">
               <CardContent className="flex flex-col gap-4 my-1">
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
                     <div className="rounded-lg border border-border/40 bg-accent/30 p-3 flex flex-col gap-3">
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
                     <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Sale notes..."
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
               </CardContent>
            </Card>
         )}
      </div>
   );
}
