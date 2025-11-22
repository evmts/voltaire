import type { brand } from "../../brand.js";
import type { Uint256Type } from "../../Uint/Uint256Type.js";

/**
 * Branded Ether type - represents Ethereum amounts in ether (10^18 wei)
 */
export type EtherType = Uint256Type & { readonly [brand]: "Ether" };

// Backwards compatibility alias
export type BrandedEther = EtherType;
