import type { brand } from "../../brand.js";

/**
 * Branded Gwei type - represents Ethereum amounts in gwei (10^9 wei = 10^-9 ETH)
 */
export type GweiType = bigint & { readonly [brand]: "Gwei" };

// Backwards compatibility alias
export type BrandedGwei = GweiType;
