import type { brand } from "../../brand.js";

/**
 * Branded Ether type - represents Ethereum amounts in ether (10^18 wei)
 */
export type EtherType = bigint & { readonly [brand]: "Ether" };

// Backwards compatibility alias
export type BrandedEther = EtherType;
