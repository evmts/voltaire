import type { brand } from "../../../brand.js";
import type { Uint256Type } from "../../Uint/Uint256Type.js";

/**
 * Branded Gwei type - represents Ethereum amounts in gwei (10^9 wei = 10^-9 ETH)
 */
export type BrandedGwei = Uint256Type & { readonly [brand]: "Gwei" };
