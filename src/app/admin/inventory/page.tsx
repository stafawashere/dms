"use client";

import { useState, useEffect } from "react";
import { unitLabel } from "@/lib/formatters";
import { Plus, ArrowUpDown, Package, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SearchBar } from "@/components/search-bar";
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
import { ExpandingTextarea } from "@/components/expanding-textarea";
import { cn } from "@/lib/utils";
import { Role, MovementType } from "@/generated/prisma/enums";
import type { UserInfo, InventoryProduct as Product, InventoryRecord } from "@/types/models";

type TransferForm = {
   productId: string;
   userId: string;
   quantity: string;
   type: MovementType;
   note: string;
};

const emptyTransfer: TransferForm = {
   productId: "",
   userId: "",
   quantity: "",
   type: MovementType.IN,
   note: "",
};

export default function InventoryPage() {
   const [inventory, setInventory] = useState<InventoryRecord[]>([]);
   const [users, setUsers] = useState<UserInfo[]>([]);
   const [products, setProducts] = useState<Product[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [dialogOpen, setDialogOpen] = useState(false);
   const [form, setForm] = useState<TransferForm>(emptyTransfer);
   const [userFilter, setUserFilter] = useState<string>("all");
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      let ignore = false;
      Promise.all([
         fetch("/api/inventory").then((r) => r.json()),
         fetch("/api/users").then((r) => r.json()),
         fetch("/api/products").then((r) => r.json()),
      ]).then(([inventoryData, usersData, productsData]) => {
         if (!ignore) {
            setInventory(inventoryData);
            setUsers(usersData);
            setProducts(productsData);
            setLoading(false);
         }
      });
      return () => { ignore = true; };
   }, []);

   const fetchInventory = async () => {
      const res = await fetch("/api/inventory");
      setInventory(await res.json());
   };

   function openTransfer() {
      setForm(emptyTransfer);
      setDialogOpen(true);
   }

   function updateForm(field: keyof TransferForm, value: string) {
      setForm((prev) => ({ ...prev, [field]: value }));
   }

   async function handleTransfer() {
      if (!form.productId || !form.userId || !form.quantity) return;
      setSubmitting(true);

      await fetch("/api/inventory/transfer", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            productId: form.productId,
            userId: form.userId,
            quantity: parseInt(form.quantity),
            type: form.type,
            note: form.note.trim() || null,
         }),
      });

      setDialogOpen(false);
      setForm(emptyTransfer);
      setSubmitting(false);
      fetchInventory();
   }

   const filtered = inventory.filter((inv) => {
      const matchesSearch =
         inv.product.name.toLowerCase().includes(search.toLowerCase()) ||
         inv.user.name.toLowerCase().includes(search.toLowerCase());
      const matchesUser = userFilter === "all" || inv.userId === userFilter;
      return matchesSearch && matchesUser;
   });

   const totalStock = filtered.reduce((sum, inv) => sum + inv.quantity, 0);

   const stockByUser = inventory.reduce((acc, inv) => {
      if (!acc[inv.userId]) {
         acc[inv.userId] = { user: inv.user, total: 0, products: 0 };
      }
      acc[inv.userId].total += inv.quantity;
      acc[inv.userId].products += 1;
      return acc;
   }, {} as Record<string, { user: UserInfo; total: number; products: number }>);

   return (
      <div>
         <PageHeader title="Inventory" description="Manage stock across all users">
            <Button onClick={openTransfer}>
               <Plus className="mr-2 h-4 w-4" />
               Move Stock
            </Button>
         </PageHeader>

         {Object.keys(stockByUser).length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(stockByUser).map((entry) => (
               <div
                  key={entry.user.id}
                  className={cn(
                     "rounded-lg border border-border/70 p-4 cursor-pointer transition-colors",
                     userFilter === entry.user.id
                        ? "bg-accent border-primary/30"
                        : "hover:bg-accent/50"
                  )}
                  onClick={() =>
                     setUserFilter(userFilter === entry.user.id ? "all" : entry.user.id)
                  }
               >
                  <div className="flex items-center gap-2">
                     <UserIcon className="h-4 w-4 text-muted-foreground" />
                     <span className="text-sm font-medium">{entry.user.name}</span>
                     <Badge variant="outline" className="ml-auto text-xs">
                        {entry.user.role}
                     </Badge>
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                     <span className="text-2xl font-bold">{entry.total}</span>
                     <span className="text-xs text-muted-foreground">
                        unit(s) across {entry.products} product(s)
                     </span>
                  </div>
               </div>
            ))}
            </div>
         )}

         <div className="mt-6 flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by product or user..." />
            {userFilter !== "all" && (
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserFilter("all")}
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
                     <TableHead>Product</TableHead>
                     <TableHead>User</TableHead>
                     <TableHead>Role</TableHead>
                     <TableHead className="text-right">Quantity</TableHead>
                     <TableHead className="text-right">Last Updated</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {loading ? (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                           Loading...
                        </TableCell>
                     </TableRow>
                  ) : filtered.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                           {search || userFilter !== "all"
                              ? "No inventory matches your filter"
                              : "No inventory records yet"}
                        </TableCell>
                     </TableRow>
                  ) : (
                     filtered.map((inv) => (
                        <TableRow key={inv.id}>
                           <TableCell>
                              <div className="flex items-center gap-2">
                                 <Package className="h-4 w-4 text-muted-foreground" />
                                 <span className="font-medium">{inv.product.name}</span>
                              </div>
                           </TableCell>
                           <TableCell>{inv.user.name}</TableCell>
                           <TableCell>
                              <Badge variant={inv.user.role === Role.ADMIN ? "default" : "secondary"}>
                                 {inv.user.role}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right">
                              <span className={cn(
                                 "font-medium",
                                 inv.quantity <= 0 && "text-destructive",
                                 inv.quantity > 0 && inv.quantity <= 10 && "text-yellow-500"
                              )}>
                                 {inv.quantity}
                              </span>
                              <span className="ml-1 text-xs text-muted-foreground">
                                 {unitLabel(inv.product.unit)}
                              </span>
                           </TableCell>
                           <TableCell className="text-right text-muted-foreground text-sm">
                              {new Date(inv.updatedAt).toLocaleDateString("en-US", {
                                 month: "short",
                                 day: "numeric",
                                 year: "numeric",
                              })}
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
                  <DialogTitle>Move Stock</DialogTitle>
               </DialogHeader>
               <div className="flex flex-col gap-4 py-4">
                  <div className="flex flex-col gap-2">
                     <Label>User</Label>
                     <Select
                        value={form.userId}
                        onValueChange={(val) => updateForm("userId", val ?? "")}
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Select user">
                              {users.find((u) => u.id === form.userId)?.name ?? "Select user"}
                           </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                           {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                 {user.name} ({user.role})
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                     <Label>Product</Label>
                     <Select
                        value={form.productId}
                        onValueChange={(val) => updateForm("productId", val ?? "")}
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Select product">
                              {products.find((p: Product) => p.id === form.productId)?.name ?? "Select product"}
                           </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                           {products.map((product: Product) => (
                              <SelectItem key={product.id} value={product.id}>
                                 {product.name}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2">
                        <Label>Type</Label>
                        <Select
                           value={form.type}
                           onValueChange={(val) => updateForm("type", val ?? MovementType.IN)}
                        >
                           <SelectTrigger className="w-full">
                              <SelectValue>
                                 {form.type === MovementType.IN ? "Add Stock" : form.type === MovementType.OUT ? "Remove Stock" : "Adjustment"}
                              </SelectValue>
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value={MovementType.IN}>Add Stock</SelectItem>
                              <SelectItem value={MovementType.OUT}>Remove Stock</SelectItem>
                              <SelectItem value={MovementType.ADJUSTMENT}>Adjustment</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="flex flex-col gap-2">
                        <Label htmlFor="transfer-qty">Quantity</Label>
                        <Input
                           id="transfer-qty"
                           type="number"
                           min="1"
                           value={form.quantity}
                           onChange={(e) => updateForm("quantity", e.target.value)}
                           placeholder="0"
                        />
                     </div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="transfer-note">Note (optional)</Label>
                     <ExpandingTextarea
                        id="transfer-note"
                        value={form.note}
                        onChange={(value) => updateForm("note", value)}
                        placeholder="Reason for movement..."
                        rows={2}
                     />
                  </div>
               </div>
               <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                     Cancel
                  </DialogClose>
                  <Button onClick={handleTransfer} disabled={submitting}>
                     {submitting ? "Processing..." : "Transfer"}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
}
