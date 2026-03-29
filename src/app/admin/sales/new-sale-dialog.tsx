"use client";

import { useState } from "react";
import { formatPrice, unitLabel } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
   DialogClose,
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
import type { SaleProduct as Product } from "@/types/models";
import { usePricingCalculator } from "@/hooks/use-pricing-calculator";

type SaleForm = {
   productId: string;
   notes: string;
};

const emptyForm: SaleForm = {
   productId: "",
   notes: "",
};

type NewSaleDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   products: Product[];
   onSaleCreated: () => void;
};

export function NewSaleDialog({ open, onOpenChange, products, onSaleCreated }: NewSaleDialogProps) {
   const [form, setForm] = useState<SaleForm>(emptyForm);
   const pricing = usePricingCalculator();
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState("");

   const selectedProduct = products.find((p) => p.id === form.productId);

   function handleOpenChange(next: boolean) {
      if (next) {
         setForm(emptyForm);
         pricing.reset();
         setError("");
      }
      onOpenChange(next);
   }

   function handleProductChange(productId: string | null) {
      if (!productId) return;
      setForm((prev) => ({ ...prev, productId }));
      const product = products.find((p) => p.id === productId);
      pricing.onProductChange(product);
   }

   async function handleSubmit() {
      const isFlat = pricing.pricingMode === "flat-total";
      if (!form.productId || !pricing.quantity || (isFlat ? !pricing.flatTotal : !pricing.soldPrice)) return;
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/sales", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            productId: form.productId,
            quantity: parseInt(pricing.quantity),
            soldPrice: pricing.getFinalSoldPrice(),
            notes: form.notes.trim() || null,
         }),
      });

      if (!res.ok) {
         const data = await res.json();
         setError(data.error || "Failed to create sale");
         setSubmitting(false);
         return;
      }

      onOpenChange(false);
      setForm(emptyForm);
      pricing.reset();
      setSubmitting(false);
      onSaleCreated();
   }

   return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle>New Sale</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-2 pb-4">
               <div className="flex flex-col gap-2">
                  <Label>Product</Label>
                  <Select
                     value={form.productId}
                     onValueChange={handleProductChange}
                  >
                     <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product">
                           {selectedProduct?.name ?? "Select product"}
                        </SelectValue>
                     </SelectTrigger>
                     <SelectContent>
                        {products.map((product) => (
                           <SelectItem key={product.id} value={product.id}>
                              {product.name}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
               <div className="flex flex-col gap-2">
                  <Label>Pricing</Label>
                  <div className="rounded-lg border border-border/70 bg-accent/30 p-3 flex flex-col gap-3">
                     <div className="grid grid-cols-2 gap-3">
                        <Button
                           variant={pricing.pricingMode !== "flat-total" ? "default" : "outline"}
                           size="sm"
                           className="text-xs h-7"
                           onClick={() => pricing.switchPricingMode(pricing.pricingMode === "flat-total" ? "auto" : pricing.pricingMode, selectedProduct)}
                        >
                           Per Unit
                        </Button>
                        <Button
                           variant={pricing.pricingMode === "flat-total" ? "default" : "outline"}
                           size="sm"
                           className="text-xs h-7"
                           onClick={() => pricing.switchPricingMode("flat-total", selectedProduct)}
                        >
                           Flat
                        </Button>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                           <span className="text-xs text-muted-foreground">Quantity</span>
                           <Input
                              id="sale-qty"
                              type="number"
                              min="1"
                              value={pricing.quantity}
                              onChange={(e) => pricing.setQuantity(e.target.value, selectedProduct)}
                              placeholder="0"
                           />
                        </div>
                        {pricing.pricingMode === "flat-total" ? (
                           <div className="flex flex-col gap-1.5">
                              <span className="text-xs text-muted-foreground">Flat</span>
                              <Input
                                 id="sale-flat"
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
                                    onClick={() => pricing.switchPricingMode(pricing.pricingMode === "auto" ? "custom-per-unit" : "auto", selectedProduct)}
                                 >
                                    {pricing.pricingMode === "auto" ? "Auto" : "Custom"}
                                 </Button>
                              </div>
                              <div className="relative">
                                 <Input
                                    id="sale-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={pricing.soldPrice}
                                    onChange={(e) => {
                                       if (pricing.pricingMode === "auto") pricing.switchPricingMode("custom-per-unit", selectedProduct);
                                       pricing.setSoldPrice(e.target.value);
                                    }}
                                    placeholder="0.00"
                                    className={cn(
                                       "pr-16",
                                       pricing.pricingMode === "custom-per-unit" && "border-yellow-500/50"
                                    )}
                                 />
                                 {selectedProduct && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                       /{unitLabel(selectedProduct.unit)}
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
                        <span className="text-blue-400">Rate per {unitLabel(selectedProduct?.unit ?? null)}</span>
                        <span className="text-blue-400 font-medium">
                           {formatPrice(parseFloat(pricing.flatTotal) / parseInt(pricing.quantity))}
                        </span>
                     </div>
                  </div>
               )}
               {selectedProduct && pricing.quantity && pricing.getFinalTotal() > 0 && (
                  <div className="rounded-md bg-accent/50 p-3 text-sm">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-medium">
                           {formatPrice(pricing.getFinalTotal())}
                        </span>
                     </div>
                  </div>
               )}
               <div className="flex flex-col gap-2">
                  <Label htmlFor="sale-notes">Notes (optional)</Label>
                  <ExpandingTextarea
                     id="sale-notes"
                     value={form.notes}
                     onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
                     placeholder="Sale notes..."
                     rows={2}
                  />
               </div>
               {error && (
                  <p className="text-sm text-destructive">{error}</p>
               )}
            </div>
            <DialogFooter>
               <DialogClose render={<Button variant="outline" />}>
                  Cancel
               </DialogClose>
               <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Recording..." : "Record Sale"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
