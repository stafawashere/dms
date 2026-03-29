"use client";

import { useState, useEffect } from "react";
import { Plus, LayoutGrid, TableIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Category, Product } from "@/types/models";
import type { SortKey, SortDir } from "./product-table";
import type { TierForm, ProductForm } from "./product-form-dialog";
import { ProductGrid } from "./product-grid";
import { ProductTable } from "./product-table";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductDetailDialog } from "./product-detail-dialog";

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

   return (
      <div>
         <PageHeader title="Products" description="Manage your product catalog">
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
         </PageHeader>

         <div className="mt-6 flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search products..." />
         </div>

         {viewMode === "grid" ? (
            <ProductGrid
               products={filtered}
               loading={loading}
               search={search}
               onEdit={openEdit}
               onDelete={(id) => setConfirmDelete(id)}
               onViewTiers={(product) => setTierProduct(product)}
            />
         ) : (
            <ProductTable
               products={filtered}
               categories={categories}
               loading={loading}
               search={search}
               sortKey={sortKey}
               sortDir={sortDir}
               toggleSort={toggleSort}
               categoryFilter={categoryFilter}
               toggleCategoryFilter={toggleCategoryFilter}
               clearCategoryFilter={() => setCategoryFilter(new Set())}
               getMarkup={getMarkup}
               onEdit={openEdit}
               onDelete={(id) => setConfirmDelete(id)}
               onViewTiers={(product) => setTierProduct(product)}
            />
         )}

         <ProductFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            form={form}
            updateForm={updateForm}
            onSubmit={handleSubmit}
            editId={editId}
            categories={categories}
            uploading={uploading}
            onThumbnailUpload={handleThumbnailUpload}
            onRemoveThumbnail={removeThumbnail}
            priceTiers={form.priceTiers}
            addTier={addTier}
            removeTier={removeTier}
            updateTier={updateTier}
         />

         <ProductDetailDialog
            product={tierProduct}
            onClose={() => setTierProduct(null)}
            onEdit={openEdit}
            onDelete={(id) => setConfirmDelete(id)}
         />

         <ConfirmDialog
            open={!!confirmDelete}
            onOpenChange={() => setConfirmDelete(null)}
            title="Delete Product"
            description="This will permanently delete this product and all its price tiers."
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
         />
      </div>
   );
}
