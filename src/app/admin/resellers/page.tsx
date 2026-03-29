"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/formatters";
import { Plus, Pencil, UserX, UserCheck, Eye, Trash2, DatabaseZap } from "lucide-react";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ResellerDetailDialog } from "./reseller-detail-dialog";
import { WipeDialog } from "./wipe-dialog";
import { cn } from "@/lib/utils";
import type { Reseller, ResellerDetail } from "@/types/models";

type ResellerForm = {
   name: string;
   email: string;
   password: string;
};

const emptyForm: ResellerForm = { name: "", email: "", password: "" };

export default function ResellersPage() {
   const [resellers, setResellers] = useState<Reseller[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editDialog, setEditDialog] = useState(false);
   const [detailDialog, setDetailDialog] = useState(false);
   const [form, setForm] = useState<ResellerForm>(emptyForm);
   const [editForm, setEditForm] = useState<ResellerForm>(emptyForm);
   const [editId, setEditId] = useState<string | null>(null);
   const [detail, setDetail] = useState<ResellerDetail | null>(null);
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState("");
   const [confirmToggle, setConfirmToggle] = useState<Reseller | null>(null);
   const [confirmDelete, setConfirmDelete] = useState<Reseller | null>(null);
   const [wipeTarget, setWipeTarget] = useState<Reseller | null>(null);
   const [wiping, setWiping] = useState(false);

   useEffect(() => {
      let ignore = false;
      fetch("/api/resellers")
         .then((r) => r.json())
         .then((data) => { if (!ignore) { setResellers(data); setLoading(false); } });
      return () => { ignore = true; };
   }, []);

   async function fetchResellers() {
      const data = await fetch("/api/resellers").then((r) => r.json());
      setResellers(data);
   }

   async function handleAdd() {
      if (!form.name || !form.email || !form.password) return;
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/resellers", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(form),
      });

      if (!res.ok) {
         const data = await res.json();
         setError(data.error || "Failed to create reseller");
         setSubmitting(false);
         return;
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setSubmitting(false);
      fetchResellers();
   }

   async function handleEdit() {
      if (!editId || !editForm.name || !editForm.email) return;
      setSubmitting(true);
      setError("");

      const body: Record<string, string> = { name: editForm.name, email: editForm.email };
      if (editForm.password) body.password = editForm.password;

      const res = await fetch(`/api/resellers/${editId}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(body),
      });

      if (!res.ok) {
         const data = await res.json();
         setError(data.error || "Failed to update reseller");
         setSubmitting(false);
         return;
      }

      setEditDialog(false);
      setEditForm(emptyForm);
      setEditId(null);
      setSubmitting(false);
      fetchResellers();
   }

   async function handleToggleActive(reseller: Reseller) {
      await fetch(`/api/resellers/${reseller.id}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ active: !reseller.active }),
      });
      setConfirmToggle(null);
      fetchResellers();
   }

   async function handlePermanentDelete(reseller: Reseller) {
      await fetch(`/api/resellers/${reseller.id}?permanent=true`, { method: "DELETE" });
      setConfirmDelete(null);
      fetchResellers();
   }

   async function openDetail(id: string) {
      const data = await fetch(`/api/resellers/${id}`).then((r) => r.json());
      setDetail(data);
      setDetailDialog(true);
   }

   function openEdit(reseller: Reseller) {
      setEditId(reseller.id);
      setEditForm({ name: reseller.name, email: reseller.email, password: "" });
      setError("");
      setEditDialog(true);
   }

   async function handleWipe(options: { sales: boolean; inventory: boolean; movements: boolean }) {
      if (!wipeTarget) return;
      if (!options.sales && !options.inventory && !options.movements) return;
      setWiping(true);

      await fetch(`/api/resellers/${wipeTarget.id}/wipe`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(options),
      });

      setWiping(false);
      setWipeTarget(null);
      fetchResellers();
   }

   const filtered = resellers.filter(
      (r) =>
         r.name.toLowerCase().includes(search.toLowerCase()) ||
         r.email.toLowerCase().includes(search.toLowerCase())
   );

   if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

   return (
      <div>
         <PageHeader title="Resellers" description="Manage your reseller accounts">
            <Button onClick={() => { setForm(emptyForm); setError(""); setDialogOpen(true); }}>
               <Plus className="mr-2 h-4 w-4" />
               Add Reseller
            </Button>
         </PageHeader>

         <div className="mt-6 flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email..." />
         </div>

         <div className="mt-4 rounded-md border border-border/70">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Name</TableHead>
                     <TableHead>Email</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Sales</TableHead>
                     <TableHead>Products</TableHead>
                     <TableHead>Joined</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filtered.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                           No resellers found
                        </TableCell>
                     </TableRow>
                  ) : (
                     filtered.map((reseller) => (
                        <TableRow key={reseller.id} className={cn(!reseller.active && "opacity-50")}>
                           <TableCell className="font-medium">{reseller.name}</TableCell>
                           <TableCell className="text-muted-foreground">{reseller.email}</TableCell>
                           <TableCell>
                              <Badge variant={reseller.active ? "default" : "secondary"}>
                                 {reseller.active ? "Active" : "Inactive"}
                              </Badge>
                           </TableCell>
                           <TableCell>{reseller._count.sales}</TableCell>
                           <TableCell>{reseller._count.inventory}</TableCell>
                           <TableCell className="text-muted-foreground">{formatDate(reseller.createdAt, false, true)}</TableCell>
                           <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                 <Button variant="ghost" size="icon" onClick={() => openDetail(reseller.id)}>
                                    <Eye className="h-4 w-4" />
                                 </Button>
                                 <Button variant="ghost" size="icon" onClick={() => openEdit(reseller)}>
                                    <Pencil className="h-4 w-4" />
                                 </Button>
                                 <Button variant="ghost" size="icon" onClick={() => setWipeTarget(reseller)}>
                                    <DatabaseZap className="h-4 w-4" />
                                 </Button>
                                 <Button variant="ghost" size="icon" onClick={() => setConfirmToggle(reseller)}>
                                    {reseller.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                 </Button>
                                 {!reseller.active && (
                                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(reseller)}>
                                       <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                 )}
                              </div>
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </div>

         <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Add Reseller</DialogTitle>
               </DialogHeader>
               <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="r-name">Name</Label>
                     <Input id="r-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="r-email">Email</Label>
                     <Input id="r-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                  </div>
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="r-pass">Password</Label>
                     <Input id="r-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set login password" />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
               </div>
               <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                     Cancel
                  </DialogClose>
                  <Button onClick={handleAdd} disabled={submitting || !form.name || !form.email || !form.password}>
                     {submitting ? "Creating..." : "Create"}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         <Dialog open={editDialog} onOpenChange={setEditDialog}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Edit Reseller</DialogTitle>
               </DialogHeader>
               <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="re-name">Name</Label>
                     <Input id="re-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="re-email">Email</Label>
                     <Input id="re-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="re-pass">New Password</Label>
                     <Input id="re-pass" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep current" />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
               </div>
               <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                     Cancel
                  </DialogClose>
                  <Button onClick={handleEdit} disabled={submitting || !editForm.name || !editForm.email}>
                     {submitting ? "Saving..." : "Save"}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         <ResellerDetailDialog
            open={detailDialog}
            onOpenChange={setDetailDialog}
            detail={detail}
         />

         <ConfirmDialog
            open={!!confirmDelete}
            onOpenChange={() => setConfirmDelete(null)}
            title="Permanently Delete Reseller"
            description={
               <>
                  This will permanently delete <span className="font-medium text-foreground">{confirmDelete?.name}</span> and all their sales, inventory, and stock movements. This cannot be undone.
               </>
            }
            confirmLabel="Delete Permanently"
            variant="destructive"
            onConfirm={() => confirmDelete && handlePermanentDelete(confirmDelete)}
         />

         <ConfirmDialog
            open={!!confirmToggle}
            onOpenChange={() => setConfirmToggle(null)}
            title={`${confirmToggle?.active ? "Deactivate" : "Reactivate"} Reseller`}
            description={
               confirmToggle?.active
                  ? `${confirmToggle.name} will no longer be able to log in or record sales.`
                  : `${confirmToggle?.name} will be able to log in and record sales again.`
            }
            confirmLabel={confirmToggle?.active ? "Deactivate" : "Reactivate"}
            variant={confirmToggle?.active ? "destructive" : "default"}
            onConfirm={() => confirmToggle && handleToggleActive(confirmToggle)}
         />

         <WipeDialog
            target={wipeTarget}
            onClose={() => setWipeTarget(null)}
            onWipe={handleWipe}
            wiping={wiping}
         />
      </div>
   );
}
