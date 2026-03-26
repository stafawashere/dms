import { SessionProvider } from "next-auth/react";
import ResellerSidebar from "@/components/layout/reseller-sidebar";
import ResellerHeader from "@/components/layout/reseller-header";

export default function ResellerLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <SessionProvider>
         <div className="flex h-screen overflow-hidden">
            <ResellerSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
               <ResellerHeader />
               <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  {children}
               </main>
            </div>
         </div>
      </SessionProvider>
   );
}
