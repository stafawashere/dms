"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuGroup,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ResellerMobileSidebar from "./reseller-mobile-sidebar";

export default function ResellerHeader() {
   const { data: session } = useSession();
   const router = useRouter();

   const initials = session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

   const adminId = typeof document !== "undefined"
      ? document.cookie.match(/dms-admin-id=([^;]+)/)?.[1]
      : null;

   const switchBackToAdmin = async () => {
      if (!adminId) return;
      const res = await fetch("/api/auth/impersonate", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ userId: adminId }),
      });
      if (res.ok) {
         router.push("/admin/dashboard");
         router.refresh();
      }
   };

   return (
      <header className="flex h-16 items-center justify-between border-b border-border/40 px-4 md:px-6">
         <div className="flex items-center gap-3">
            <ResellerMobileSidebar />
         </div>
         <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent outline-none cursor-pointer">
               <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sidebar-accent text-xs">
                     {initials}
                  </AvatarFallback>
               </Avatar>
               <span className="hidden text-sm font-medium sm:inline-block">
                  {session?.user?.name ?? "User"}
               </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
               <DropdownMenuGroup>
                  <DropdownMenuLabel>
                     <p className="text-sm font-medium">{session?.user?.name}</p>
                     <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </DropdownMenuLabel>
               </DropdownMenuGroup>
               <DropdownMenuSeparator />
               {adminId && (
                  <>
                     <DropdownMenuItem onClick={switchBackToAdmin}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Back to Admin
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                  </>
               )}
               <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </header>
   );
}
