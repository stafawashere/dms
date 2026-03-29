import type { SaleStatus } from "@/generated/prisma/enums";

export type PricingMode = "auto" | "custom-per-unit" | "flat-total";

export type PriceTier = {
   id?: string;
   qty: number;
   costPrice: number;
   sellPrice: number;
};

export type Category = {
   id: string;
   name: string;
};

export type Product = {
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

export type SaleProduct = {
   id: string;
   name: string;
   sellPrice: number;
   costPrice: number;
   unit: string | null;
   priceTiers: { qty: number; sellPrice: number; costPrice: number }[];
};

export type SaleReseller = {
   id: string;
   name: string;
   email: string;
   role: string;
};

export type Sale = {
   id: string;
   resellerId: string;
   productId: string;
   quantity: number;
   soldPrice: number;
   notes: string | null;
   status: SaleStatus;
   createdAt: string;
   product: SaleProduct;
   reseller: SaleReseller;
};

export type ResellerSale = {
   id: string;
   quantity: number;
   soldPrice: number;
   notes: string | null;
   status: SaleStatus;
   createdAt: string;
   product: { name: string; unit: string | null };
};

export type InventoryItem = {
   id: string;
   quantity: number;
   product: {
      id: string;
      name: string;
      unit: string | null;
      sellPrice: number;
      priceTiers: { qty: number; sellPrice: number }[];
   };
};

export type Reseller = {
   id: string;
   name: string;
   email: string;
   active: boolean;
   createdAt: string;
   _count: { sales: number; inventory: number };
};

export type ResellerDetail = Reseller & {
   inventory: { id: string; quantity: number; product: { id: string; name: string; unit: string | null } }[];
   sales: { id: string; quantity: number; soldPrice: number; createdAt: string; product: { name: string } }[];
};

export type UserInfo = {
   id: string;
   name: string;
   email: string;
   role: string;
};

export type InventoryProduct = {
   id: string;
   name: string;
   unit: string | null;
   category: { id: string; name: string };
};

export type InventoryRecord = {
   id: string;
   userId: string;
   productId: string;
   quantity: number;
   updatedAt: string;
   user: UserInfo;
   product: InventoryProduct;
};
