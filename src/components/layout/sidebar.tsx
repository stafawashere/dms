"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
   LayoutDashboard,
   Package,
   Warehouse,
   Users,
   ShoppingCart,
   BarChart3,
   FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
   { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
   { label: "Products", href: "/admin/products", icon: Package },
   { label: "Categories", href: "/admin/categories", icon: FolderOpen },
   { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
   { label: "Resellers", href: "/admin/resellers", icon: Users },
   { label: "Sales", href: "/admin/sales", icon: ShoppingCart },
   { label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

export default function Sidebar() {
   const pathname = usePathname();

   return (
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border/40 bg-sidebar">
         <div className="flex h-16 items-center px-6">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
               <span className="text-xl font-bold tracking-tight">DMS</span>
               <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">Admin</span>
            </Link>
         </div>
         <Separator className="opacity-40" />
         <nav className="flex-1 px-3 py-4">
            <ul className="flex flex-col gap-1">
               {navItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                     <li key={item.href}>
                        <Link
                           href={item.href}
                           className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              active
                                 ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                 : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                           )}
                        >
                           <item.icon className="h-4 w-4" />
                           {item.label}
                        </Link>
                     </li>
                  );
               })}
            </ul>
         </nav>
      </aside>
   );
}
