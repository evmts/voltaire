import type { BrandedUint } from "../../Uint/BrandedUint/BrandedUint.js";

/**
 * Branded Gwei type - represents Ethereum amounts in gwei (10^9 wei = 10^-9 ETH)
 */
export type BrandedGwei = BrandedUint & { readonly __brand: unique symbol };
