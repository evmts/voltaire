import type { brand } from "../../../brand.js";
import type { Uint256Type } from "../../Uint/Uint256Type.js";

/**
 * Branded Gwei type - represents Ethereum amounts in gwei (10^9 wei = 10^-9 ETH)
 */
export type GweiType = Uint256Type & { readonly [brand]: "Gwei" };

// Backwards compatibility alias
export type BrandedGwei = GweiType;
