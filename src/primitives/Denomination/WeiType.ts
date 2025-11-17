import type { brand } from "../../../brand.js";
import type { Uint256Type } from "../../Uint/Uint256Type.js";

/**
 * Branded Wei type - represents Ethereum amounts in wei (smallest unit: 10^-18 ETH)
 */
export type WeiType = Uint256Type & { readonly [brand]: "Wei" };

// Backwards compatibility alias
export type BrandedWei = WeiType;
