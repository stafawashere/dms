import {
   LayoutDashboard,
   Package,
   Warehouse,
   Users,
   ShoppingCart,
   BarChart3,
   FolderOpen,
   History,
} from "lucide-react";

export const adminNavItems = [
   { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
   { label: "Products", href: "/admin/products", icon: Package },
   { label: "Categories", href: "/admin/categories", icon: FolderOpen },
   { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
   { label: "Resellers", href: "/admin/resellers", icon: Users },
   { label: "Sales", href: "/admin/sales", icon: ShoppingCart },
   { label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

export const resellerNavItems = [
   { label: "Dashboard", href: "/reseller/dashboard", icon: LayoutDashboard },
   { label: "Products", href: "/reseller/products", icon: Package },
   { label: "Sales", href: "/reseller/sales/history", icon: History },
   { label: "Inventory", href: "/reseller/inventory", icon: Warehouse },
];
