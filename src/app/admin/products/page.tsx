"use client";

import { useState, useEffect, Fragment } from "react";
import { Plus, Pencil, Trash2, Search, X, Filter, Upload, ImageIcon, ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, TableIcon, Package } from "lucide-react";
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
   qty: number;
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
   qty: string;
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

type SortKey = "name" | "costPrice" | "sellPrice" | "markup" | null;
type SortDir = "asc" | "desc";

const emptyTier: TierForm = { qty: "", costPrice: "", sellPrice: "" };

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
   const [uploading, setUploading] = useState(false);
   const [sortKey, setSortKey] = useState<SortKey>(null);
   const [sortDir, setSortDir] = useState<SortDir>("asc");
   const [viewMode, setViewMode] = useState<"table" | "grid">("table");

   function toggleSort(key: SortKey) {
      if (sortKey === key) {
         if (sortDir === "asc") setSortDir("desc");
         else { setSortKey(null); setSortDir("asc"); }
      } else {
         setSortKey(key);
         setSortDir("asc");
      }
   }

   function SortIcon({ col }: { col: SortKey }) {
      if (sortKey !== col) return <ArrowUpDown className="size-[11px] text-muted-foreground" />;
      return sortDir === "asc"
         ? <ArrowUp className="size-[11px] text-primary" />
         : <ArrowDown className="size-[11px] text-primary" />;
   }

   async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
         const { url } = await res.json();
         setForm((prev) => ({ ...prev, thumbnail: url }));
      }
      setUploading(false);
      e.target.value = "";
   }

   async function removeThumbnail() {
      if (form.thumbnail) {
         await fetch("/api/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: form.thumbnail }),
         });
         setForm((prev) => ({ ...prev, thumbnail: "" }));
      }
   }

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
            qty: String(t.qty),
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
         .filter((t) => t.qty && t.costPrice && t.sellPrice)
         .map((t) => ({
            qty: parseFloat(t.qty),
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

   const getMarkup = (p: Product) =>
      p.costPrice > 0 ? (p.sellPrice - p.costPrice) / p.costPrice * 100 : 0;

   const filtered = products
      .filter((p) => {
         const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.name.toLowerCase().includes(search.toLowerCase());
         const matchesCategory = categoryFilter.size === 0 || categoryFilter.has(p.categoryId);
         return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
         if (!sortKey) return 0;
         let aVal: number | string = 0;
         let bVal: number | string = 0;
         if (sortKey === "name") { aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); }
         else if (sortKey === "costPrice") { aVal = a.costPrice; bVal = b.costPrice; }
         else if (sortKey === "sellPrice") { aVal = a.sellPrice; bVal = b.sellPrice; }
         else if (sortKey === "markup") { aVal = getMarkup(a); bVal = getMarkup(b); }
         if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
         if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
         return 0;
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
   const qtyUnit = (qty: number, unit: string | null) => {
      const u = unit ?? "unit";
      return u.length > 2 ? `${qty} ${u}(s)` : `${qty}${u}(s)`;
   };

   return (
      <div>
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold tracking-tight">Products</h1>
               <p className="mt-1 text-muted-foreground">Manage your product catalog</p>
            </div>
            <div className="flex items-center gap-2">
               <Button
                  variant="outline"
                  onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
               >
                  {viewMode === "table" ? (
                     <><LayoutGrid className="mr-2 h-4 w-4" />Grid View</>
                  ) : (
                     <><TableIcon className="mr-2 h-4 w-4" />Table View</>
                  )}
               </Button>
               <Button onClick={openAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
               </Button>
            </div>
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

         {viewMode === "grid" ? (
            <div className="mt-4 flex flex-col gap-6">
               {loading ? (
                  <div className="text-center text-muted-foreground">Loading...</div>
               ) : filtered.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                     {search ? "No products match your search" : "No products yet"}
                  </div>
               ) : (() => {
                  const catMap = new Map<string, Product[]>();
                  for (const p of filtered) {
                     const existing = catMap.get(p.category.name);
                     if (existing) existing.push(p);
                     else catMap.set(p.category.name, [p]);
                  }
                  const groups = Array.from(catMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
                  return groups.map(([catName, prods]) => (
                     <div key={catName} className="rounded-lg border border-border/40 p-4">
                        <div className="flex items-center gap-2 mb-4">
                           <h3 className="text-lg font-semibold">{catName}</h3>
                           <Badge variant="outline" className="text-xs font-normal">{prods.length}</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                           {prods.map((product) => {
                              const hasTiers = product.priceTiers.length > 0;
                              return (
                                 <div
                                    key={product.id}
                                    className="group flex flex-col rounded-lg border border-border/40 bg-card overflow-hidden transition-colors hover:border-border/80 cursor-pointer"
                                    onClick={() => setTierProduct(product)}
                                 >
                                    <div className="relative aspect-square w-full bg-muted/30 flex items-center justify-center">
                                       {product.thumbnail ? (
                                          <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                                       ) : (
                                          <Package className="h-10 w-10 text-muted-foreground/40" />
                                       )}
                                       <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                             variant="secondary"
                                             size="icon"
                                             className="h-7 w-7"
                                             onClick={(e) => { e.stopPropagation(); openEdit(product); }}
                                          >
                                             <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                             variant="secondary"
                                             size="icon"
                                             className="h-7 w-7"
                                             onClick={(e) => { e.stopPropagation(); setConfirmDelete(product.id); }}
                                          >
                                             <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                          </Button>
                                       </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5 p-3">
                                       <p className="font-medium text-sm leading-tight truncate" title={product.name}>
                                          {product.name}
                                       </p>
                                       {product.description && (
                                          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                                       )}
                                       <div className="flex items-baseline justify-between gap-1 mt-1.5">
                                          <span className="text-sm font-semibold">{formatPrice(product.sellPrice)}</span>
                                          <span className="text-[11px] text-muted-foreground">/{product.unit ?? "unit"}</span>
                                       </div>
                                       {hasTiers && (
                                          <div className="mt-1 border-t border-border/30 pt-1.5">
                                             <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] text-muted-foreground">Pricing</p>
                                                <Badge variant="secondary" className="text-[9px] leading-none px-1 py-0">
                                                   {product.priceTiers.length}
                                                </Badge>
                                             </div>
                                             <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-0.5 text-[11px]">
                                                {product.priceTiers
                                                   .sort((a, b) => a.qty - b.qty)
                                                   .map((tier, i) => (
                                                      <Fragment key={i}>
                                                         <span className="text-muted-foreground whitespace-nowrap">
                                                            {((u: string | null) => { const unit = u ?? "unit"; return unit.length > 2 ? `${tier.qty} ${unit}` : `${tier.qty}${unit}`; })(product.unit)}{tier.qty !== 1 && <span className="text-[9px] text-muted-foreground/40">(s)</span>}
                                                         </span>
                                                         <span className="text-muted-foreground/50 whitespace-nowrap">
                                                            ({formatPrice(tier.sellPrice / tier.qty)}/{product.unit ?? "unit"})
                                                         </span>
                                                         <span className="font-medium text-right">{formatPrice(tier.sellPrice)}</span>
                                                      </Fragment>
                                                   ))}
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  ));
               })()}
            </div>
         ) : (
         <div className="mt-4 rounded-lg border border-border/40">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>
                        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                           Name <SortIcon col="name" />
                        </button>
                     </TableHead>
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
                                 <Filter className={cn("size-[11px]", categoryFilter.size > 0 ? "text-primary" : "text-muted-foreground")} />
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
                     <TableHead className="text-right">
                        <button className="ml-auto flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("costPrice")}>
                           Cost <SortIcon col="costPrice" />
                        </button>
                     </TableHead>
                     <TableHead className="text-right">
                        <button className="ml-auto flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("sellPrice")}>
                           Sell <SortIcon col="sellPrice" />
                        </button>
                     </TableHead>
                     <TableHead className="text-right">
                        <button className="ml-auto flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("markup")}>
                           Markup <SortIcon col="markup" />
                        </button>
                     </TableHead>
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
                        const margin = getMarkup(product).toFixed(1);
                        return (
                           <TableRow key={product.id}>
                              <TableCell className="font-medium">
                                 <div className="flex items-center gap-3">
                                    {product.thumbnail ? (
                                       <img
                                          src={product.thumbnail}
                                          alt={product.name}
                                          className="h-8 w-8 rounded object-cover"
                                       />
                                    ) : (
                                       <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                       </div>
                                    )}
                                    {product.name}
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <Badge variant="secondary">{product.category.name}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                 {product.unit ?? "unit"}
                              </TableCell>
                              <TableCell className="text-right">
                                 {formatPrice(product.costPrice)}/{product.unit ?? "unit"}
                              </TableCell>
                              <TableCell className="text-right">
                                 {formatPrice(product.sellPrice)}/{product.unit ?? "unit"}
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
         )}

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
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="description">Description</Label>
                     <textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        placeholder="Optional description"
                        rows={2}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden"
                        onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
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

                  <div className="rounded-lg border border-border/40 p-4">
                     <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-medium">Price Tiers</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addTier}>
                           <Plus className="mr-1 h-3 w-3" />
                           Add Tier
                        </Button>
                     </div>
                     {form.priceTiers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                           No price tiers. Base price applies to all quantities.
                        </p>
                     ) : (
                        <div className="flex flex-col gap-3">
                           {form.priceTiers.map((tier, i) => (
                              <div key={i} className="flex items-end gap-2 rounded-md border border-border/40 p-3">
                                 <div className="flex flex-col gap-1 flex-1">
                                    <Label className="text-xs text-muted-foreground">Qty</Label>
                                    <Input
                                       type="number"
                                       min="0.1"
                                       step="0.1"
                                       value={tier.qty}
                                       onChange={(e) => updateTier(i, "qty", e.target.value)}
                                       placeholder="1"
                                    />
                                 </div>
                                 <div className="flex flex-col gap-1 flex-1">
                                    <div className="flex items-center justify-between">
                                       <Label className="text-xs text-muted-foreground">Cost</Label>
                                       {tier.qty && tier.costPrice && parseFloat(tier.qty) > 0 && (
                                          <span className="text-[10px] text-muted-foreground/50">${(parseFloat(tier.costPrice) / parseFloat(tier.qty)).toFixed(2)}/{form.unit || "unit"}</span>
                                       )}
                                    </div>
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
                                    <div className="flex items-center justify-between">
                                       <Label className="text-xs text-muted-foreground">Sell</Label>
                                       {tier.qty && tier.sellPrice && parseFloat(tier.qty) > 0 && (
                                          <span className="text-[10px] text-muted-foreground/50">${(parseFloat(tier.sellPrice) / parseFloat(tier.qty)).toFixed(2)}/{form.unit || "unit"}</span>
                                       )}
                                    </div>
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

                  <div className="rounded-lg border border-border/40 p-4">
                     <Label className="text-base font-medium mb-3 block">Thumbnail</Label>
                     <div className="flex items-center gap-3">
                        {form.thumbnail ? (
                           <div className="relative h-20 w-20 rounded-md border border-border/40 overflow-hidden">
                              <img
                                 src={form.thumbnail}
                                 alt="Thumbnail"
                                 className="h-full w-full object-cover"
                              />
                              <button
                                 type="button"
                                 onClick={removeThumbnail}
                                 className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5"
                              >
                                 <X className="h-3 w-3 text-white" />
                              </button>
                           </div>
                        ) : (
                           <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border/60">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                           </div>
                        )}
                        <label className="cursor-pointer">
                           <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={handleThumbnailUpload}
                              disabled={uploading}
                           />
                           <div className="flex items-center gap-2 rounded-md border border-border/40 px-3 py-2 text-sm hover:bg-accent transition-colors">
                              <Upload className="h-4 w-4" />
                              {uploading ? "Uploading..." : "Upload Image"}
                           </div>
                        </label>
                     </div>
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
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
               {tierProduct && (
                  <>
                     <DialogHeader>
                        <DialogTitle>{tierProduct.name}</DialogTitle>
                     </DialogHeader>
                     <div className="flex flex-col gap-4 py-2">
                        <div className="relative aspect-video w-full rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                           {tierProduct.thumbnail ? (
                              <img src={tierProduct.thumbnail} alt={tierProduct.name} className="h-full w-full object-cover" />
                           ) : (
                              <Package className="h-16 w-16 text-muted-foreground/40" />
                           )}
                        </div>

                        <div className="flex items-center justify-between">
                           <p className="text-2xl font-bold">
                              {formatPrice(tierProduct.sellPrice)}
                              <span className="text-base text-muted-foreground">/{tierProduct.unit ?? "unit"}</span>
                           </p>
                           <Badge variant="secondary">{tierProduct.category.name}</Badge>
                        </div>

                        {tierProduct.description && (
                           <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tierProduct.description}</p>
                        )}

                        <div className="rounded-lg border border-border/40 p-4">
                           <p className="font-medium mb-3">Base Pricing</p>
                           <div className="grid grid-cols-3 gap-3">
                              <div className="rounded-md bg-muted/30 px-3 py-2 text-center">
                                 <p className="text-[10px] text-muted-foreground mb-0.5">Cost</p>
                                 <p className="text-sm font-semibold">{formatPrice(tierProduct.costPrice)}/{tierProduct.unit ?? "unit"}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2 text-center">
                                 <p className="text-[10px] text-muted-foreground mb-0.5">Sell</p>
                                 <p className="text-sm font-semibold">{formatPrice(tierProduct.sellPrice)}/{tierProduct.unit ?? "unit"}</p>
                              </div>
                              <div className="rounded-md bg-muted/30 px-3 py-2 text-center">
                                 <p className="text-[10px] text-muted-foreground mb-0.5">Markup</p>
                                 <p className="text-sm font-semibold">
                                    {tierProduct.costPrice > 0
                                       ? ((tierProduct.sellPrice - tierProduct.costPrice) / tierProduct.costPrice * 100).toFixed(1)
                                       : "0"}%
                                 </p>
                              </div>
                           </div>
                        </div>

                        {tierProduct.priceTiers.length > 0 && (
                           <div className="rounded-lg border border-border/40 p-4">
                              <div className="flex items-center justify-between mb-3">
                                 <p className="font-medium">Price Tiers</p>
                                 <Badge variant="secondary" className="text-xs">
                                    {tierProduct.priceTiers.length} tier(s)
                                 </Badge>
                              </div>
                              <Table>
                                 <TableHeader>
                                    <TableRow>
                                       <TableHead>Qty</TableHead>
                                       <TableHead className="text-right">Cost</TableHead>
                                       <TableHead className="text-right">Sell</TableHead>
                                       <TableHead className="text-right">Markup</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {tierProduct.priceTiers
                                       .sort((a, b) => a.qty - b.qty)
                                       .map((tier, i) => {
                                          const markup = tier.costPrice > 0
                                             ? ((tier.sellPrice - tier.costPrice) / tier.costPrice * 100).toFixed(1)
                                             : "0";
                                          const perUnit = tier.qty > 0 ? tier.sellPrice / tier.qty : 0;
                                          return (
                                             <TableRow key={i}>
                                                <TableCell className="font-medium">
                                                   {((u: string | null) => { const unit = u ?? "unit"; return unit.length > 2 ? `${tier.qty} ${unit}` : `${tier.qty}${unit}`; })(tierProduct.unit)}{tier.qty !== 1 && <span className="text-[10px] text-muted-foreground/40">(s)</span>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                   {formatPrice(tier.costPrice)}
                                                   <span className="ml-1 text-xs text-muted-foreground">
                                                      ({formatPrice(Number(tier.costPrice) / tier.qty)}/{tierProduct.unit ?? "unit"})
                                                   </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                   {formatPrice(tier.sellPrice)}
                                                   <span className="ml-1 text-xs text-muted-foreground">
                                                      ({formatPrice(perUnit)}/{tierProduct.unit ?? "unit"})
                                                   </span>
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                   {markup}%
                                                </TableCell>
                                             </TableRow>
                                          );
                                       })}
                                 </TableBody>
                              </Table>
                           </div>
                        )}
                     </div>
                     <DialogFooter className="flex gap-2">
                        <Button variant="destructive" onClick={() => { const id = tierProduct.id; setTierProduct(null); setConfirmDelete(id); }}>
                           <Trash2 className="mr-2 h-4 w-4" />
                           Delete
                        </Button>
                        <Button onClick={() => { setTierProduct(null); openEdit(tierProduct); }}>
                           <Pencil className="mr-2 h-4 w-4" />
                           Edit
                        </Button>
                        <DialogClose render={<Button variant="outline" />}>
                           Close
                        </DialogClose>
                     </DialogFooter>
                  </>
               )}
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
