"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { resellerNavItems } from "./nav-items";

export default function ResellerSidebar() {
   const pathname = usePathname();

   return (
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border/40 bg-sidebar">
         <div className="flex h-16 items-center px-6">
            <Link href="/reseller/dashboard" className="flex items-center gap-3">
               <span className="text-xl font-bold tracking-tight">DMS</span>
               <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">Reseller</span>
            </Link>
         </div>
         <Separator className="opacity-40" />
         <nav className="flex-1 px-3 py-4">
            <ul className="flex flex-col gap-1">
               <li>
                  <Link
                     href="/reseller/sales/history?new=true"
                     className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                  >
                     <Plus className="h-4 w-4" />
                     New Sale
                  </Link>
               </li>
               {resellerNavItems.map((item) => {
                  const active = pathname === item.href || (item.href !== "/reseller/dashboard" && pathname.startsWith(item.href));
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
