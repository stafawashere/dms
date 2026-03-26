"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
   const router = useRouter();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError("");
      setLoading(true);

      const res = await signIn("credentials", {
         email,
         password,
         redirect: false,
      });

      if (res?.error) {
         setError("Invalid email or password");
         setLoading(false);
         return;
      }

      router.push("/");
      router.refresh();
   }

   return (
      <div className="flex min-h-screen items-center justify-center px-4">
         <Card className="w-full max-w-xl border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
               <CardTitle className="text-2xl font-bold tracking-tight">DMS</CardTitle>
               <p className="text-sm text-muted-foreground">Distributor Manager System</p>
            </CardHeader>
            <CardContent>
               <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="email">Email</Label>
                     <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                     />
                  </div>
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="password">Password</Label>
                     <Input
                        id="password"
                        type="password"
                        placeholder="•••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                     />
                  </div>
                  {error && (
                     <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                     {loading ? "Signing in..." : "Sign in"}
                  </Button>
               </form>
            </CardContent>
         </Card>
      </div>
   );
}
