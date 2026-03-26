import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
   variable: "--font-sans",
   subsets: ["latin"],
});

export const metadata: Metadata = {
   title: "DMS - Distributor Manager System",
   description: "Track inventory, products, and reseller sales",
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="en" className={`dark ${inter.variable} h-full antialiased`}>
         <body className="min-h-full flex flex-col font-sans">{children}</body>
      </html>
   );
}
