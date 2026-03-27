"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, ShoppingCart, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

type Product = {
   id: string;
   name: string;
   sellPrice: number;
   costPrice: number;
   unit: string | null;
   priceTiers: { qty: number; sellPrice: number; costPrice: number }[];
};

type Reseller = {
   id: string;
   name: string;
   email: string;
   role: string;
};

type Sale = {
   id: string;
   resellerId: string;
   productId: string;
   quantity: number;
   soldPrice: number;
   notes: string | null;
   createdAt: string;
   product: Product;
   reseller: Reseller;
};

type PricingMode = "auto" | "custom-per-unit" | "flat-total";

type SaleForm = {
   productId: string;
   quantity: string;
   soldPrice: string;
   customPrice: boolean;
   pricingMode: PricingMode;
   flatTotal: string;
   notes: string;
};

const emptyForm: SaleForm = {
   productId: "",
   quantity: "",
   soldPrice: "",
   customPrice: false,
   pricingMode: "auto",
   flatTotal: "",
   notes: "",
};

export default function SalesPage() {
   const [sales, setSales] = useState<Sale[]>([]);
   const [products, setProducts] = useState<Product[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [dialogOpen, setDialogOpen] = useState(false);
   const [form, setForm] = useState<SaleForm>(emptyForm);
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState("");
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

   function openNewSale() {
      setForm(emptyForm);
      setError("");
      setDialogOpen(true);
   }

   function updateForm(field: keyof SaleForm, value: string) {
      setForm((prev) => ({ ...prev, [field]: value }));
   }

   function getApplicablePrice(product: Product, qty: number): number {
      if (!product.priceTiers || product.priceTiers.length === 0) return Number(product.sellPrice);

      const match = product.priceTiers.find((t) => t.qty === qty);
      if (match) return Number(match.sellPrice) / qty;

      return Number(product.sellPrice);
   }

   function handleProductChange(productId: string | null) {
      if (!productId) return;
      const product = products.find((p) => p.id === productId);
      if (product && form.pricingMode === "auto") {
         const qty = parseInt(form.quantity) || 1;
         const price = getApplicablePrice(product, qty);
         setForm((prev) => ({ ...prev, productId, soldPrice: String(price) }));
      } else {
         updateForm("productId", productId);
      }
   }

   function handleQuantityChange(value: string) {
      const product = products.find((p) => p.id === form.productId);
      if (product && value && form.pricingMode === "auto") {
         const price = getApplicablePrice(product, parseInt(value));
         setForm((prev) => ({ ...prev, quantity: value, soldPrice: String(price) }));
      } else {
         updateForm("quantity", value);
      }
   }

   function switchPricingMode(mode: PricingMode) {
      setForm((prev) => {
         if (mode === "auto") {
            const product = products.find((p) => p.id === prev.productId);
            const qty = parseInt(prev.quantity) || 1;
            const price = product ? getApplicablePrice(product, qty) : prev.soldPrice;
            return { ...prev, pricingMode: "auto", customPrice: false, soldPrice: String(price), flatTotal: "" };
         }
         if (mode === "flat-total") {
            return { ...prev, pricingMode: "flat-total", customPrice: false, flatTotal: "" };
         }
         return { ...prev, pricingMode: "custom-per-unit", customPrice: true };
      });
   }

   function getFinalSoldPrice(): number {
      if (form.pricingMode === "flat-total" && form.flatTotal && form.quantity) {
         return parseFloat(form.flatTotal) / parseInt(form.quantity);
      }
      return parseFloat(form.soldPrice);
   }

   function getFinalTotal(): number {
      if (form.pricingMode === "flat-total" && form.flatTotal) {
         return parseFloat(form.flatTotal);
      }
      if (form.soldPrice && form.quantity) {
         return parseFloat(form.soldPrice) * parseInt(form.quantity);
      }
      return 0;
   }

   async function handleSubmit() {
      const isFlat = form.pricingMode === "flat-total";
      if (!form.productId || !form.quantity || (isFlat ? !form.flatTotal : !form.soldPrice)) return;
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/sales", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            productId: form.productId,
            quantity: parseInt(form.quantity),
            soldPrice: getFinalSoldPrice(),
            notes: form.notes.trim() || null,
         }),
      });

      if (!res.ok) {
         const data = await res.json();
         setError(data.error || "Failed to create sale");
         setSubmitting(false);
         return;
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setSubmitting(false);
      fetchSales();
   }

   async function handleDelete(id: string) {
      await fetch(`/api/sales/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      fetchSales();
   }

   const unitLabel = (unit: string | null) => unit ? `${unit}(s)` : "unit(s)";

   const formatPrice = (price: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

   const formatDate = (date: string) =>
      new Date(date).toLocaleDateString("en-US", {
         month: "short",
         day: "numeric",
         year: "numeric",
         hour: "numeric",
         minute: "2-digit",
      });

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

   const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.soldPrice) * s.quantity, 0);
   const totalUnits = filtered.reduce((sum, s) => sum + s.quantity, 0);

   const selectedProduct = products.find((p) => p.id === form.productId);

   return (
      <div>
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
               <p className="mt-1 text-muted-foreground">
                  {totalUnits} unit(s) sold — {formatPrice(totalRevenue)} revenue
               </p>
            </div>
            <Button onClick={openNewSale}>
               <Plus className="mr-2 h-4 w-4" />
               New Sale
            </Button>
         </div>

         {resellers.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
               {resellers.map((reseller) => {
                  const resellerSales = sales.filter((s) => s.resellerId === reseller.id);
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
            <div className="relative flex-1 max-w-sm">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                  placeholder="Search by product, reseller, or notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
               />
            </div>
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

         <div className="mt-4 rounded-lg border border-border/70">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Date</TableHead>
                     <TableHead>Product</TableHead>
                     <TableHead>Reseller</TableHead>
                     <TableHead className="text-right">Qty</TableHead>
                     <TableHead className="text-right">Price</TableHead>
                     <TableHead className="text-right">Total</TableHead>
                     <TableHead>Notes</TableHead>
                     <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {loading ? (
                     <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                           Loading...
                        </TableCell>
                     </TableRow>
                  ) : filtered.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                           {search || resellerFilter !== "all"
                              ? "No sales match your filter"
                              : "No sales recorded yet"}
                        </TableCell>
                     </TableRow>
                  ) : (
                     filtered.map((sale) => (
                        <TableRow key={sale.id}>
                           <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(sale.createdAt)}
                           </TableCell>
                           <TableCell>
                              <div className="flex items-center gap-2">
                                 <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                 <span className="font-medium">{sale.product.name}</span>
                              </div>
                           </TableCell>
                           <TableCell>{sale.reseller.name}</TableCell>
                           <TableCell className="text-right">
                              {sale.quantity} {unitLabel(sale.product.unit)}
                           </TableCell>
                           <TableCell className="text-right">
                              {formatPrice(Number(sale.soldPrice))}/{unitLabel(sale.product.unit)}
                           </TableCell>
                           <TableCell className="text-right font-medium">
                              {formatPrice(Number(sale.soldPrice) * sale.quantity)}
                           </TableCell>
                           <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {sale.notes || "-"}
                           </TableCell>
                           <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(sale.id)}>
                                 <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </div>

         <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                              variant={form.pricingMode !== "flat-total" ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => switchPricingMode(form.pricingMode === "flat-total" ? "auto" : form.pricingMode)}
                           >
                              Per Unit
                           </Button>
                           <Button
                              variant={form.pricingMode === "flat-total" ? "default" : "outline"}
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
                                 id="sale-qty"
                                 type="number"
                                 min="1"
                                 value={form.quantity}
                                 onChange={(e) => handleQuantityChange(e.target.value)}
                                 placeholder="0"
                              />
                           </div>
                           {form.pricingMode === "flat-total" ? (
                              <div className="flex flex-col gap-1.5">
                                 <span className="text-xs text-muted-foreground">Flat</span>
                                 <Input
                                    id="sale-flat"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.flatTotal}
                                    onChange={(e) => updateForm("flatTotal", e.target.value)}
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
                                          form.pricingMode === "auto"
                                             ? "text-muted-foreground"
                                             : "text-yellow-500"
                                       )}
                                       onClick={() => switchPricingMode(form.pricingMode === "auto" ? "custom-per-unit" : "auto")}
                                    >
                                       {form.pricingMode === "auto" ? "Auto" : "Custom"}
                                    </Button>
                                 </div>
                                 <div className="relative">
                                    <Input
                                       id="sale-price"
                                       type="number"
                                       step="0.01"
                                       min="0"
                                       value={form.soldPrice}
                                       onChange={(e) => {
                                          if (form.pricingMode === "auto") {
                                             setForm((prev) => ({ ...prev, pricingMode: "custom-per-unit", customPrice: true, soldPrice: e.target.value }));
                                          } else {
                                             updateForm("soldPrice", e.target.value);
                                          }
                                       }}
                                       placeholder="0.00"
                                       className={cn(
                                          "pr-16",
                                          form.pricingMode === "custom-per-unit" && "border-yellow-500/50"
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
                  {form.pricingMode === "flat-total" && form.flatTotal && form.quantity && (
                     <div className="rounded-md bg-blue-500/10 px-3 py-2 text-sm">
                        <div className="flex justify-between">
                           <span className="text-blue-400">Rate per {unitLabel(selectedProduct?.unit ?? null)}</span>
                           <span className="text-blue-400 font-medium">
                              {formatPrice(parseFloat(form.flatTotal) / parseInt(form.quantity))}
                           </span>
                        </div>
                     </div>
                  )}
                  {selectedProduct && form.quantity && getFinalTotal() > 0 && (
                     <div className="rounded-md bg-accent/50 p-3 text-sm">
                        <div className="flex justify-between">
                           <span className="text-muted-foreground">Total</span>
                           <span className="font-medium">
                              {formatPrice(getFinalTotal())}
                           </span>
                        </div>
                     </div>
                  )}
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="sale-notes">Notes (optional)</Label>
                     <Input
                        id="sale-notes"
                        value={form.notes}
                        onChange={(e) => updateForm("notes", e.target.value)}
                        placeholder="Sale notes..."
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

         <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
            <DialogContent className="sm:max-w-sm">
               <DialogHeader>
                  <DialogTitle>Delete Sale</DialogTitle>
               </DialogHeader>
               <p className="text-sm text-muted-foreground">
                  This will delete the sale and restore the stock to the reseller's inventory.
               </p>
               <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                     Cancel
                  </DialogClose>
                  <Button variant="destructive" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
                     Delete
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
}
