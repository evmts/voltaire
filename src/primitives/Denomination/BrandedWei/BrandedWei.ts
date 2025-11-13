import type { brand } from "../../../brand.js";
import type { BrandedUint256 } from "../../Uint/BrandedUint256/BrandedUint256.js";

/**
 * Branded Wei type - represents Ethereum amounts in wei (smallest unit: 10^-18 ETH)
 */
export type BrandedWei = BrandedUint256 & { readonly [brand]: "Wei" };
