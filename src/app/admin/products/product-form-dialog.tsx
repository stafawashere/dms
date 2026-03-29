"use client";

import { Plus, X, Upload, ImageIcon } from "lucide-react";
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
import type { Category } from "@/types/models";

export type TierForm = {
   qty: string;
   costPrice: string;
   sellPrice: string;
};

export type ProductForm = {
   name: string;
   categoryId: string;
   costPrice: string;
   sellPrice: string;
   unit: string;
   description: string;
   thumbnail: string;
   priceTiers: TierForm[];
};

type ProductFormDialogProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   form: ProductForm;
   updateForm: (field: keyof ProductForm, value: string) => void;
   onSubmit: () => void;
   editId: string | null;
   categories: Category[];
   uploading: boolean;
   onThumbnailUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
   onRemoveThumbnail: () => void;
   priceTiers: TierForm[];
   addTier: () => void;
   removeTier: (index: number) => void;
   updateTier: (index: number, field: keyof TierForm, value: string) => void;
};

export function ProductFormDialog({
   open,
   onOpenChange,
   form,
   updateForm,
   onSubmit,
   editId,
   categories,
   uploading,
   onThumbnailUpload,
   onRemoveThumbnail,
   priceTiers,
   addTier,
   removeTier,
   updateTier,
}: ProductFormDialogProps) {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
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
                  <ExpandingTextarea
                     id="description"
                     value={form.description}
                     onChange={(value) => updateForm("description", value)}
                     placeholder="Optional description"
                     rows={2}
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

               <div className="rounded-lg border border-border/70 p-4">
                  <div className="flex items-center justify-between mb-3">
                     <Label className="text-base font-medium">Price Tiers</Label>
                     <Button type="button" variant="outline" size="sm" onClick={addTier}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add Tier
                     </Button>
                  </div>
                  {priceTiers.length === 0 ? (
                     <p className="text-sm text-muted-foreground">
                        No price tiers. Base price applies to all quantities.
                     </p>
                  ) : (
                     <div className="flex flex-col gap-3">
                        {priceTiers.map((tier, i) => (
                           <div key={i} className="flex items-end gap-2 rounded-md border border-border/70 p-3">
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

               <div className="rounded-lg border border-border/70 p-4">
                  <Label className="text-base font-medium mb-3 block">Thumbnail</Label>
                  <div className="flex items-center gap-3">
                     {form.thumbnail ? (
                        <div className="relative h-20 w-20 rounded-md border border-border/70 overflow-hidden">
                           <img
                              src={form.thumbnail}
                              alt="Thumbnail"
                              className="h-full w-full object-cover"
                           />
                           <button
                              type="button"
                              onClick={onRemoveThumbnail}
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
                           onChange={onThumbnailUpload}
                           disabled={uploading}
                        />
                        <div className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm hover:bg-accent transition-colors">
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
               <Button onClick={onSubmit}>
                  {editId ? "Save" : "Create"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
