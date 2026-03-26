"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, X, Filter } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Category = {
   id: string;
   name: string;
};

type PriceTier = {
   id?: string;
   minQty: number;
   maxQty: number | null;
   costPrice: number;
   sellPrice: number;
};

type Product = {
   id: string;
   name: string;
   categoryId: string;
   category: Category;
   costPrice: number;
   sellPrice: number;
   unit: string | null;
   description: string | null;
   thumbnail: string | null;
   priceTiers: PriceTier[];
   active: boolean;
};

type TierForm = {
   minQty: string;
   maxQty: string;
   costPrice: string;
   sellPrice: string;
};

type ProductForm = {
   name: string;
   categoryId: string;
   costPrice: string;
   sellPrice: string;
   unit: string;
   description: string;
   thumbnail: string;
   priceTiers: TierForm[];
};

const emptyTier: TierForm = { minQty: "", maxQty: "", costPrice: "", sellPrice: "" };

const emptyForm: ProductForm = {
   name: "",
   categoryId: "",
   costPrice: "",
   sellPrice: "",
   unit: "",
   description: "",
   thumbnail: "",
   priceTiers: [],
};

export default function ProductsPage() {
   const [products, setProducts] = useState<Product[]>([]);
   const [categories, setCategories] = useState<Category[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editId, setEditId] = useState<string | null>(null);
   const [form, setForm] = useState<ProductForm>(emptyForm);
   const [tierProduct, setTierProduct] = useState<Product | null>(null);
   const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
   const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

   useEffect(() => {
      let ignore = false;
      Promise.all([
         fetch("/api/products").then((r) => r.json()),
         fetch("/api/categories").then((r) => r.json()),
      ]).then(([productsData, categoriesData]) => {
         if (!ignore) {
            setProducts(productsData);
            setCategories(categoriesData);
            setLoading(false);
         }
      });
      return () => { ignore = true; };
   }, []);

   const fetchProducts = async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
   };

   function openAdd() {
      setEditId(null);
      setForm(emptyForm);
      setDialogOpen(true);
   }

   function openEdit(product: Product) {
      setEditId(product.id);
      setForm({
         name: product.name,
         categoryId: product.categoryId,
         costPrice: String(product.costPrice),
         sellPrice: String(product.sellPrice),
         unit: product.unit ?? "",
         description: product.description ?? "",
         thumbnail: product.thumbnail ?? "",
         priceTiers: product.priceTiers.map((t) => ({
            minQty: String(t.minQty),
            maxQty: t.maxQty != null ? String(t.maxQty) : "",
            costPrice: String(t.costPrice),
            sellPrice: String(t.sellPrice),
         })),
      });
      setDialogOpen(true);
   }

   function addTier() {
      setForm((prev) => ({ ...prev, priceTiers: [...prev.priceTiers, { ...emptyTier }] }));
   }

   function removeTier(index: number) {
      setForm((prev) => ({
         ...prev,
         priceTiers: prev.priceTiers.filter((_, i) => i !== index),
      }));
   }

   function updateTier(index: number, field: keyof TierForm, value: string) {
      setForm((prev) => ({
         ...prev,
         priceTiers: prev.priceTiers.map((t, i) => i === index ? { ...t, [field]: value } : t),
      }));
   }

   async function handleSubmit() {
      if (!form.name || !form.categoryId || !form.costPrice || !form.sellPrice) return;

      const priceTiers = form.priceTiers
         .filter((t) => t.minQty && t.costPrice && t.sellPrice)
         .map((t) => ({
            minQty: parseInt(t.minQty),
            maxQty: t.maxQty ? parseInt(t.maxQty) : null,
            costPrice: parseFloat(t.costPrice),
            sellPrice: parseFloat(t.sellPrice),
         }));

      const payload = {
         name: form.name.trim(),
         categoryId: form.categoryId,
         costPrice: parseFloat(form.costPrice),
         sellPrice: parseFloat(form.sellPrice),
         unit: form.unit.trim() || null,
         description: form.description.trim() || null,
         thumbnail: form.thumbnail.trim() || null,
         priceTiers,
      };

      if (editId) {
         await fetch(`/api/products/${editId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
         });
      } else {
         await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
         });
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
      fetchProducts();
   }

   async function handleDelete(id: string) {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      fetchProducts();
   }

   function updateForm(field: keyof ProductForm, value: string) {
      setForm((prev) => ({ ...prev, [field]: value }));
   }

   const filtered = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
         p.category.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter.size === 0 || categoryFilter.has(p.categoryId);
      return matchesSearch && matchesCategory;
   });

   function toggleCategoryFilter(categoryId: string) {
      setCategoryFilter((prev) => {
         const next = new Set(prev);
         if (next.has(categoryId)) next.delete(categoryId);
         else next.add(categoryId);
         return next;
      });
   }

   const formatPrice = (price: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

   const unitLabel = (unit: string | null) => unit ? `${unit}(s)` : "unit(s)";

   return (
      <div>
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold tracking-tight">Products</h1>
               <p className="mt-1 text-muted-foreground">Manage your product catalog</p>
            </div>
            <Button onClick={openAdd}>
               <Plus className="mr-2 h-4 w-4" />
               Add Product
            </Button>
         </div>

         <div className="mt-6 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
               />
            </div>
         </div>

         <div className="mt-4 rounded-lg border border-border/40">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Name</TableHead>
                     <TableHead>
                        <div className="flex items-center gap-1">
                           Category
                           <Popover>
                              <PopoverTrigger
                                 render={
                                    <Button
                                       variant="ghost"
                                       size="icon"
                                       className="h-6 w-6"
                                    />
                                 }
                              >
                                 <Filter className={cn("size-[11px]", categoryFilter.size > 0 && "text-primary")} />
                              </PopoverTrigger>
                              <PopoverContent align="start" className="w-48">
                                 <div className="flex flex-col gap-2">
                                    <p className="text-xs font-medium text-muted-foreground">Filter by category</p>
                                    {categories.map((cat) => (
                                       <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm">
                                          <Checkbox
                                             checked={categoryFilter.has(cat.id)}
                                             onCheckedChange={() => toggleCategoryFilter(cat.id)}
                                          />
                                          {cat.name}
                                       </label>
                                    ))}
                                    {categoryFilter.size > 0 && (
                                       <Button
                                          variant="ghost"
                                          size="sm"
                                          className="mt-1 h-7 text-xs"
                                          onClick={() => setCategoryFilter(new Set())}
                                       >
                                          Clear filter
                                       </Button>
                                    )}
                                 </div>
                              </PopoverContent>
                           </Popover>
                        </div>
                     </TableHead>
                     <TableHead>Unit</TableHead>
                     <TableHead className="text-right">Cost</TableHead>
                     <TableHead className="text-right">Sell</TableHead>
                     <TableHead className="text-right">Markup</TableHead>
                     <TableHead className="text-center">Bulk</TableHead>
                     <TableHead className="w-24 text-right">Actions</TableHead>
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
                           {search ? "No products match your search" : "No products yet"}
                        </TableCell>
                     </TableRow>
                  ) : (
                     filtered.map((product) => {
                        const margin = product.sellPrice > 0
                           ? ((product.sellPrice - product.costPrice) / product.costPrice * 100).toFixed(1)
                           : "0";
                        return (
                           <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>
                                 <Badge variant="secondary">{product.category.name}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                 {unitLabel(product.unit)}
                              </TableCell>
                              <TableCell className="text-right">
                                 {formatPrice(product.costPrice)}/{unitLabel(product.unit)}
                              </TableCell>
                              <TableCell className="text-right">
                                 {formatPrice(product.sellPrice)}/{unitLabel(product.unit)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">{margin}%</TableCell>
                              <TableCell className="text-center">
                                 {product.priceTiers.length > 0 ? (
                                    <Badge
                                       variant="outline"
                                       className="cursor-pointer hover:bg-accent"
                                       onClick={() => setTierProduct(product)}
                                    >
                                       {product.priceTiers.length} tier(s)
                                    </Badge>
                                 ) : (
                                    <span className="text-muted-foreground">-</span>
                                 )}
                              </TableCell>
                              <TableCell className="text-right">
                                 <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                                       <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(product.id)}>
                                       <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                 </div>
                              </TableCell>
                           </TableRow>
                        );
                     })
                  )}
               </TableBody>
            </Table>
         </div>

         <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
               <DialogHeader>
                  <DialogTitle>{editId ? "Edit Product" : "Add Product"}</DialogTitle>
               </DialogHeader>
               <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="product-name">Name</Label>
                     <Input
                        id="product-name"
                        value={form.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        placeholder="Product name"
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2">
                        <Label>Category</Label>
                        <Select
                           value={form.categoryId}
                           onValueChange={(val) => updateForm("categoryId", val ?? "")}
                        >
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a category">
                                 {categories.find((c) => c.id === form.categoryId)?.name ?? "Select a category"}
                              </SelectValue>
                           </SelectTrigger>
                           <SelectContent>
                              {categories.map((cat) => (
                                 <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="flex flex-col gap-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Input
                           id="unit"
                           value={form.unit}
                           onChange={(e) => updateForm("unit", e.target.value)}
                           placeholder="e.g. box, piece, pack"
                        />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2">
                        <Label htmlFor="cost-price">Base Cost Price</Label>
                        <Input
                           id="cost-price"
                           type="number"
                           step="0.01"
                           min="0"
                           value={form.costPrice}
                           onChange={(e) => updateForm("costPrice", e.target.value)}
                           placeholder="0.00"
                        />
                     </div>
                     <div className="flex flex-col gap-2">
                        <Label htmlFor="sell-price">Base Sell Price</Label>
                        <Input
                           id="sell-price"
                           type="number"
                           step="0.01"
                           min="0"
                           value={form.sellPrice}
                           onChange={(e) => updateForm("sellPrice", e.target.value)}
                           placeholder="0.00"
                        />
                     </div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="description">Description</Label>
                     <Input
                        id="description"
                        value={form.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        placeholder="Optional description"
                     />
                  </div>

                  <div className="flex flex-col gap-3">
                     <div className="flex items-center justify-between">
                        <Label>Bulk Price Tiers</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addTier}>
                           <Plus className="mr-1 h-3 w-3" />
                           Add Tier
                        </Button>
                     </div>
                     {form.priceTiers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                           No bulk pricing tiers. Base price applies to all quantities.
                        </p>
                     ) : (
                        <div className="flex flex-col gap-3">
                           {form.priceTiers.map((tier, i) => (
                              <div key={i} className="flex items-end gap-2 rounded-md border border-border/40 p-3">
                                 <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-xs text-muted-foreground">Min Qty</Label>
                                    <Input
                                       type="number"
                                       min="1"
                                       value={tier.minQty}
                                       onChange={(e) => updateTier(i, "minQty", e.target.value)}
                                       placeholder="10"
                                    />
                                 </div>
                                 <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-xs text-muted-foreground">Max Qty</Label>
                                    <Input
                                       type="number"
                                       min="1"
                                       value={tier.maxQty}
                                       onChange={(e) => updateTier(i, "maxQty", e.target.value)}
                                       placeholder="Leave empty for unlimited"
                                    />
                                 </div>
                                 <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-xs text-muted-foreground">Cost</Label>
                                    <Input
                                       type="number"
                                       step="0.01"
                                       min="0"
                                       value={tier.costPrice}
                                       onChange={(e) => updateTier(i, "costPrice", e.target.value)}
                                       placeholder="0.00"
                                    />
                                 </div>
                                 <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-xs text-muted-foreground">Sell</Label>
                                    <Input
                                       type="number"
                                       step="0.01"
                                       min="0"
                                       value={tier.sellPrice}
                                       onChange={(e) => updateTier(i, "sellPrice", e.target.value)}
                                       placeholder="0.00"
                                    />
                                 </div>
                                 <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeTier(i)}
                                    className="shrink-0"
                                 >
                                    <X className="h-4 w-4 text-destructive" />
                                 </Button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
               <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                     Cancel
                  </DialogClose>
                  <Button onClick={handleSubmit}>
                     {editId ? "Save" : "Create"}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         <Dialog open={tierProduct !== null} onOpenChange={(open) => { if (!open) setTierProduct(null); }}>
            <DialogContent className="sm:max-w-lg">
               <DialogHeader>
                  <DialogTitle>{tierProduct?.name} — Pricing</DialogTitle>
               </DialogHeader>
               {tierProduct && (
                  <div className="flex flex-col gap-4 py-2">
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead>Quantity</TableHead>
                              <TableHead className="text-right">Cost</TableHead>
                              <TableHead className="text-right">Sell</TableHead>
                              <TableHead className="text-right">Markup</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           <TableRow>
                              <TableCell className="font-medium">
                                 Base
                              </TableCell>
                              <TableCell className="text-right">
                                 {formatPrice(tierProduct.costPrice)}/{unitLabel(tierProduct.unit)}
                              </TableCell>
                              <TableCell className="text-right">
                                 {formatPrice(tierProduct.sellPrice)}/{unitLabel(tierProduct.unit)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                 {tierProduct.sellPrice > 0
                                    ? ((tierProduct.sellPrice - tierProduct.costPrice) / tierProduct.sellPrice * 100).toFixed(1)
                                    : "0"}%
                              </TableCell>
                           </TableRow>
                           {tierProduct.priceTiers
                              .sort((a, b) => a.minQty - b.minQty)
                              .map((tier, i) => {
                                 const margin = tier.sellPrice > 0
                                    ? ((tier.sellPrice - tier.costPrice) / tier.costPrice * 100).toFixed(1)
                                    : "0";
                                 return (
                                    <TableRow key={i}>
                                       <TableCell className="font-medium">
                                          {tier.minQty}{tier.maxQty ? `–${tier.maxQty}` : "+"} {unitLabel(tierProduct.unit)}
                                       </TableCell>
                                       <TableCell className="text-right">
                                          {formatPrice(tier.costPrice)}/{unitLabel(tierProduct.unit)}
                                       </TableCell>
                                       <TableCell className="text-right">
                                          {formatPrice(tier.sellPrice)}/{unitLabel(tierProduct.unit)}
                                       </TableCell>
                                       <TableCell className="text-right text-muted-foreground">
                                          {margin}%
                                       </TableCell>
                                    </TableRow>
                                 );
                              })}
                        </TableBody>
                     </Table>
                  </div>
               )}
               <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                     Close
                  </DialogClose>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
            <DialogContent className="sm:max-w-sm">
               <DialogHeader>
                  <DialogTitle>Delete Product</DialogTitle>
               </DialogHeader>
               <p className="text-sm text-muted-foreground">
                  This will permanently delete this product and all its price tiers.
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
