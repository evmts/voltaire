import type { brand } from "../../../brand.js";
import type { BrandedUint256 } from "../../Uint/BrandedUint256/BrandedUint256.js";

/**
 * Branded Gwei type - represents Ethereum amounts in gwei (10^9 wei = 10^-9 ETH)
 */
export type BrandedGwei = BrandedUint256 & { readonly [brand]: "Gwei" };
