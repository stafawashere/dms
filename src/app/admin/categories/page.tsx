"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
   DialogTrigger,
   DialogFooter,
   DialogClose,
} from "@/components/ui/dialog";

type Category = {
   id: string;
   name: string;
   _count: { products: number };
};

export default function CategoriesPage() {
   const [categories, setCategories] = useState<Category[]>([]);
   const [loading, setLoading] = useState(true);
   const [name, setName] = useState("");
   const [editId, setEditId] = useState<string | null>(null);
   const [editName, setEditName] = useState("");
   const [addOpen, setAddOpen] = useState(false);
   const [editOpen, setEditOpen] = useState(false);
   const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

   const fetchCategories = async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
      setLoading(false);
   };

   useEffect(() => {
      let ignore = false;
      fetch("/api/categories")
         .then((res) => res.json())
         .then((data) => {
            if (!ignore) {
               setCategories(data);
               setLoading(false);
            }
         });
      return () => { ignore = true; };
   }, []);

   async function handleAdd() {
      if (!name.trim()) return;
      await fetch("/api/categories", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ name: name.trim() }),
      });
      setName("");
      setAddOpen(false);
      fetchCategories();
   }

   async function handleEdit() {
      if (!editName.trim() || !editId) return;
      await fetch(`/api/categories/${editId}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ name: editName.trim() }),
      });
      setEditId(null);
      setEditName("");
      setEditOpen(false);
      fetchCategories();
   }

   async function handleDelete(id: string) {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      fetchCategories();
   }

   function openEdit(category: Category) {
      setEditId(category.id);
      setEditName(category.name);
      setEditOpen(true);
   }

   return (
      <div>
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
               <p className="mt-1 text-muted-foreground">Manage your product categories</p>
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
               <DialogTrigger render={<Button />}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
               </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                     <DialogTitle>Add Category</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 py-4">
                     <Label htmlFor="category-name">Name</Label>
                     <Input
                        id="category-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Electronics"
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                     />
                  </div>
                  <DialogFooter>
                     <DialogClose render={<Button variant="outline" />}>
                        Cancel
                     </DialogClose>
                     <Button onClick={handleAdd}>Create</Button>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
         </div>

         <div className="mt-6 rounded-lg border border-border/40">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Name</TableHead>
                     <TableHead className="text-center">Products</TableHead>
                     <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {loading ? (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                           Loading...
                        </TableCell>
                     </TableRow>
                  ) : categories.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                           No categories yet
                        </TableCell>
                     </TableRow>
                  ) : (
                     categories.map((category) => (
                        <TableRow key={category.id}>
                           <TableCell className="font-medium">{category.name}</TableCell>
                           <TableCell className="text-center text-muted-foreground">
                              {category._count.products}
                           </TableCell>
                           <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEdit(category)}
                                 >
                                    <Pencil className="h-4 w-4" />
                                 </Button>
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setConfirmDelete(category.id)}
                                 >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                 </Button>
                              </div>
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </div>

         <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Edit Category</DialogTitle>
               </DialogHeader>
               <div className="flex flex-col gap-3 py-4">
                  <Label htmlFor="edit-category-name">Name</Label>
                  <Input
                     id="edit-category-name"
                     value={editName}
                     onChange={(e) => setEditName(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                  />
               </div>
               <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                     Cancel
                  </DialogClose>
                  <Button onClick={handleEdit}>Save</Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
            <DialogContent className="sm:max-w-sm">
               <DialogHeader>
                  <DialogTitle>Delete Category</DialogTitle>
               </DialogHeader>
               <p className="text-sm text-muted-foreground">
                  This will permanently delete this category. Products using it will need to be reassigned.
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
