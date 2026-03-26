"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut, User, ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuGroup,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
   DropdownMenuSub,
   DropdownMenuSubTrigger,
   DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MobileSidebar from "./mobile-sidebar";

interface Reseller {
   id: string;
   name: string;
   email: string;
   active: boolean;
}

export default function Header() {
   const { data: session } = useSession();
   const router = useRouter();
   const [resellers, setResellers] = useState<Reseller[]>([]);

   const initials = session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

   useEffect(() => {
      if (session?.user?.role === "ADMIN") {
         fetch("/api/resellers")
            .then((res) => res.json())
            .then((data) => setResellers(data.filter((r: Reseller) => r.active)));
      }
   }, [session?.user?.role]);

   const switchAccount = async (userId: string, role: string) => {
      const res = await fetch("/api/auth/impersonate", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ userId }),
      });
      if (res.ok) {
         router.push(role === "ADMIN" ? "/admin/dashboard" : "/reseller/dashboard");
         router.refresh();
      }
   };

   return (
      <header className="flex h-16 items-center justify-between border-b border-border/40 px-4 md:px-6">
         <div className="flex items-center gap-3">
            <MobileSidebar />
         </div>
         <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="flex items-center gap-2 px-2" />}>
                  <Avatar className="h-8 w-8">
                     <AvatarFallback className="bg-sidebar-accent text-xs">
                        {initials}
                     </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline-block">
                     {session?.user?.name ?? "User"}
                  </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
               <DropdownMenuGroup>
                  <DropdownMenuLabel>
                     <p className="text-sm font-medium">{session?.user?.name}</p>
                     <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </DropdownMenuLabel>
               </DropdownMenuGroup>
               <DropdownMenuSeparator />
               {session?.user?.role === "ADMIN" && resellers.length > 0 && (
                  <>
                     <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                           <ArrowLeftRight className="mr-2 h-4 w-4" />
                           Switch Account
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                           {resellers.map((r) => (
                              <DropdownMenuItem key={r.id} onClick={() => switchAccount(r.id, "RESELLER")}>
                                 <div className="flex flex-col">
                                    <span className="text-sm">{r.name}</span>
                                    <span className="text-xs text-muted-foreground">{r.email}</span>
                                 </div>
                              </DropdownMenuItem>
                           ))}
                        </DropdownMenuSubContent>
                     </DropdownMenuSub>
                     <DropdownMenuSeparator />
                  </>
               )}
               <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
               </DropdownMenuItem>
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
