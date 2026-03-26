"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ResellerMobileSidebar from "./reseller-mobile-sidebar";

export default function ResellerHeader() {
   const { data: session } = useSession();

   const initials = session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

   return (
      <header className="flex h-16 items-center justify-between border-b border-border/40 px-4 md:px-6">
         <div className="flex items-center gap-3">
            <ResellerMobileSidebar />
         </div>
         <DropdownMenu>
            <DropdownMenuTrigger asChild={false}>
               <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                     <AvatarFallback className="bg-sidebar-accent text-xs">
                        {initials}
                     </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline-block">
                     {session?.user?.name ?? "User"}
                  </span>
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
               <DropdownMenuLabel>
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
               </DropdownMenuLabel>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </header>
   );
}
