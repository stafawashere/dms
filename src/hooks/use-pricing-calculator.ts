"use client";

import { useState, useCallback } from "react";
import type { PricingMode } from "@/types/models";
import { getApplicablePrice, computeFinalSoldPrice, computeFinalTotal } from "@/lib/pricing";

type PricingSource = {
   sellPrice: number;
   priceTiers: { qty: number; sellPrice: number }[];
};

export function usePricingCalculator() {
   const [pricingMode, setPricingMode] = useState<PricingMode>("auto");
   const [quantity, setQuantityRaw] = useState("");
   const [soldPrice, setSoldPrice] = useState("");
   const [flatTotal, setFlatTotal] = useState("");

   const setQuantity = useCallback((value: string, source?: PricingSource) => {
      setQuantityRaw(value);
      if (source && value && pricingMode === "auto") {
         setSoldPrice(String(getApplicablePrice(source, parseInt(value))));
      }
   }, [pricingMode]);

   const onProductChange = useCallback((source: PricingSource | undefined, currentQty?: string) => {
      if (source && pricingMode === "auto") {
         const qty = parseInt(currentQty ?? quantity) || 1;
         setSoldPrice(String(getApplicablePrice(source, qty)));
      }
   }, [pricingMode, quantity]);

   const switchPricingMode = useCallback((mode: PricingMode, source?: PricingSource, currentQty?: string) => {
      setPricingMode(mode);
      if (mode === "auto" && source) {
         const q = currentQty ?? quantity;
         if (q) {
            setSoldPrice(String(getApplicablePrice(source, parseInt(q) || 1)));
         }
         setFlatTotal("");
      } else if (mode === "flat-total") {
         setFlatTotal("");
      }
   }, [quantity]);

   const getFinalSoldPrice = useCallback((): number => {
      return computeFinalSoldPrice(pricingMode, soldPrice, flatTotal, quantity);
   }, [pricingMode, flatTotal, quantity, soldPrice]);

   const getFinalTotal = useCallback((): number => {
      return computeFinalTotal(pricingMode, soldPrice, flatTotal, quantity);
   }, [pricingMode, flatTotal, soldPrice, quantity]);

   const reset = useCallback(() => {
      setPricingMode("auto");
      setQuantityRaw("");
      setSoldPrice("");
      setFlatTotal("");
   }, []);

   return {
      pricingMode,
      quantity,
      soldPrice,
      flatTotal,
      setSoldPrice,
      setFlatTotal,
      setQuantity,
      onProductChange,
      switchPricingMode,
      getFinalSoldPrice,
      getFinalTotal,
      reset,
   };
}
