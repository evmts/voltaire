import type { brand } from "../../../brand.js";
import type { BrandedUint256 } from "../../Uint/BrandedUint256/BrandedUint256.js";

/**
 * Branded Ether type - represents Ethereum amounts in ether (10^18 wei)
 */
export type BrandedEther = BrandedUint256 & { readonly [brand]: "Ether" };
