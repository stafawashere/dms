type PricingSource = {
   sellPrice: number;
   priceTiers: { qty: number; sellPrice: number }[];
};

export function getApplicablePrice(source: PricingSource, qty: number): number {
   if (!source.priceTiers || source.priceTiers.length === 0) return Number(source.sellPrice);
   const match = source.priceTiers.find((t) => t.qty === qty);
   if (match) return Number(match.sellPrice) / qty;
   return Number(source.sellPrice);
}

export function computeFinalSoldPrice(
   pricingMode: "auto" | "custom-per-unit" | "flat-total",
   soldPrice: string,
   flatTotal: string,
   quantity: string
): number {
   if (pricingMode === "flat-total" && flatTotal && quantity) {
      return parseFloat(flatTotal) / parseInt(quantity);
   }
   return parseFloat(soldPrice);
}

export function computeFinalTotal(
   pricingMode: "auto" | "custom-per-unit" | "flat-total",
   soldPrice: string,
   flatTotal: string,
   quantity: string
): number {
   if (pricingMode === "flat-total" && flatTotal) return parseFloat(flatTotal);
   if (soldPrice && quantity) return parseFloat(soldPrice) * parseInt(quantity);
   return 0;
}
