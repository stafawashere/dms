"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";

type ExpandingTextareaProps = {
   value: string;
   onChange: (value: string) => void;
   placeholder?: string;
   rows?: number;
   className?: string;
   id?: string;
};

export function ExpandingTextarea({ value, onChange, placeholder, rows = 2, className, id }: ExpandingTextareaProps) {
   const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
      const t = e.currentTarget;
      t.style.height = "auto";
      t.style.height = t.scrollHeight + "px";
   }, []);

   return (
      <textarea
         id={id}
         value={value}
         onChange={(e) => onChange(e.target.value)}
         placeholder={placeholder}
         rows={rows}
         className={cn(
            "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none overflow-hidden",
            className
         )}
         onInput={handleInput}
      />
   );
}
