export function formatPrice(n: number): string {
   return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function unitLabel(unit: string | null): string {
   return unit ? `${unit}(s)` : "unit(s)";
}

export function formatDate(d: string, includeTime = true, includeYear = false): string {
   const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
   if (includeYear) opts.year = "numeric";
   if (includeTime) { opts.hour = "numeric"; opts.minute = "2-digit"; }
   return new Date(d).toLocaleDateString("en-US", opts);
}

export function qtyUnit(qty: number, unit: string | null): string {
   const u = unit ?? "unit";
   const suffix = qty !== 1 ? "(s)" : "";
   return u.length > 2 ? `${qty} ${u}${suffix}` : `${qty}${u}${suffix}`;
}

export function qtyUnitShort(qty: number, unit: string | null): string {
   const u = unit ?? "unit";
   return u.length > 2 ? `${qty} ${u}` : `${qty}${u}`;
}

export function rateUnit(unit: string | null): string {
   return unit ?? "unit";
}
