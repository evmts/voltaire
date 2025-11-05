import type { BrandedUint } from "../../Uint/BrandedUint/BrandedUint.js";

/**
 * Branded Wei type - represents Ethereum amounts in wei (smallest unit: 10^-18 ETH)
 */
export type BrandedWei = BrandedUint & { readonly __brand: unique symbol };
