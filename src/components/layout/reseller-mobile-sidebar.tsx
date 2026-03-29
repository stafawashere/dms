"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { resellerNavItems } from "./nav-items";

export default function ResellerMobileSidebar() {
   const [open, setOpen] = useState(false);
   const pathname = usePathname();

   return (
      <>
         <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
         </Button>
         <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar">
               <div className="flex h-16 items-center px-6">
                  <span className="text-xl font-bold tracking-tight">DMS</span>
                  <span className="text-xs text-muted-foreground mt-1 ml-2">Reseller</span>
               </div>
               <Separator className="opacity-40" />
               <nav className="px-3 py-4">
                  <ul className="flex flex-col gap-1">
                     <li>
                        <Link
                           href="/reseller/sales/history?new=true"
                           onClick={() => setOpen(false)}
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
                                 onClick={() => setOpen(false)}
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
            </SheetContent>
         </Sheet>
      </>
   );
}
