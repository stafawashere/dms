"use client";

import { useState } from "react";
import { formatPrice, unitLabel } from "@/lib/formatters";
import { usePricingCalculator } from "@/hooks/use-pricing-calculator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { ExpandingTextarea } from "@/components/expanding-textarea";
import { cn } from "@/lib/utils";
import type { ResellerSale, InventoryItem } from "@/types/models";

type NewSaleDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   inventory: InventoryItem[];
   invLoading: boolean;
   onSaleCreated: (sale: ResellerSale) => void;
   onInventoryUpdate: (productId: string, quantitySold: number) => void;
};

export function NewSaleDialog({
   open,
   onOpenChange,
   inventory,
   invLoading,
   onSaleCreated,
   onInventoryUpdate,
}: NewSaleDialogProps) {
   const [productId, setProductId] = useState("");
   const pricing = usePricingCalculator();
   const [notes, setNotes] = useState("");
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState("");

   const selected = inventory.find((i) => i.product.id === productId);

   function resetForm() {
      setProductId("");
      pricing.reset();
      setNotes("");
      setError("");
   }

   function handleProductChange(id: string | null) {
      if (!id) return;
      setProductId(id);
      const item = inventory.find((i) => i.product.id === id);
      pricing.onProductChange(item?.product);
   }

   async function handleSubmit() {
      const isFlat = pricing.pricingMode === "flat-total";
      if (!productId || !pricing.quantity || (isFlat ? !pricing.flatTotal : !pricing.soldPrice)) return;
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/reseller/sales", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            productId,
            quantity: parseInt(pricing.quantity),
            soldPrice: pricing.getFinalSoldPrice(),
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
      onSaleCreated(newSale);
      onInventoryUpdate(productId, parseInt(pricing.quantity));
      resetForm();
      setSubmitting(false);
      onOpenChange(false);
   }

   function handleOpenChange(nextOpen: boolean) {
      onOpenChange(nextOpen);
      if (!nextOpen) resetForm();
   }

   return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
                              variant={pricing.pricingMode !== "flat-total" ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => pricing.switchPricingMode(pricing.pricingMode === "flat-total" ? "auto" : pricing.pricingMode, selected?.product)}
                           >
                              Per Unit
                           </Button>
                           <Button
                              variant={pricing.pricingMode === "flat-total" ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => pricing.switchPricingMode("flat-total", selected?.product)}
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
                                 value={pricing.quantity}
                                 onChange={(e) => pricing.setQuantity(e.target.value, selected?.product)}
                                 placeholder="0"
                              />
                           </div>
                           {pricing.pricingMode === "flat-total" ? (
                              <div className="flex flex-col gap-1.5">
                                 <span className="text-xs text-muted-foreground">Flat</span>
                                 <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={pricing.flatTotal}
                                    onChange={(e) => pricing.setFlatTotal(e.target.value)}
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
                                          pricing.pricingMode === "auto"
                                             ? "text-muted-foreground"
                                             : "text-yellow-500"
                                       )}
                                       onClick={() => pricing.switchPricingMode(pricing.pricingMode === "auto" ? "custom-per-unit" : "auto", selected?.product)}
                                    >
                                       {pricing.pricingMode === "auto" ? "Auto" : "Custom"}
                                    </Button>
                                 </div>
                                 <div className="relative">
                                    <Input
                                       type="number"
                                       step="0.01"
                                       min="0"
                                       value={pricing.soldPrice}
                                       onChange={(e) => {
                                          if (pricing.pricingMode === "auto") pricing.switchPricingMode("custom-per-unit", selected?.product);
                                          pricing.setSoldPrice(e.target.value);
                                       }}
                                       placeholder="0.00"
                                       className={cn(
                                          "pr-16",
                                          pricing.pricingMode === "custom-per-unit" && "border-yellow-500/50"
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

                  {pricing.pricingMode === "flat-total" && pricing.flatTotal && pricing.quantity && (
                     <div className="rounded-md bg-blue-500/10 px-3 py-2 text-sm">
                        <div className="flex justify-between">
                           <span className="text-blue-400">Rate per {unitLabel(selected?.product.unit ?? null)}</span>
                           <span className="text-blue-400 font-medium">
                              {formatPrice(parseFloat(pricing.flatTotal) / parseInt(pricing.quantity))}
                           </span>
                        </div>
                     </div>
                  )}

                  {selected && pricing.quantity && pricing.getFinalTotal() > 0 && (
                     <div className="rounded-md bg-accent/50 p-3 text-sm">
                        <div className="flex justify-between">
                           <span className="text-muted-foreground">Total</span>
                           <span className="text-lg font-bold">{formatPrice(pricing.getFinalTotal())}</span>
                        </div>
                     </div>
                  )}

                  <div className="flex flex-col gap-2">
                     <Label>Notes (optional)</Label>
                     <ExpandingTextarea
                        value={notes}
                        onChange={setNotes}
                        placeholder="Sale notes..."
                        rows={2}
                     />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button
                     onClick={handleSubmit}
                     disabled={submitting || !productId || !pricing.quantity}
                     className="w-full"
                  >
                     {submitting ? "Recording..." : "Record Sale"}
                  </Button>
               </div>
            )}
         </DialogContent>
      </Dialog>
   );
}
